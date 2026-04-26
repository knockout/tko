---
title: Examples
description: Interactive examples that show where TKO differs from virtual DOM frameworks.
sidebar:
  label: Overview
  order: 0
---

These examples are meant to make TKO's model visible.

- They focus on observables, bindings, and update locality.
- They are intentionally interactive.
- They are self-contained HTML files you can inspect, copy, or adapt directly.
- They are designed to show what work is happening, not just what UI appears.

## Available examples

- [Honeycomb](/examples/honeycomb.html?view=example): Count naive virtual DOM comparisons against observable updates in a dense interactive field.
- [odoom](/examples/odoom.html?view=example): A tiny WebGL corridor crawler where the HUD, controls, and simulation state stay observable-driven.
- [Spreadsheet](/examples/spreadsheet.html?view=example): Cells as observables, formulas as computeds, and dependency propagation you can edit live.
- [Signal Graph](/examples/signal-graph.html?view=example): Mutate one input and watch only the downstream computed branch recompute.
- [Form Engine](/examples/form-engine.html?view=example): A realistic product form showing dirty state, validation, summaries, and save flow as reactive state.

## Why this section exists

TKO often feels different from virtual DOM frameworks because it connects observable state directly to DOM updates.

That difference is easier to understand when you can interact with it and watch the cost accumulate.
