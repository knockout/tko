module.exports = {
    options: {
        banner: '<%= banner %>',
    },
    ksb: {
        files: {
            'dist/<%= pkg.name %>.min.js': ['<%= pkg.main %>']
        }
    }

}
