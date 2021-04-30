/**
 * Config for karma.
 */
const fs = require('fs')
const path = require('path')

const pkg = JSON.parse(fs.readFileSync('package.json'))

const COMMON_CONFIG = {
  basePath: process.cwd(),
  frameworks: pkg.karma.frameworks,
  files: pkg.karma.files || [
    { pattern: 'spec/**/*.js', watched: false }
  ],
  preprocessors: {
    'spec/**/*.js': ['esbuild'],
    'spec/**/*.ts': ['esbuild']
  },
  esbuild: {
    // See: https://esbuild.github.io/api/
    format: 'iife',
    bundle: true,
  }
}

module.exports = {COMMON_CONFIG, pkg}
