/* eslint semi: 0, indent: 0 */
/* globals require, module, __dirname */
// Karma configuration
// ---
// Make `karma` usable from the command line.
//
// Obtains config from `config.yaml`
//
var fs = require('fs')
var yaml = require('js-yaml')

module.exports = function(karmaConfig) {
  var config = yaml.load(fs.readFileSync('./config.yaml')).karma
  config.resolve = config.resolve || {}
  config.resolve.root = __dirname
  karmaConfig.set(config)
}
