module.exports = {
    files: ['src/**/*.js'],
    // test-chromedriver is an (probably poor) alternative to
    // livereload, but it's quick and simple.
    tasks: ['concat', 'test-chromedriver']
}
