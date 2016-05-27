"use strict";

exports = module.exports = sudo;

var pkg               = require('./package.json')
var debug             = require('debug')(pkg.name)
var randomstring      = require("randomstring");
var spawn             = require('child_process').spawn;
var inpathSync        = require('inpath').sync;
var FakeChildProcess  = require('./lib/fake_child.js')
var mutableStream     = require('./lib/mutable_stream.js')
var detectString      = require('./lib/detect_string.js')
var watchForActivity  = require('./lib/watch_for_activity.js')

var path = process.env['PATH'].split(':');
var sudoBin = inpathSync('sudo', path);

function sudo(bin, args, options) {
    var token = process.env['THEPREDEFINEDTOKEN'] || randomstring.generate();
    var hasSolvedTheChallenge = false;

    args = args || [];
    options = options || {};

    debug('options %j', options);

    var origStdio = JSON.parse(JSON.stringify(options.stdio || false))
    debug('origStdio %j', origStdio);
    options.stdio = normalizeStdio(options.stdio);

    if('password' in options && options.stdio[0]!=="pipe") options.stdio[0] = 'pipe'
    if('password' in options && options.stdio[2]!=="pipe") options.stdio[2] = 'pipe'
    debug('options %j', options);

    var args = buildCmdAsSudoArgs(bin, args, token, options.sudo);
    debug('args %j', args)
    var child = spawn(sudoBin, args, options);

    child.stdout && child.stdout.on('error', erroredStream('child.stdout'))
    child.stdin && child.stdin.on('error', erroredStream('child.stdin'))
    child.stderr && child.stderr.on('error', erroredStream('child.stderr'))

    var fake = new FakeChildProcess(child, origStdio);
    fake.stdin && fake.stdin.pause();

    // Listener to catch the token on stdout, tells us that sudo was successful
    var detectToken = detectString({once:true, token: token+'\n'})
    detectToken.on('error', erroredStream('detectToken'))
    detectToken.once('foundToken', function () {
      debug('hasSolvedTheChallenge %j', true)
      hasSolvedTheChallenge = true;
      child.emit('challenged', hasSolvedTheChallenge)
      child.emit('success')
      //child.stdout.unpipe(detectToken);
    })
    child.stdout = child.stdout.pipe(detectToken);

    if(!origStdio || origStdio==='pipe' || origStdio[1]==='pipe')
      child.stdout && fake.stdout && child.stdout.pipe(fake.stdout);

    var hasEnded = false; // track failure/ending of sudo
    var allDone = function () {
      debug("child.stdin close")
      hasEnded = true;
      if(!hasSolvedTheChallenge) {
        child.emit('challenged', hasSolvedTheChallenge)
        child.emit('failure')
      }
    };
    if (child.stdin) { // this may be unavailable
      child.stdin.on('close', allDone)
    } else {
      child.on('exit', allDone)
    }

    // Automatic pasword typing
    if('password' in options) {

      // watch stderr activity, once it stops to write, input the password
      var activityWatcher = watchForActivity();
      child.stderr.pipe(activityWatcher);

      // once stderr is inactive (sudo wrote its message),
      // write the password to sudo stdin
      activityWatcher.on('inactive', function () {
        if(!hasEnded) {
          var pwd = options.password.replace(/\r$/, '').replace(/\n$/, '')
          debug('typing in pwd %j', pwd)
          child.stdin.write(pwd + '\n');
        } else {
          debug('cannot write password, stdin has ended')
        }
      })

      child.once('challenged', function () {
        child.stderr.unpipe(activityWatcher);
      });

    } else if(options.stdio[0]==="pipe"){

      // Mutable stream to hide the password while the user types it
      var mutableStdout = mutableStream({muted: false, name: 'mutableStdout'});
      mutableStdout.pipe(process.stdout);
      mutableStdout.on('error', erroredStream('mutableStdout'))

      var rl = require('readline').createInterface({
        input: process.stdin,
        output: mutableStdout,
        terminal: true
      });
      rl.on('error', erroredStream('rl'))

      // forward typed in data (the password) to the sudo process
      // use a mutableStream to avoid sending data more than needed to sudo stdin
      var mutableStdin = process.stdin.pipe(mutableStream({muted: false, name: 'mutableStdin'}))
      mutableStdin.pipe(child.stdin)

      // watch stderr activity,
      // when stderr is written, unmute stdout / mute stdin
      // once it stops to write, mute stdout / unmute stdin
      var activityWatcher = watchForActivity();
      activityWatcher.on('error', erroredStream('activityWatcher'))
      child.stderr
      .pipe(watchForActivity())
      .on('error', erroredStream('activityWatcher'))
      .on('active', function () {
        mutableStdout.unmute();
        mutableStdin.mute();
        rl.pause();
      })
      .on('inactive', function () {
        mutableStdout.mute();
        mutableStdin.unmute();
        rl.resume();
      })

      child.once('challenged', function() {
        debug('release');
        rl.close();
        mutableStdout.unpipe(process.stdout);
        process.stdin.unpipe(mutableStdin)
        child.stderr.unpipe(activityWatcher);
      });

      // when the users types in,
      // prevent multiple \r to be buffered
      process.stdin.on('data', function (d) {
        if (d.toString().match(/(\n|\r)$/)) mutableStdin.mute();
      });
      // as stdin is hidden,
      // manually output \n when the user types in \r
      mutableStdin.on('data', function (d) {
        if (d.toString().match(/(\n|\r)$/))
          process.stdout.write('\n');
      });

    }

    // when the password is to provide by hand, we must show stderr to the end user
    if(!('password' in options) && options.stdio[2]==="pipe") {
      child.stderr && child.stderr.pipe(process.stderr);
    }

    // re connect all the pipes accordingly
    child.once('success', function () {
      debug('success origStdio=%s', origStdio);
      child.stdout && child.stdout.unpipe(process.stdout);
      child.stderr && child.stderr.unpipe(process.stderr);

      if(!origStdio || origStdio==='pipe' || origStdio[2]==='pipe')
        child.stderr && fake.stderr && child.stderr.pipe(fake.stderr);
      if(!origStdio || origStdio==='pipe' || origStdio[0]==='pipe')
        child.stdin && fake.stdin && fake.stdin.pipe(child.stdin);

      if(origStdio==='inherit' || origStdio[1]==='inherit')
        child.stdout && child.stdout.pipe(process.stdout);
      if(origStdio==='inherit' || origStdio[2]==='inherit')
        child.stderr && child.stderr.pipe(process.stderr);

      fake.stdin && fake.stdin.resume();
    })

    child.once('challenged', function () {
      if(origStdio==='ignore' || origStdio[0]==='ignore')
        child.stdin && child.stdin.end();
    })

    return fake;
}

function buildCmdAsSudoArgs (bin, args, token, sudoOptions) {
  var sudoArgs = []
  // linearize the command bin to -> sudo sh -c 'your command'
  var command = '' + bin + ' ';
  args.forEach(function (arg){
    command += (''+arg).match(/\s/) ? '"' + arg + '"' : arg;
    command += ' ';
  })

  // inject the token into your command to detect successful sudo,
  // such : sudo sh -c 'echo THETOKEN && your command'
  var sudoArgs = [ '-S', 'sh', '-c', 'echo "' + token + '" && ' + command ];
  // some various sudo options, see man sudo
  if(sudoOptions) {
    if (sudoOptions.k) sudoArgs.unshift('-k')
    if (sudoOptions.E) sudoArgs.unshift('-E')
    if (sudoOptions.i) sudoArgs.unshift('-i')
    if (sudoOptions.K) sudoArgs.unshift('-K')
    if (sudoOptions.P) sudoArgs.unshift('-P')
    if (sudoOptions.C) {
      sudoArgs.unshift('-C')
      sudoArgs.unshift(sudoOptions.C)
    }
    if (sudoOptions.g) {
      sudoArgs.unshift('-g')
      sudoArgs.unshift(sudoOptions.g)
    }
    if (sudoOptions.u) {
      sudoArgs.unshift('-u')
      sudoArgs.unshift(sudoOptions.u)
    }
    if (sudoOptions.r) {
      sudoArgs.unshift('-r')
      sudoArgs.unshift(sudoOptions.r)
    }
    if (sudoOptions.t) {
      sudoArgs.unshift('-t')
      sudoArgs.unshift(sudoOptions.t)
    }
  }
  return sudoArgs;
}

function normalizeStdio (stdio) {
  var ret = []
  // normalize the stdio options to something we can actually manage
  // - preferably use inherit for stdin / stderr (
  //    because sudo use those two, so if possible let the system manages it
  // - stdout is always pipe, to be able to catch the token on it
  if(stdio) {
    if (stdio==='inherit')      ret = ['inherit', 'pipe', 'inherit']
    else if (stdio==='ignore')  ret = ['inherit', 'pipe', 'pipe']   // we cant really ignore.
    else if (stdio==='pipe')    ret = ['pipe', 'pipe', 'pipe']
    else {
      if (stdio[2]!=='pipe') stdio[2] = 'pipe'
      if (stdio[1]!=='pipe') stdio[1] = 'pipe'
      if (stdio[0]==='ignore') stdio[0] = 'pipe'
      ret = stdio;
    }
  } else {
    ret = ['inherit', 'pipe', 'inherit']
  }
  return ret;
}

function erroredStream(name) {
  return function (err) {
    var target = this===process.stderr ? console.log : console.error;
    target(err.stack);
    target("stream '" + name + "' got error %j", err)
  }
}
