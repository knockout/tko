---
title: Text Binding
---


# `text`

### Purpose
The `text` binding causes the associated DOM element to display the text value of your parameter.

Typically this is useful with elements like `<span>` or `<em>` that traditionally display text, but technically you can use it with any element.

### Example
```tsx
const myMessage = ko.observable('Hello, world!')

<>
  <p>Type a message: <input ko-textInput={myMessage} /></p>
  <p>Today's message is: <span ko-text={myMessage}></span></p>
</>
```

```html
Today's message is: <span data-bind="text: myMessage"></span>
```

```javascript
var viewModel = {
    myMessage: ko.observable() // Initially blank
};
viewModel.myMessage("Hello, world!"); // Text appears

ko.applyBindings(viewModel);
```

In TSX, `ko-text={...}` takes normal JavaScript expressions. Define the values you need before the JSX, then bind them directly.


### Parameters

 * Main parameter

   Knockout sets the element's content to a text node with your parameter value. Any previous content will be overwritten.

   If this parameter is an observable value, the binding will update the element's text whenever the value changes. If the parameter isn't observable, it will only set the element's text once and will not update it again later.

   If you supply something other than a number or a string (e.g., you pass an object or an array), the displayed text will be equivalent to `yourParameter.toString()`

 * Additional parameters

   * None

### Note 1: Using functions and expressions to determine text values

If you want to determine text programmatically, one option is to create a [computed observable](/computed/computedobservables/), and use its evaluator function as a place for your code that works out what text to display.

For example,

```tsx
const price = ko.observable(24.95)
const priceRating = ko.pureComputed(() => (price() > 50 ? 'expensive' : 'affordable'))

<>
  <p>Price: $<span ko-text={price}></span></p>
  <p>The item is <span ko-text={priceRating}></span> today.</p>
  <p>
    <button ko-click={() => price(Math.max(0, price() - 30))}>Lower price</button>
    <button ko-click={() => price(price() + 30)}>Raise price</button>
  </p>
</>
```

```html
The item is <span data-bind="text: priceRating"></span> today.
```

```javascript
var viewModel = {
    price: ko.observable(24.95)
};
viewModel.priceRating = ko.pureComputed(function() {
    return this.price() > 50 ? "expensive" : "affordable";
}, viewModel);

ko.applyBindings(viewModel);
```

Now, the text will switch between "expensive" and "affordable" as needed whenever `price` changes.

In HTML, you don't need to create a computed observable if you're doing something simple like this. You can pass an arbitrary JavaScript expression to the `text` binding. In TSX, make that derived value a computed so it stays reactive. For example,

```tsx
const price = ko.observable(24.95)
const priceDescription = ko.pureComputed(() => (price() > 50 ? 'expensive' : 'affordable'))

<>
  <p>Price: $<span ko-text={price}></span></p>
  <p>The item is <span ko-text={priceDescription}></span> today.</p>
  <p><button ko-click={() => price(price() > 50 ? 24.95 : 74.95)}>Toggle price range</button></p>
</>
```

```html
The item is
<span data-bind="text: price() > 50 ? 'expensive' : 'affordable'"></span>
today.
```

This has exactly the same result. In the HTML version the binding expression stays reactive on its own; in TSX the computed keeps the derived text reactive.

### Note 2: About HTML encoding

Since this binding sets your text value using a text node, it's safe to set any string value without risking HTML or script injection. For example, if you wrote:

```javascript
viewModel.myMessage("<i>Hello, world!</i>");
```

... this would *not* render as italic text, but would render as literal text with visible angle brackets.

If you need to set HTML content in this manner, see [the html binding](../html-binding/).

### Note 3: Using "text" without a container element

Sometimes you may want to set text using Knockout without including an extra element for the `text` binding. For example, you're not allowed to include other elements within an `option` element, so the following will not work.

```html
<select data-bind="foreach: items">
    <option>Item <span data-bind="text: name"></span></option>
</select>
```

To handle this, you can use the *containerless syntax*, which is based on comment tags.

```html
<select data-bind="foreach: items">
  <option>Item <!--ko text: name--><!--/ko--></option>
</select>
```

The `<!--ko-->` and `<!--/ko-->` comments act as start/end markers, defining a "virtual element" that contains the markup inside. Knockout understands this virtual element syntax and binds as if you had a real container element.
