
var pkg       = require('../package.json')
var debug     = require('debug')(pkg.name)
var through2  = require('through2')

function mutableStream(opt){
  opt = opt || {muted: false, name: 'mutableStream'}

  var stream = through2(function (chunk, enc, cb) {
    if (!opt.muted) {
      debug('%s send data %j', opt.name, chunk.toString())
      cb(null, chunk)
    } else {
      cb()
    }
  }, function (cb) {
     opt.muted = true
    debug('%s flush', opt.name)
    cb()
  })

  stream.mute = function (){
    debug('%s muted', opt.name)
    opt.muted = true;
  }

  stream.unmute = function (){
    debug('%s unmuted', opt.name)
    opt.muted = false;
  }

  opt.muted ? stream.mute() : stream.unmute();

  return stream;
}

module.exports = mutableStream;
