
var pkg       = require('../package.json')
var debug     = require('debug')(pkg.name)
var streams   = require('stream')

// a fake child with customs stdio streams
function FakeChildProcess(c, stdio){
  if([null, false].indexOf(stdio)>-1 || (stdio && (stdio==='pipe' || stdio[1]==='pipe'))) {
    this.stdout = streams.Transform({transform: function(chunk, encoding, next) {
      this.push(chunk);
      next(null);
    },
    flush: function(done) {
      done();
    }})
  }
  if([null, false].indexOf(stdio)>-1 || (stdio && (stdio==='pipe' || stdio[2]==='pipe'))) {
    this.stderr = streams.Transform({transform: function(chunk, encoding, next) {
      this.push(chunk);
      next(null);
    },
    flush: function(done) {
      done();
    }})
  }
  if([null, false].indexOf(stdio)>-1 || (stdio && (stdio==='pipe' || stdio[0]==='pipe'))) {
    this.stdin = streams.Transform({transform: function(chunk, encoding, next) {
      this.push(chunk);
      next(null);
    },
    flush: function(done) {
      done();
    }})
  }

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
    that.stdout && that.stdout.resume().end()
    that.stderr && that.stderr.resume().end()
    that.stdin && that.stdin.resume().end();
  })
}

module.exports = FakeChildProcess;
