# yasudo - yet another sudo helper for node

An helper to run an `sudo` command with node.

# Install

```sh
npm i @mh-cbon/yasudo --save
```

# Usage

```js
// same as sudo sh -c 'ls -al'
// it will ask for your password
var child = require('@mh-cbon/yasudo')('ls', ['-al']);
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

// in depth options
require('@mh-cbon/yasudo')('ls', ['-al'], {
  password: 'your sudo password, to automatically answer the challenge',
  sudo: {
    // to configure behavior of sudo, see man sudo
    k: true,  // When used without a command, invalidates the user's cached credentials.
    E: true,  // Indicates to the security policy that the user wishes to preserve their existing envi‐
              // -ronment variables.
    i: true,  // Run the shell specified by the target user's password database entry as a login shell.
              // This means that login-specific resource files such as .profile or .login
    K: true,  // Similar to the -k option, except that it removes the user's cached credentials entirely
              // and may not be used in conjunction with a command or other option.
    P: true,  // Preserve the invoking user's group vector unaltered.
    C: 4,     // Close all file descriptors greater than or equal to num before executing a command.
    g: "the group", // Run the command with the primary group set to group
    u: "the user", // Run the command as a user other than the default target user (usually root).
    r: "the role", // Run the command with an SELinux security context that includes the specified role.
    t: "the type", // Run the command with an SELinux security context that includes the specified type.
  }
})

// if one defines an ENV variable with its password,
// then it is possible to run commands automatically
var child = require('@mh-cbon/yasudo', {password: process.env['pwd']})('ls', ['-al']);
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

// last note, it exposes new events : success / faiure
require('@mh-cbon/yasudo')('ls', ['-al'])
.on('success', function () {
  console.log('good to go !')
})
.on('failure', function () {
  console.log('nop the challenge failed too many times')
})
.on('challenged', function (succeed) {
  console.log('Challenge is now complete. succeeded ? %s', succeed)
})
```

# Internals

It works by echoing a `token` on `stdout` and later detects it to determine that `sudo` succeeded.

for sure,
- it does not rely on the output content of `sudo` to detect success/failure
- it does not clutter your output with my token
- it respects `stdio` settings such as `inherit` and `ignore`
- it works seamlessly, even for `stdin`, see [this example](https://github.com/mh-cbon/yasudo/blob/master/examples/stdin.js)

# Todo

- support `ipc` `stdio` setting

# Tests

To run the tests you shall use a command like this :

```sh
pwd=<your sudo password> mocha tests/
```

# Read more

- http://stackoverflow.com/questions/1507816/with-bash-how-can-i-pipe-standard-error-into-another-process
- https://github.com/calmh/node-sudo
