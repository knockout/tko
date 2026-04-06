var path = require('path');

var createPattern = function(file) {
    return {pattern: file, included: true, served: true, watched: false};
};

var initChai = function(files) {
    //var chaiPath = path.dirname(require.resolve('chai')) + '/../pkg';
    //files.unshift(createPattern(chaiPath + '/chai.js'));
};

initChai.$inject = ['config.files'];

module.exports = {
    'framework:chai': ['factory', initChai]
};



