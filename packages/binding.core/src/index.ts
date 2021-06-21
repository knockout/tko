
import {attr} from './attr.js'
import {checked, checkedValue} from './checked.js'
import {click} from './click.js'
import {css} from './css.js'
import descendantsComplete from './descendantsComplete'
import {enable, disable} from './enableDisable.js'
import {eventHandler, onHandler} from './event.js'
import {hasfocus} from './hasfocus.js'
import {html} from './html.js'
import $let from './let.js'
import {options} from './options.js'
import {selectedOptions} from './selectedOptions.js'
import {style} from './style.js'
import {submit} from './submit.js'
import {text} from './text.js'
import {textInput} from './textInput.js'
import {uniqueName} from './uniqueName.js'
import {value} from './value.js'
import {visible, hidden} from './visible.js'
import {using} from './using.js'

export var bindings = {
  attr,
  checked,
  checkedValue,
  click,
  css,
  'class': css,
  descendantsComplete,
  enable,
  'event': eventHandler,
  disable,
  hasfocus,
  hasFocus: hasfocus,
  hidden,
  html,
  'let': $let,
  on: onHandler,
  options,
  selectedOptions,
  style,
  submit,
  text,
  textInput,
  textinput: textInput,
  uniqueName,
  using,
  value,
  visible
}
