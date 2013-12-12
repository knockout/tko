module.exports = {
    afterconcat: ['gruntfile.js', '<%= pkg.main %>'],
    options: {
        globals: {
            ko: true
        }
    }
}
