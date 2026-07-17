---
'@tko/binding.foreach': patch
---

Fix `makeTemplateNode` bypassing HTML sanitization for `<script>` foreach templates. Script-template text now
goes through the existing HTML template parsing safeguards, so oversized templates, disallowed nested `<script>`
markup, and `sanitizeHtmlTemplate` apply consistently. Existing apps that intentionally embed `<script>` markup
in foreach script templates should set `allowScriptTagsInTemplates: true`.
