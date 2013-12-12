var net = require('net'),
    chromedriver_started = false;

module.exports = {
  chromedriver: {
    cmd: 'chromedriver',
    args: ['--url-base=/wd/hub', '--port=4445'],
    options: {
      startCheck: function startCheck(stdout, stderr) {
        var client = net.connect({port: 4445},
          function() {
            chromedriver_started = true;
            client.end();
          });
        return chromedriver_started;
      },
      verbose: true
    }
  }
}
