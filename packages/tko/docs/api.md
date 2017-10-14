---
title: Application Programming Interface
---
<table class='pure-table pure-table-horizontal pure-table-striped'>
  <thead>
    <tr>
      <th>Identity</th>
      <th>Purpose</th>
      <th>Source</th>
    </tr>
  </thead>
  <tbody data-bind='foreach: API.items'>
    <tr>
      <td>
        <code>{{ name }}</code>
      </td>
      <td>{{ purpose }}</td>
      <td>
        {{ type }} at
        <a href='{{ url }}'>
          {{ source }}:{{ line }}
        </a>
      </td>
    </tr>
  </tbody>
</table>
