var sudo = require('../index.js')

var c = sudo('ls', ['-al'], {sudo: {k: true}})

c.stdout && c.stdout.pipe(process.stdout)
c.stderr && c.stderr.pipe(process.stderr)

c.on('success', function () {
  console.log("success event")
})

console.log("stdout %j", !!c.stdout);
console.log("stderr %j", !!c.stderr);
console.log("stdin %j", !!c.stdin);

c.on('close', function (code) {
  console.error('c has exited %s', code);
})
