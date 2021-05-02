## Animated Transitions

This example shows two ways to animate transitions:

 * When using the `template/foreach` binding, you can provide `afterAdd` and `beforeRemove` callbacks. These let you intercept the code that actually adds or removes elements, so you can trivially use something like jQuery's `slideUp`/`slideDown()` animation methods or similar. To see this in action, switch between different planet types, or add new planets.

 * It's not hard to write a custom Knockout binding that manipulates element states in arbitrary ways according to the value of an observable. Check the HTML source code to see a custom binding called `fadeVisible` that, whenever an observable value changes, uses jQuery's `fadeIn`/`fadeOut` functions to animate the associated DOM element. To see this in action, check and uncheck the "advanced options" checkbox.

<live-example params='id: "animated"'></live-example>

[Try it in jsFiddle](http://jsfiddle.net/rniemeyer/8k8V5/)
