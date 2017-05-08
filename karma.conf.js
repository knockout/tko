/* eslint semi: 0 */
var fs = require('fs')
var yaml = require('js-yaml')

module.exports = function (karmaConf) {
    var config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'));
    var options = config.karma
    options.files = options.files.concat(config.sources, config.spec_files)
    // options.browsers ...
    karmaConf.set(options)
}
