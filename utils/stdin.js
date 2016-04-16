
process.stdin.on('data', function (d) {
  console.log('stdout data %j', d.toString());
  console.error('sterr data %j', d.toString());
  process.stdin.pause();
  // setTimeout(function(){
  //   process.exit(0);
  // }, 500)
});
