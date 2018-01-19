/**
 * This is a BindingString subclass that converts `function () {}` to lambas,
 * for backwards compatibility.
 *
 */

const FUNCTION_REX = /\bfunction\s*\(\s*\)\s*{\s*(?:return\s+([^}]+?)\s*)?}/g

export default function functionRewrite (bindingString) {
  return bindingString.replace(FUNCTION_REX, (match, rv) => {
    if (!functionRewrite.silent) {
      console.log(`Knockout: Replace "${match}" with "=> ${rv}"`)
    }
    return `=> ${rv}`
  })
}
