# Speaking Arcane

Mobile-first tarot microblog built with `TypeScript`, `Vite`, and `Phaser`.

## Open-source assets

- Rider–Waite card imagery in `public/cards/` is based on public-domain source material and adapted for the site atmosphere.
- UI sounds in `public/sounds/` are taken from the CC0 Kenney Interface Sounds pack:
  [https://kenney.nl/assets/interface-sounds](https://kenney.nl/assets/interface-sounds)
- Earlier temporary sound files may still be present locally, but the app uses the current `.wav` set referenced from `src/ui/audio.ts`.

## GitHub Pages deployment

- The repository includes `.github/workflows/deploy-pages.yml` for automatic deployment to GitHub Pages on every push to `main`.
- In GitHub repository settings, set `Pages -> Build and deployment -> Source` to `GitHub Actions`.
- `vite.config.ts` computes the correct `base` automatically for standard project pages such as `https://<user>.github.io/<repo>/`.
- For root-site repos like `<user>.github.io` or custom deploy paths, you can override the base with `BASE_PATH=/custom-path/ pnpm build`.
