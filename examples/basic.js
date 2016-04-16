var sudo = require('../index.js')

var c = sudo('sh', ['-c', 'ls -al && echo "strstderr" 1>&2 '], {sudo: {k: true}})

c.stdout && c.stdout.pipe(process.stdout)
c.stderr && c.stderr.pipe(process.stderr)

c.on('success', function () {
  console.log("success event")
})

c.on('failure', function () {
  console.log("failure event")
})

console.log("stdout %j", !!c.stdout);
console.log("stderr %j", !!c.stderr);
console.log("stdin %j", !!c.stdin);

c.on('exit', function (code) {
  console.error('c has exited %s', code);
})
