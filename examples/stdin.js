var sudo = require('../index.js');
var path = require('path');

var c = sudo(process.argv[0], [path.join(__dirname, '../utils/stdin.js')], {stdio: 'pipe', sudo: {k: true}})

c.stdout && c.stdout.pipe(process.stdout);
c.stderr && c.stderr.pipe(process.stderr);

console.log("stdout %j", !!c.stdout);
console.log("stderr %j", !!c.stderr);
console.log("stdin %j", !!c.stdin);

c.stdin.on('error', console.error.bind(console))
c.stdin.write('some')
c.on('success', function () {
  c.stdin.end('thing')
})
c.on('success', function () {
  console.log("success event")
})

c.on('close', function (code) {
  console.error('c has exited %s', code);
})
