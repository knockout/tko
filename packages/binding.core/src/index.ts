import { attr } from './attr'
import { checked, checkedValue } from './checked'
import { click } from './click'
import { css } from './css'
import descendantsComplete from './descendantsComplete'
import { enable, disable } from './enableDisable'
import { eventHandler, onHandler } from './event'
import { hasfocus } from './hasfocus'
import { html } from './html'
import $let from './let'
import { options } from './options'
import { selectedOptions } from './selectedOptions'
import { style } from './style'
import { submit } from './submit'
import { text } from './text'
import { textInput } from './textInput'
import { uniqueName } from './uniqueName'
import { value } from './value'
import { visible, hidden } from './visible'
import { using } from './using'

export const bindings = {
  attr,
  checked,
  checkedValue,
  click,
  css,
  class: css,
  descendantsComplete,
  enable,
  event: eventHandler,
  disable,
  hasfocus,
  hasFocus: hasfocus,
  hidden,
  html,
  let: $let,
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
