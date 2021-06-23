import jss from 'https://cdn.jsdelivr.net/npm/jss@10.6.0/dist/jss.bundle.min.js'
import preset from "https://cdn.jsdelivr.net/npm/jss-preset-default@10.6.0/dist/jss-preset-default.bundle.js"

import { tko } from './tko'

export abstract class TkoComponent extends tko.components.ComponentABC {
  get template () { return <span>hello ${new Date().toISOString()}</span> }
}
