module.exports = function (grunt) {
    grunt.registerTask("runner", function () {
        var done = this.async()
        require('../spec/runner.js').init_client()
    });
}
