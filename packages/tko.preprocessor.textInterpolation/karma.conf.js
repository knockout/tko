// Karma configuration
// ---
// Make `karma` usable from the command line.
//
// Obtains config from `config.yaml`
//
var fs = require('fs')
var yaml = require('js-yaml')
var path = require('path')

module.exports = function(karmaConfig) {
    var config = yaml.load(fs.readFileSync('./config.yaml')).karma
    if (config.resolve) { config.resolve.root = __dirname }
    karmaConfig.set(config)
}
