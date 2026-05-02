---
"@tko/binding.if": patch
---

Fix async completion in ConditionalBindingHandler: call completeBinding() for non-rendering branches (if: false, ifnot: true, with: null) and correctly await async descendants via completionPromise instead of awaiting the BindingResult directly.
