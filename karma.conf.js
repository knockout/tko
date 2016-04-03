// We don't test the CSP; see spec.
// const CSP = `
//     default-src 'none'; \
//     font-src 'none'; \
//     frame-src 'none'; \
//     img-src 'none'; \
//     media-src 'none'; \
//     object-src 'none'; \
//     script-src 'self' localhost:36551; \
//     connect-src ws://localhost:36551; \
//     style-src 'self'; \
//     report-uri /csp
// `.replace(/\s+/g, " ")

module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'sinon', 'chai'],
    browsers: ['PhantomJS'],
    // customHeaders:  {
    //     "Content-Security-Policy": CSP,
    // },
    files: [
        'node_modules/knockout/build/output/knockout-latest.debug.js',
        'src/head.js',
        'src/identifier.js',
        'src/expression.js',
        'src/parser.js',
        'src/provider.js',
        'spec/spec.js'
    ],
    reporters: ['progress'],
  })
}
