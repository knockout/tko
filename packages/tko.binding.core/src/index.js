
import {attr} from './attr.js'
import {checked, checkedValue} from './checked.js'
import {click} from './click.js'
import {css} from './css.js'
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
  attr: attr,
  checked: checked,
  checkedValue: checkedValue,
  click: click,
  css: css,
  'class': css,
  enable: enable,
  'event': eventHandler,
  disable: disable,
  hasfocus: hasfocus,
  hasFocus: hasfocus,
  hidden: hidden,
  html: html,
  'let': $let,
  on: onHandler,
  options: options,
  selectedOptions: selectedOptions,
  style: style,
  submit: submit,
  text: text,
  textInput: textInput,
  textinput: textInput,
  uniqueName: uniqueName,
  using: using,
  value: value,
  visible: visible
}
