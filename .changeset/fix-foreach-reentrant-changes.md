---
"@tko/binding.foreach": patch
---

Fix `foreach` dropping array changes made from inside its own callbacks (for
example an `afterRender` that pushes or removes items). Such changes are now
processed in a follow-up pass; previously the DOM drifted out of sync with the
array and the next removal threw `Cannot read properties of undefined (reading
'first')`. The `arrayChange` subscription is now set up before the initial
render so changes made during it are not missed either.
