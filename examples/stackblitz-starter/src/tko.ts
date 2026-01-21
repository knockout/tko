import tko from '@tko/build.reference/dist/build.reference.es6';

// Customize TKO here.

window.React = {createElement: tko.jsx.createElement}

export default tko;
