
import {
  ComponentABC
} from './ComponentABC'

import jss from 'jss'
import preset from 'jss-preset-default'

jss.setup(preset())

/**
 * A Knockout Component that supports JSS and JSX (and Javascript, hence JJJ).
 */
export class ComponentJJJ extends ComponentABC {
  /**
   * Overload this to return an JSS styles object.
   */
  jss () { return {} }

  /**
   * Access the localized sheets with `css.class`.
   */
  get css () {
    if (!this._jss_sheet) {
      this._jss_sheet = jss.createStyleSheet(this.jss)
      this._jss_sheet.attach()
    }
    return this._jss_sheet
  }
}
