# Pablo Carvalho — portfolio

Bilingual portfolio, selected projects and downloadable resumes. React 18 + Vite, with prerendered HTML for English (`/`) and Spanish (`/es/`). Production builds do not depend on a running application server.

## Develop and verify

```sh
npm ci
npm run dev
npm run lint
npm run build
npm run check
npm run preview
```

`npm run build` produces both static pages, localized metadata, and a small React client for the mobile menu, scroll reveals and contact form. The content remains available before JavaScript runs. Animations respect `prefers-reduced-motion`.

## Edit content

- `src/content.js`: bilingual copy, experience, project references and contact links.
- `src/App.jsx`: page structure and progressive interactions.
- `src/index.css`: responsive design and motion.
- `scripts/prerender.mjs`: canonical URLs, language alternates, Open Graph, Twitter cards and structured data.
- `public/og/portfolio-v2.png`: self-hosted 1200×630 social preview. Use a new filename when replacing it to refresh social caches, and update its references in `index.html`, `scripts/prerender.mjs` and `scripts/verify-build.mjs`.

## Resumes and visual assets

The production build uses the checked-in PDFs, WebP images and WOFF2 fonts, so Python is not required on Vercel. To regenerate them locally, install Pillow, reportlab, fonttools and brotli, then run:

```sh
python scripts/prepare-media.py
python scripts/generate-resumes.py
```

- CV source and verified dates: `scripts/generate-resumes.py`.
- English PDF: `public/cv/Pablo_Carvalho_EN.pdf`.
- Spanish PDF: `public/cv/Pablo_Carvalho_ES.pdf`.
- Original artwork: `design/`; existing project screenshots and source fonts: `src/assets/`.
- The portrait is a lighting/clarity edit of the existing profile photograph. The social cover was generated from the same personal brand direction. The Android TV and YouTube visuals are interaction illustrations, not product screenshots.

The contact form retains the existing Formspree endpoint. It supports native validation, a honeypot, pending/error/success states, cancellation and a request timeout. Do not send test inquiries to production without intending to deliver a message.

## Deployment

Push to the existing `main` branch to trigger the connected Vercel deployment. `vercel.json` preserves the Android app association header and sets cache policies for the versioned social image, fonts and replaceable CV files. Verify `/`, `/es/`, both CV links and `/og/portfolio-v2.png` after deployment.
