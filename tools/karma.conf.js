/**
 * Config for karma.
 */
const fs = require('fs')
const { Buffer } = require('buffer')
const { createInstrumenter } = require('istanbul-lib-instrument')

const {argv} = process
const {SAUCE_USERNAME, SAUCE_ACCESS_KEY} = process.env

const pkg = JSON.parse(fs.readFileSync('package.json'))

const coveragePlugin = {
  name: 'code-coverage',
  setup(build) {
    if(!argv.includes('--coverage'))
      return

    coverageInstrumenter = createInstrumenter({ esModules: true })

    build.onEnd((result) => {
      const js = result.outputFiles.find(f => f.path.match(/\.js$/))
      const sourceMap = result.outputFiles.find(f => f.path.match(/\.js\.map$/))
      const sourceMapObject = JSON.parse(sourceMap.text)
      sourceMapObject.sourceRoot = '/'

      const instrumented = coverageInstrumenter.instrumentSync(js.text, null, sourceMapObject)
      js.contents = Buffer.from(instrumented)
    })
  }
}

const basePath = process.cwd()

const CommonConfig = {
  basePath: basePath,
  frameworks: pkg.karma.frameworks,
  files: pkg.karma.files || [
    { pattern: 'spec/**/*.js', watched: false },
    { pattern: 'spec/**/*.ts', watched: false }
  ],
  reporters: ['progress', 'coverage'],
  preprocessors: {
    'spec/**/*.js': ['esbuild'],
    'spec/**/*.ts': ['esbuild']
  },
  esbuild: {
    // See: https://esbuild.github.io/api/
    format: 'iife',
    sourcemap: "external",
    bundle: false,
    plugins: [coveragePlugin],
    define: {
      BUILD_VERSION: '"test"',
    }
  },
  // configure the reporter
  coverageReporter: {
      // specify a central output directory
      dir: '../../coverage-temp/',
      reporters: [        
        { type: 'json', subdir: '.', file: basePath.substring(basePath.lastIndexOf('/')+1) + '_report.json' }
      ]
    }
}


/**
 * Configuration for testing in Sauce Labs browsers.
 */
 const VERSIONS_SYM = Symbol('Versions List')

 // For options, see https://saucelabs.com/platforms
 // https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/
 //
 // NOTE:  When a selection below is unavailable the following unhelpful error
 // is produced from webdriver.js:
 //
 // TypeError: Cannot read property 'value' of undefined
 //
 const SauceBrowsers = {
   CHROME: {
     base: 'SauceLabs',
     browserName: 'chrome',
     [VERSIONS_SYM]: ['latest']//, 50, 45, 40, 35, 30]
   },

   FIREFOX: {
     base: 'SauceLabs',
     browserName: 'firefox',
     [VERSIONS_SYM]: ['latest']
   },

   SAFARI: {
     base: 'SauceLabs',
     browserName: 'safari',
     [VERSIONS_SYM]: ['latest']
   },

   EDGE: {
     base: 'SauceLabs',
     browserName: 'microsoftedge',
     [VERSIONS_SYM]: ['latest']
   },

   // 🚨  The iPhone emulater on SauceLabs requires a huge connectionRetryTimeout
   // because its startup time is around 90 seconds.
   // IOS_SAFARI: {
   //   base: 'SauceLabs',
   //   browserName: 'iphone',
   //   version: 'latest'
   // },

   launchersFor (browser) {
     const BROWSER = SauceBrowsers[browser]
     return BROWSER[VERSIONS_SYM].map(
       v => ({ [`SL_${browser}_${v}`]: Object.assign({version: v}, BROWSER) })
     )
   }
 }

 const SauceLaunchers = Object.assign(
   ...SauceBrowsers.launchersFor('CHROME'),
   ...SauceBrowsers.launchersFor('FIREFOX'),
  //  ...SauceBrowsers.launchersFor('SAFARI')
   // ...SauceBrowsers.launchersFor('EDGE'),
 )


function sauceConfig (config) {
  if (!SAUCE_USERNAME) {
    throw new Error('Environment needs SAUCE_USERNAME')
  }
  if (!SAUCE_ACCESS_KEY) {
    throw new Error('Environment needs SAUCE_ACCESS_KEY')
  }
  config.set({
    ...CommonConfig,
    sauceLabs: {
      testName: `${pkg.name} @ ${pkg.version}`,
      startConnect: argv.includes('--startConnect'),
      public: 'public',
      recordVideo: false,
      recordScreenshots: false,
    },
    colors: true,
    captureTimeout: 120000,
    browserDisconnectTimeout: 100000,
    browserNoActivityTimeout: 100000,
    customLaunchers: SauceLaunchers,
    browsers: Object.keys(SauceLaunchers),
    reporters: ['dots', 'saucelabs'],
    singleRun: true
  })
}

function localConfig(config, browser) {
  const baseconfig = {
    ...CommonConfig,
    electronOpts: {
      frame: false,
      resizable: false,
      focusable: false,
      show: false,
      fullscreenable: false,
      hasShadow: false
    },
    client: {
      args: argv,
    },
    //browserDisconnectTimeout: 100000,
    //browserNoActivityTimeout: 100000,
    browsers: ['Electron'],
    debug: argv.includes('--debug'),
    debugger: argv.includes('--debug'),
    //logLevel: "DEBUG",
    singleRun: argv.includes('--once')
  }

  if(browser.useChrome) {
    const chrome = {
      browsers: ['testRunnerChrome'],
      customLaunchers: {
        testRunnerChrome: {
          base: "ChromeHeadless",
          flags: ["--no-sandbox", 
            "--remote-debugging-address=0.0.0.0",
            "--remote-debugging-port=9222"]
        }      
      }
    }
    Object.assign(baseconfig, chrome)
  } else if (browser.useFirefox) {
    const ff = {
      browsers: ['testRunnerFireFox'],
      customLaunchers: {
        testRunnerFireFox: {
          base: "Firefox",
          flags: ["-headless"],
          prefs: {
            'network.proxy.type': 0
          }
        }        
      }
    }
    Object.assign(baseconfig, ff)
  }

  config.set(baseconfig)
}

module.exports = (config) => {
  if (argv.includes('--sauce')) {
    sauceConfig(config)
  } else {
    const browser = {
      useChrome: argv.includes('--headless-chrome'),
      useFirefox: argv.includes('--headless-firefox')
    }
    localConfig(config, browser)
  }
}
