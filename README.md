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

## Administrador del portfolio

`/admin` permite editar proyectos, orden y visibilidad, textos completos en español e inglés, experiencia, capacidades, clientes, enlaces, foto y CV. Los archivos JPG/PNG/WebP/PDF se suben desde el editor (máximo 3 MB). Los APK se enlazan mediante su URL de descarga.

Los datos se guardan en un Vercel Blob **privado** conectado al proyecto. `content/current.json` contiene la versión vigente y `content/history/` conserva la anterior antes de cada publicación. Cada guardado comprueba la revisión y el ETag para evitar sobrescribir cambios de otra sesión. El portfolio carga la versión guardada desde `/api/content` y conserva el HTML prerenderizado como respaldo si la red falla. Los cambios editoriales aparecen al cargar la página; el HTML estático se actualiza en los despliegues.

### Configuración del servidor

- `BLOB_READ_WRITE_TOKEN`: conexión al almacenamiento privado de Vercel.
- `ADMIN_PASSWORD_HASH`: `salt:hash`, con hash scrypt de 64 bytes en hexadecimal.
- `ADMIN_SESSION_SECRET`: secreto aleatorio de al menos 32 bytes para firmar sesiones.

Los secretos se configuran en Vercel, nunca en variables `VITE_`, código ni Git. La sesión dura 8 horas, usa cookie HttpOnly/Secure/SameSite=Strict y se invalida al cambiar el hash de contraseña. Las escrituras verifican origen y formato JSON. El acceso limita a 8 intentos por IP por intervalos de 15 minutos, con contadores persistentes privados; requiere la cabecera de IP sobrescrita por Vercel. No alojar estas funciones detrás de un proxy que acepte esa cabecera sin reemplazarla.

### Desarrollo y pruebas

`npm test` prueba autenticación, CSRF, firmas de sesión, validación, guardado persistente, conflictos, archivos y limitación de intentos. Usa almacenamiento temporal aislado.

Para desarrollo, crear `.generated/admin/local.env` con los dos secretos de administración y `PORTFOLIO_LOCAL_STORE=.generated/admin/local-store`. Ejecutar `npm run dev:api` y, en otra terminal, `npm run dev`: Vite redirige `/api` a `127.0.0.1:4317`. El almacenamiento local es solo para desarrollo, no para producción.

Antes de cerrar el editor, guardar o exportar el borrador con **Exportar copia**. El backend guarda únicamente contenido público; las credenciales están separadas. Los archivos subidos son accesibles públicamente mediante su URL en `/api/media`; no subir documentos confidenciales. El servidor no acepta SVG, HTML ni JavaScript como archivos.
