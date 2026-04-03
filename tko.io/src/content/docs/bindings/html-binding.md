---
title: Html Binding
---


# `html`

### Purpose
The `html` binding causes the associated DOM element to display the HTML specified by your parameter.

Typically this is useful when values in your view model are actually strings of HTML markup that you want to render.

<div class='alert alert-danger'>
  <h4 class="alert-heading">Script Injection</h4>
  <p>
  	The `html` binding can be used to inject arbitrary code.  Without proper sanitization (which is notoriously difficult), or a strong Content Security Policy, you should be
  	mindful of the <code>html</code> binding.
  </p>
</div>

### Example
```html
<div data-bind="html: details"></div>
```

```javascript
var viewModel = {
  details: ko.observable() // Initially blank
};
viewModel.details("<em>Read the latest notes in <a href='/llms.txt'>llms.txt</a>.</em>"); // HTML content appears
```

### Parameters

 * Main parameter

   KO clears the previous content and then sets the element's HTML from your parameter value.

   If this parameter is an observable value, the binding will update the element's content whenever the value changes. If the parameter isn't observable, it will only set the element's content once and will not update it again later.

   If you supply something other than a number or a string (e.g., you pass an object or an array), the `innerHTML` will be equivalent to `yourParameter.toString()`

 * Additional parameters

   * None

### Note: About HTML encoding

Since this binding sets your element's content using `innerHTML`, you should be careful not to use it with untrusted model values, because that might open the possibility of a script injection attack.  If you cannot guarantee that the content is safe to display (for example, if it is based on a different user's input that was stored in your database), then you can use [the text binding](../text-binding/), which will set the element's text value using `innerText` or `textContent` instead.
