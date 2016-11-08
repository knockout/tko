
import {attr} from './src/attr.js';
import {checked, checkedValue} from './src/checked.js';
import {click} from './src/click.js';
import {css} from './src/css.js';
import {enable, disable} from './src/enableDisable.js';
import {eventHandler, onHandler} from './src/event.js';
import {hasfocus} from './src/hasfocus.js';
import {html} from './src/html.js';
import $let from './src/let.js';
import {options} from './src/options.js';
import {selectedOptions} from './src/selectedOptions.js';
import {style} from './src/style.js';
import {submit} from './src/submit.js';
import {text} from './src/text.js';
import {textInput} from './src/textInput.js';
import {uniqueName} from './src/uniqueName.js';
import {value} from './src/value.js';
import {visible, hidden} from './src/visible.js';
import {using} from './src/using.js';

export var bindings = {
    attr: attr,
    checked: checked,
    checkedValue: checkedValue,
    click: click,
    css: css, 'class': css,
    enable: enable,
    'event': eventHandler,
    disable: disable,
    hasfocus: hasfocus, hasFocus: hasfocus,
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
};