# Portfolio comunitario

El propietario autorizó el 21/11/2026 publicar intervenciones sin moderación ni protección de identidad. Los visitantes pueden cambiar todos los textos visibles, estructura, estilos, imágenes, enlaces e interacciones de la versión comunitaria. La revisión independiente comprueba funcionamiento y fidelidad al pedido; no juzga contenido ni gusto. Los dibujos manuales se guardan directamente, sin llamadas a IA. El contenido original continúa disponible mediante «Ver diseño original» y permanece separado en `/api/content`.

## Motor y aislamiento

La escena guarda código HTML, CSS y JavaScript, hasta 24.000 caracteres combinados, en un documento privado de Blob. No se escribe el repositorio por cada intervención. `program.layer=page` ejecuta código DOM real sobre una copia completa del portfolio en un iframe de origen opaco con `sandbox=allow-scripts`. Puede cambiar o reemplazar el contenido público y crear herramientas, juegos, formularios y nuevas interacciones. Los efectos Canvas anteriores siguen funcionando en su worker desechable.

El código visitante no recibe cookies, claves, sesión de administrador, acceso al documento padre ni APIs de escritura del contenido original. CSP impide conexiones HTTP arbitrarias, frames anidados y envío directo de formularios. Las imágenes y fuentes públicas pueden cargarse; los enlaces externos se abren separados. El administrador y el botón original viven fuera del documento generado. El código nunca se ejecuta en Node; allí solo se analiza la sintaxis. El runtime restaura navegación, menú, idioma y contacto originales, salvo que el código los modifique deliberadamente.

SDK disponible dentro del documento: `community.viewport`, `community.sendContact({name,email,message,_gotcha:""})` y `community.data.get/set/increment/append`. Contacto usa exclusivamente el Formspree existente, con gesto real de usuario, campos acotados y límite de frecuencia. El almacén JSON compartido usa `/api/community/data` y otro documento privado, `community/runtime.json`: hasta 100 claves, 32 KB por valor y 128 KB totales. Sus valores son públicos y no deben contener secretos. Las escrituras requieren cookie firmada y mismo origen, tienen idempotencia, límites de frecuencia y actualización condicional por ETag. Pausar detiene también estas escrituras. Restaurar una revisión revierte su código; los datos compartidos permanecen independientes.

## Flujo automático

Un pedido de 3–500 caracteres atraviesa validación de origen, cookie, Turnstile y cupos; reserva presupuesto antes de llamar al proveedor. El generador `claude-haiku-5-5` devuelve código y campos modificados. Chromium ejecuta el resultado con recursos locales, sin red externa, en escritorio y móvil. Los programas DOM incorporan pasos de interacción y aserciones visibles. Se recogen excepciones y fotogramas; el revisor `claude-sonnet-5-5` comprueba únicamente que se haya implementado lo pedido y funcione. Una corrección automática puede reparar errores con reserva adicional.

Generación, ejecución y revisión son etapas internas separadas de hasta 50 segundos. El navegador las continúa automáticamente con nonce de un solo uso mientras muestra la animación de proceso. No hay aprobación manual intermedia. La publicación se hace con ETag contra la revisión de partida; una restauración o pausa invalida los pendientes. Un error técnico conserva la versión anterior y permite reintentar. Un resultado idéntico que ya cumple el pedido no consume otra publicación. No se repite una llamada de proveedor ante resultado de cobro incierto.

## Dibujos

`drawingTargets` admite `page`, `portrait`, `projects` y `bands`. `page` permite dibujar sobre cualquier posición del portfolio, incluyendo textos e imágenes. Las imágenes tienen superficies propias y coordenadas transformadas; continúan editables en el documento generado. Los trazos son datos numéricos validados, no SVG arbitrario. Se guardan automáticamente tras 2,5 segundos de pausa, sin moderación ni costo de IA; mantienen Turnstile y cupos. Recargar recupera el borrador local y retoma la misma solicitud por UUID sin duplicarla. Un error conserva el borrador; un error del lienzo queda aislado del resto de la página.

## Configuración y límites operativos

Variables de producción: `ANTHROPIC_API_KEY`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `COMMUNITY_SESSION_SECRET`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET` y credenciales del administrador. Las claves nunca llegan al cliente. Turnstile permite `www.pablocarvalho.dev` y `pablocarvalho.dev`, acción `portfolio-change`. No usar claves de prueba en producción.

Cupos configurables desde `/admin`: publicaciones por navegador 1–100 (inicialmente 5) e intentos diarios 3–50 (inicialmente 10). La cookie representa un navegador, no una persona. HttpOnly, Secure en producción y SameSite=Strict; IP derivada mediante HMAC y límites persistentes adicionales. Presupuesto mensual de IA: USD 10; reserva conservadora de USD 0,08 por generación y otra igual para una reparación, sin devolución ante cobro incierto. Dibujos directos no reservan IA. Hosting y Blob quedan separados. Una sola generación global en curso.

Los prompts permanecen privados, con retención de 30 días y limpieza diaria autenticada. Hasta 100 revisiones permiten restauración y reversión selectiva. El admin ve el pedido original, estado, consumo, pruebas y correcciones, puede pausar, restaurar y deshacer. Deshacer pausa nuevas intervenciones y conserva cambios posteriores independientes cuando es posible; el código de un programa es una unidad de reversión. Los cupos y el presupuesto no se devuelven por una reversión.

## Verificación y despliegue

`npm test`, `npm run lint`, `npm run build`, `npm run check`. Pruebas de concurrencia, UUID repetidos, reservas, continuaciones, aislamiento, runtime minificado, dibujo, guardado, almacenamiento compartido, errores y reversión. El build conserva licencias en `/THIRD_PARTY_LICENSES.txt`, prerenderiza ES/EN y verifica OG, CV, assets y presupuesto de JavaScript de 250 KB sin comprimir.

Los diagnósticos privados desde `/admin` llaman a los modelos y Chromium reales, comparten el presupuesto y nunca publican ni consumen participación. Casos: cambios de texto a «Hola», dibujo en toda la página y contador interactivo. Las pruebas con visitante real se hacen en privado; luego se deshace únicamente el aporte de prueba y se reanuda el experimento.
