/**
 * This is a BindingString subclass that converts `function () {}` to lambas,
 * for backwards compatibility.
 *
 */

const FUNCTION_REX = /\bfunction\s*\(([^)]*)\)\s*\{\s*(?:(return\s)?([^}]+?)[;\s]*)?\}/g

export default function functionRewrite (bindingString) {
  return bindingString
    .replace(FUNCTION_REX, (match, args, returnKeyword, rv) => {
      if (rv && !returnKeyword) {
        rv += ' && undefined'
      }
      const out = `(${args.trim()}) => ${rv}`
      if (!functionRewrite.silent) {
        console.log(`Knockout: Replace "${match}" with "${out}"`)
      }
      return out
  })
}
