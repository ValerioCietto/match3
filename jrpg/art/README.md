# JRPG art pages

`menu.html` is the single source for the Characters, Enemies, and Scenery links.
To list a new art page, add its link to the appropriate section in that file.
Current-page highlighting is automatic. Menu layout lives in `menu.css`.

New art pages should include these resources in the head:

```html
<link rel="stylesheet" href="menu.css">
<script src="menu.js" defer></script>
```

Place this at the beginning of the main content:

```html
<div data-art-menu>
  <a class="art-menu-fallback" href="menu.html">Browse Characters, Enemies and Scenery</a>
</div>
```

When served over HTTP, `menu.js` includes the menu HTML in the page. When opened
directly from disk, it embeds the same HTML in an automatically sized frame to
avoid browsers' restrictions on fetching local files. Frame links navigate the
whole page. The fallback link also provides navigation without JavaScript.
