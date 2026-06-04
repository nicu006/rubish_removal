# Assets

Design files and unused media kept out of the site root.

## `source/`

Original uploads not wired into the live site (e.g. alternate hero backgrounds, extra illustrations).

## `archive/`

Older or unused copies moved from `public/images/` so the public folder only contains files referenced by the website.

## Live images

All images used on the site live under:

```
public/images/
  brand/        — logo
  backgrounds/  — page backgrounds
  skips/        — skip hire sizes & hero
  bags/         — skip bag collection
  icons/        — service page icons
  about/        — about page photos
  coverage/     — coverage CTA illustration
```

When adding a new image, place it in the matching subfolder and reference it from HTML/CSS as `images/<folder>/<file>`.
