require('should')

if (!process.env['pwd']) {
  console.error('You must give me your sudo password!\n')
  console.error('Usage:\npwd=<your password> npm run test')
  process.exit(1)
}

process.env['THEPREDEFINEDTOKEN'] = 'THETOKENPREDEFINED'

var path = require('path')
var spawn = require('child_process').spawn;

describe('basic example', function () {
  it('should ask the password', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/basic.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i)
      stdout.should.match(/stdout true/)
      stdout.should.match(/stderr true/)
      stdout.should.match(/stdin true/)
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    setTimeout(function () {
      c.kill();
    }, 500)
  });
  it('should display the command output', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/basic.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stdout.should.match(/drwxrwxr/);
      stderr.should.match(/has exited 0/i)
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.end(process.env['pwd'] + '\n')
  });
  it('should fail properly', function (done) {
    this.timeout(10000);
    var c = spawn('node', [path.join(__dirname, '../examples/basic.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stderr.should.match(/(incorrect)/i);
      stderr.should.match(/has exited 1/i)
      stdout.should.match(/stdout true/);
      stdout.should.not.match(/strstderr/);
      stderr.should.not.match(/strstderr/);
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.write('nop\r')
    c.stdin.write('nop\r')
    c.stdin.end('nop\r')
  });
})

describe('basic_no_stdout example', function () {
  it('should ask the password', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/basic_no_stdout.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i)
      stdout.should.match(/stdout false/)
      stdout.should.match(/stderr true/)
      stdout.should.match(/stdin false/)
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    setTimeout(function () {
      c.kill();
    }, 500)
  });
  it('should not display the command stdout', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/basic_no_stdout.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stdout.should.not.match(/drwxrwxr/);
      stdout.should.not.match(/strstderr/);
      stderr.should.match(/has exited 0/i)
      stderr.should.match(/strstderr/i)
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.end(process.env['pwd'] + '\n')
  });
  it('should fail properly', function (done) {
    this.timeout(10000);
    var c = spawn('node', [path.join(__dirname, '../examples/basic_no_stdout.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stderr.should.match(/(incorrect)/i);
      stderr.should.match(/has exited 1/i)
      stdout.should.match(/stdout false/);
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.write('nop\r')
    c.stdin.write('nop\r')
    c.stdin.end('nop\r')
  });
})

describe('basic_no_stderr example', function () {
  it('should ask the password', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/basic_no_stderr.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i)
      stdout.should.match(/stdout true/)
      stdout.should.match(/stderr false/)
      stdout.should.match(/stdin false/)
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    setTimeout(function () {
      c.kill();
    }, 500)
  });
  it('should not display the command stderr', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/basic_no_stderr.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stdout.should.match(/drwxrwxr/);
      stdout.should.not.match(/strstderr/);
      stderr.should.match(/has exited 0/i)
      stderr.should.not.match(/strstderr/i)
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.end(process.env['pwd'] + '\n')
  });
  it('should fail properly', function (done) {
    this.timeout(10000);
    var c = spawn('node', [path.join(__dirname, '../examples/basic_no_stderr.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stderr.should.match(/(incorrect)/i);
      stderr.should.match(/has exited 1/i)
      stdout.should.match(/stdout true/);
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.write('nop\r')
    c.stdin.write('nop\r')
    c.stdin.end('nop\r')
  });
})


describe('ignored pipe example', function () {
  it('should ask the password', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/ignored.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i)
      stdout.should.match(/stdout false/)
      stdout.should.match(/stderr false/)
      stdout.should.match(/stdin false/)
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    setTimeout(function () {
      c.kill();
    }, 500)
  });
  it('should not display the command output', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/ignored.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stdout.should.not.match(/drwxrwxr/);
      stderr.should.match(/has exited 0/i)
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.end(process.env['pwd'] + '\n')
  });
  it('should fail properly', function (done) {
    this.timeout(10000);
    var c = spawn('node', [path.join(__dirname, '../examples/ignored.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stderr.should.match(/(incorrect)/i);
      stderr.should.match(/has exited 1/i)
      stdout.should.match(/stdout false/);
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.write('nop\r')
    c.stdin.write('nop\r')
    c.stdin.end('nop\r')
  });
})

describe('inherited pipe example', function () {
  it('should ask the password', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/inherited.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i)
      stdout.should.match(/stdout false/)
      stdout.should.match(/stderr false/)
      stdout.should.match(/stdin false/)
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    setTimeout(function () {
      c.kill();
    }, 500)
  });
  it('should display the command output', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/inherited.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stdout.should.match(/drwxrwxr/);
      stderr.should.match(/has exited 0/i)
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.end(process.env['pwd'] + '\n')
  });
  it('should fail properly', function (done) {
    this.timeout(10000);
    var c = spawn('node', [path.join(__dirname, '../examples/inherited.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stderr.should.match(/(incorrect)/i);
      stderr.should.match(/has exited 1/i)
      stdout.should.match(/stdout false/);
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.write('nop\r')
    c.stdin.write('nop\r')
    c.stdin.end('nop\r')
  });
})


describe('stdin pipe example', function () {
  it('should ask the password', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/stdin.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i)
      stdout.should.match(/stdout true/)
      stdout.should.match(/stderr true/)
      stdout.should.match(/stdin true/)
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(process.env['pwd'])
      stdout.should.not.match(process.env['pwd'])
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    setTimeout(function () {
      c.kill();
    }, 500)
  });
  it('should display the command output', function (done) {
    this.timeout(5000)
    var c = spawn('node', [path.join(__dirname, '../examples/stdin.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stdout.should.match(/stdout true/)
      stdout.should.match(/stderr true/)
      stdout.should.match(/stdin true/)
      stdout.should.match(/stdout data "something"\n/)
      stderr.should.match(/has exited 0/i)
      stdout.should.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(process.env['pwd'])
      stdout.should.not.match(process.env['pwd'])
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.write(process.env['pwd'] + '\r')
  });
  it('should fail properly', function (done) {
    this.timeout(10000);
    var c = spawn('node', [path.join(__dirname, '../examples/stdin.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.match(/(mot de passe|password)/i);
      stderr.should.match(/(incorrect)/i);
      stderr.should.match(/has exited 1/i)
      stdout.should.match(/stdout true/);
      stdout.should.match(/stderr true/);
      stdout.should.match(/stdin true/);
      stderr.should.not.match(/drwxrwxr-x/);
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(process.env['pwd'])
      stdout.should.not.match(process.env['pwd'])
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
    c.stdin.write('nop\r')
    c.stdin.write('nop\r')
    c.stdin.write('nop\r')
  });
})




describe('password option example', function () {
  it('should not ask the password', function (done) {
    var c = spawn('node', [path.join(__dirname, '../examples/pwd_opt.js')], {stdio: 'pipe'})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.not.match(/(mot de passe|password)/i)
      stderr.should.match(/has exited 0/i)
      stdout.should.match(/stdout true/)
      stdout.should.match(/stderr true/)
      stdout.should.match(/stdin true/)
      stdout.should.match(/drwxrwxr-x/);
      stdout.should.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
  });
  it('should fail properly', function (done) {
    this.timeout(10000);
    var env = Object.create( process.env );
    env.pwd = 'something wrong'
    var c = spawn('node', [path.join(__dirname, '../examples/pwd_opt.js')], {stdio: 'pipe', env: env})
    var stderr = '';
    var stdout = '';
    c.stderr.on('data', function (d) {
      stderr += d.toString()
    })
    c.stdout.on('data', function (d) {
      stdout += d.toString()
    })
    c.on('exit', function (){
      stderr.should.not.match(/(mot de passe|password)/i)
      stderr.should.match(/has exited 1/i)
      stdout.should.match(/stdout true/)
      stdout.should.match(/stderr true/)
      stdout.should.match(/stdin true/)
      stdout.should.not.match(/drwxrwxr-x/);
      stdout.should.not.match(/success event/)
      stdout.should.not.match(/THETOKENPREDEFINED/)
      stderr.should.not.match(/THETOKENPREDEFINED/)
      done();
    })
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
  });
})
