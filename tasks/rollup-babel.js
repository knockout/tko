
const plugin = require('rollup-plugin-babel')

const options = {
  exclude: 'node_modules/**',
  presets: [
    [require.resolve('babel-preset-es2015'), { modules: false }],
    require.resolve('babel-preset-stage-0'),
  ],
  plugins: [
    require.resolve('babel-plugin-external-helpers'),
    [require.resolve('babel-plugin-transform-es2015-classes'), { loose: true }],
    require.resolve('babel-plugin-transform-proto-to-assign')
  ],
  babelrc: false
}


module.exports = { plugin, options }