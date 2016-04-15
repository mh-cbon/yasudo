
process.stdin.on('data', function (d) {
  console.log('got data %j', d.toString());
  process.exit(0);
});
