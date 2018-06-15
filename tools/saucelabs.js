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
const SL_BROWSERS = {
  CHROME: {
    base: 'SauceLabs',
    browserName: 'chrome',
    [VERSIONS_SYM]: ['latest', 60, 55]//, 50, 45, 40, 35, 30]
  },

  FIREFOX: {
    base: 'SauceLabs',
    browserName: 'firefox',
    [VERSIONS_SYM]: ['latest', 55, 50]
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

  IE: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    [VERSIONS_SYM]: [11, 10, 9]
  },

  // 🚨  The iPhone emulater on SauceLabs requires a huge connectionRetryTimeout
  // because its startup time is around 90 seconds.
  // IOS_SAFARI: {
  //   base: 'SauceLabs',
  //   browserName: 'iphone',
  //   version: 'latest'
  // },

  launchersFor (browser) {
    const BROWSER = SL_BROWSERS[browser]
    return BROWSER[VERSIONS_SYM].map(
      v => ({ [`SL_${browser}_${v}`]: Object.assign({version: v}, BROWSER) })
    )
  }
}

const SAUCE_LAUNCHERS = Object.assign(
  ...SL_BROWSERS.launchersFor('CHROME'),
  ...SL_BROWSERS.launchersFor('FIREFOX'),
  ...SL_BROWSERS.launchersFor('SAFARI')
  // ...SL_BROWSERS.launchersFor('EDGE'),
  // ...SL_BROWSERS.launchersFor('IE')
)

module.exports = { SAUCE_LAUNCHERS }
