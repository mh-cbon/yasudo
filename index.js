"use strict";

exports = module.exports = sudo;

var pkg = require('./package.json')
var debug = require('debug')(pkg.name)
var randomstring = require("randomstring");
var streams = require('stream')
var spawn = require('child_process').spawn;
var inpathSync = require('inpath').sync;

var path = process.env['PATH'].split(':');
var sudoBin = inpathSync('sudo', path);

function sudo(bin, args, options) {
    var token = process.env['THEPREDEFINEDTOKEN'] || randomstring.generate();
    var hasSolvedTheChallenge = false;

    var options = options || {};
    var origStdio = JSON.parse(JSON.stringify(options.stdio || false))
    // normalize the stdio options to something we can actually manage
    // preferable use inherit for stdin / stderr (because sudo use those two, so if possible let the system manages it)
    // stdout is always pipe, to be able to catch the token on it
    if(options.stdio) {
      if (options.stdio==='inherit') options.stdio = ['inherit', 'pipe', 'inherit']
      else if (options.stdio==='ignore') options.stdio = ['inherit', 'pipe', 'inherit'] // we cant really ignore.
      else if (options.stdio==='pipe') options.stdio = ['pipe', 'pipe', 'pipe']
      if (options.stdio[1]!=="pipe") throw 'fd1 (stdout) must be "pipe"'
    }

    if(!options.stdio) options.stdio = ['inherit', 'pipe', 'inherit']
    if(options.password && options.stdio[0]!=="pipe") options.stdio[0] = 'pipe'
    if(options.password && options.stdio[2]!=="pipe") options.stdio[2] = 'pipe'

    debug('origStdio %j', origStdio)
    debug('options %j', options)

    // linearize the command bin to do : sudo sh -c 'your command'
    var command = '' + bin + ' ';
    args.forEach(function (arg){
      command += arg.match(/\s/) ? '"' + arg + '"' : arg;
      command += ' ';
    })

    // injecct the toen to detect successfull sudo into your command
    // such : sudo sh -c 'echo THETOKEN && your command'
    var args = [ '-S', 'sh', '-c', 'echo "' + token + '" && ' + command ];
    // some various sudo options, see man sudo
    if(options.sudo) {
      if (options.sudo.k) args.unshift('-k')
      if (options.sudo.E) args.unshift('-E')
      if (options.sudo.i) args.unshift('-i')
      if (options.sudo.K) args.unshift('-K')
      if (options.sudo.P) args.unshift('-P')
      if (options.sudo.C) {
        args.unshift('-C')
        args.unshift(options.sudo.C)
      }
      if (options.sudo.g) {
        args.unshift('-g')
        args.unshift(options.sudo.g)
      }
      if (options.sudo.u) {
        args.unshift('-u')
        args.unshift(options.sudo.u)
      }
      if (options.sudo.r) {
        args.unshift('-r')
        args.unshift(options.sudo.r)
      }
      if (options.sudo.t) {
        args.unshift('-t')
        args.unshift(options.sudo.t)
      }
    }
    debug('args %j', args)
    var child = spawn(sudoBin, args, options);

    var fake = new FakeChildProcess(child, options);

    // Listener to catch the token on stdout, tells that sudo was successfull
    child.stdout.on('data', function challengeSuccess(d) {
      if(d.toString().match(token)) {
        debug('hasSolvedTheChallenge %j', true)
        hasSolvedTheChallenge = true;
        child.stdout.removeListener('data', challengeSuccess)
         // Connect the pipe so the fake child can get data
        child.stdout && fake.stdout && child.stdout.pipe(fake.stdout);
        child.stderr && fake.stderr && child.stderr.pipe(fake.stderr);
        child.stdin && fake.stdin && fake.stdin.pipe(child.stdin);
        child.emit('success')
      }
    })

    // Automatic pasword typing
    if(options.password) {
      var waitToInputPwd; // Wait stderr does not have activity anymore.
      var hasEnded = false; // if it fails, at some point the stream ends, we should then stop to write it.
      var askForChallenge = function (d) {
        clearTimeout(waitToInputPwd);
        waitToInputPwd = setTimeout(function () {
          debug('typing in pwd %j', options.password)
          if(!hasEnded) {
            child.stdin.write(options.password + '\n');
            process.stderr.write('\n'); // simulate user typing [Enter]
          } else {
            debug('cannot write password, stdin has ended')
          }
        }, 100)
      };
      var cleanUp = function (d) {
        if(hasSolvedTheChallenge) {
          child.stderr.removeListener('data', askForChallenge);
          child.stdout.removeListener('data', cleanUp);
        }
      };
      child.stderr.on('data', askForChallenge);
      child.stdout.on('data', cleanUp);
      child.stdin.on('end', function () {
        hasEnded = true;
      })

    } else if(options.stdio[0]==="pipe"){

      var hasEnded = false; // if it fails, at some point the stream ends, we should then stop to write it.
      // Mutable stream to not show the password while the user types it
      var waitToResumeInput;
      var Writable = require('stream').Writable;
      var mutableStdout = new Writable({
        write: function(chunk, encoding, callback) {
          if (!this.muted) process.stdout.write(chunk, encoding);
          callback();
        }
      });

      mutableStdout.muted = false;

      var rl = require('readline').createInterface({
        input: process.stdin,
        output: mutableStdout,
        terminal: true
      });
      rl.pause();
      var muter = function (d) {
        mutableStdout.muted = false;
        if(!hasSolvedTheChallenge) {
          clearTimeout(waitToResumeInput);
          waitToResumeInput = setTimeout(function () {
            mutableStdout.muted = true;
            rl.resume();
          }, 100)
        }
      }
      child.stderr.on('data', muter)

      // forward typed in data (the password) to the sudo child
      var writeProcessStdin = function (d) {
        if(!hasEnded){
          d = d.toString();
          child.stdin.write(d);
          if (d.match(/\r$/)) process.stdout.write('\n'); // simulate user typing [Enter]
          debug('forwarding stdin %j', d)
        } else {
          debug('cannot forward data, stdin has ended')
        }
      };
      process.stdin.on('data', writeProcessStdin);
      child.on('close', function () {
        child.stderr && child.stderr.unpipe(process.stderr);
        process.stdin.removeListener('data', writeProcessStdin);
        process.stdin.pause();
      })
      child.stdin.on('end', function () {
        hasEnded = true;
      })
    }

    if(!options.password && options.stdio[2]==="pipe"){ // required to show the prompt
      child.stderr && child.stderr.pipe(process.stderr);
    }

    if(origStdio==='inherit'){ // simulate inherit option
      child.once('success', function () {
        child.stdout && child.stdout.pipe(process.stdout);
      })
    }

    function FakeChildProcess(c, options){
      // it expects normaized sdtio options
      if(origStdio===false || (origStdio && (origStdio==='pipe' || options==='pipe'))) {
        this.stdout = streams.Transform({transform: function(chunk, encoding, next) {
          this.push(chunk);
          next(null);
        },
        flush: function(done) {
          done();
        }})
      }
      if(origStdio===false || (origStdio && (origStdio==='pipe' || options==='pipe'))) {
        this.stderr = streams.Transform({transform: function(chunk, encoding, next) {
          this.push(chunk);
          next(null);
        },
        flush: function(done) {
          done();
        }})
      }
      if(origStdio===false || (origStdio && (origStdio==='pipe' || options==='pipe'))) {
        this.stdin = streams.Transform({transform: function(chunk, encoding, next) {
          this.push(chunk);
          next(null);
        },
        flush: function(done) {
          done();
        }})
      }

      debug("origStdio %j", origStdio);

      this.pid = c.pid;
      this.kill = c.kill.bind(c);
      this.on = c.on.bind(c);
      this.once = c.once.bind(c);
      this.removeAllListeners = c.removeAllListeners.bind(c);
      this.removeListener = c.removeListener.bind(c);
      this.addListener = c.addListener.bind(c);
      this.emit = c.emit.bind(c);
      this.getMaxListeners = c.getMaxListeners.bind(c);
      this.setMaxListeners = c.setMaxListeners.bind(c);
      this.listenerCount = c.listenerCount.bind(c);
      this.listeners = c.listeners.bind(c);
      var that = this;
      c.once('close', function (code) {
        debug('fake close %j', code)
        that.stdout && that.stdout.end()
        that.stderr && that.stderr.end()
        that.stdin && that.stdin.end()
      })
    }

    return fake;
}
