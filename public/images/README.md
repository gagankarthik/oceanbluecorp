# Landing imagery

Site images are now configured centrally in **`src/components/landing/media.ts`**
(verified Unsplash CDN URLs — business / tech / team). To rebrand:

- **Swap a stock photo:** edit the URL in `media.ts` (one place, all pages update).
- **Use your own photos:** drop files into this folder and point the `media.ts`
  entry at `"/images/your-file.jpg"`.

Every image renders through `<Photo>`, which falls back to a clean Ocean-Blue
gradient if a URL ever fails — so the site never shows a broken image.
