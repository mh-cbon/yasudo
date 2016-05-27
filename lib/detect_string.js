
var pkg       = require('../package.json')
var debug     = require('debug')(pkg.name)
var through2  = require('through2')

function detectString(opt){
  var detected = false;
  opt = opt || {once: true, token: null}
  return through2(function (chunk, enc, cb) {
    if (opt.token && !detected || !opt.once){
      if(chunk.toString().substr(0, opt.token.length)===opt.token) {
        detected = true;
        this.emit('foundToken')
        chunk = chunk.toString().substr(opt.token.length)
      }
    }
    cb(null, chunk)
  })
}

module.exports = detectString;
