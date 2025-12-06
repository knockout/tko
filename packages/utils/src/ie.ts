//
// Detection and Workarounds for Internet Explorer
//
import options from './options'

const ieVersion = options.document && (function () {
  
  let version = 3;
  const div = options.document.createElement('div');
  const iElems = div.getElementsByTagName('i')

    // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
  while (
        div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
        iElems[0]
    ) {}

  if (!version) {
    const userAgent = window.navigator.userAgent
    // Detect IE 10/11
    return userAgent.match(/MSIE ([^ ]+)/) || userAgent.match(/rv:([^ )]+)/)
  }
  return version > 4 ? version : undefined
  
}())

const isIe6 = ieVersion === 6
const isIe7 = ieVersion === 7

export { ieVersion, isIe6, isIe7 }
