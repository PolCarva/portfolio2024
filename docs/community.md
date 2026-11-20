# Portfolio comunitario

La identidad y el contenido profesional siguen en `/api/content`. La capa comunitaria es un documento declarativo separado, sin HTML, CSS, JavaScript, URLs ni texto público arbitrarios. Nunca se cambia código ni se dispara un deploy por un pedido.

## Activación

Configurar en Vercel **Production**:

- `ANTHROPIC_API_KEY`: proyecto dedicado con acceso a `claude-haiku-5-5` y `claude-sonnet-5-5`. Las claves nunca llegan al cliente.
- `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`: widget Managed, autorizado para `www.pablocarvalho.dev` y `pablocarvalho.dev`. La acción debe ser `portfolio-change`.
- `COMMUNITY_SESSION_SECRET`: secreto aleatorio de al menos 32 bytes; si falta, se usa el secreto del administrador. Rotarlo invalida identificadores de visitantes; mantenerlo estable.
- `CRON_SECRET`: secreto aleatorio para la limpieza diaria autenticada. La tarea diaria de Vercel elimina el texto de los pedidos dentro del plazo de 30 días y descarta los intentos fallidos antiguos; conserva metadatos mínimos de los cambios publicados para auditoría y participación. Verificar su configuración y la autenticación del endpoint antes de habilitar el experimento.
- `BLOB_READ_WRITE_TOKEN` y credenciales del administrador: ya existentes.

Hacer un deploy después de configurar las variables. El estado inicial está **pausado** y en modo privado, incluso con claves presentes. El administrador puede activar pruebas privadas; los demás visitantes siguen viendo la última versión pública y no pueden publicar. Desde `/admin` → Experimento comunitario, verificar el motor de capturas. Antes de habilitar públicamente, comprobar un pedido real con Anthropic y Turnstile, revisar el resultado y restaurar el diseño original. No activar claves de prueba de Turnstile en producción.

## Experiencia

Un pedido de 3–500 caracteres. El cliente explica el procesamiento con IA y la retención antes del envío. El visitante ve una animación durante la construcción. Al publicarse, se cierra la espera y el portfolio aplica el resultado automáticamente para recorrerlo; los rechazos muestran una explicación localizada. El texto original del pedido no se publica.

Una participación exitosa por cookie firmada de navegador, no por identidad humana. Borrar cookies o cambiar de dispositivo puede eludir esta aproximación; IP derivada y Turnstile dificultan el abuso. Las cookies llevan HttpOnly, SameSite=Strict y Secure en producción.

Diseño, dibujos vectoriales y animaciones se interpretan mediante componentes propios. Las ilustraciones quedan en tres bandas separadas del contenido. El modo dibujo permite preparar hasta 12 trazos locales, con siete colores y cuatro tamaños de pincel. Para guardarlos entre sesiones se envían por el mismo circuito de publicación: esquema numérico estricto, Turnstile, cupo y dos revisiones visuales independientes. Un prompt o un dibujo publicado consume la participación del navegador. Los enlaces, CV, formularios e identidad son inmutables para el visitante. El botón de diseño original conserva el acceso a la presentación del autor.

## Seguridad y publicación

1. Validación de origen, cookie, texto y límites de entrada.
2. Control persistente por IP derivada (30 envíos/hora); Turnstile validado en servidor, con hostname y acción exactos.
3. Reserva atómica con ETag de revisión base, turno temporal, token utilizado y presupuesto; tres generaciones por navegador/día y diez por IP/día.
4. Generador `claude-haiku-5-5` con salida estructurada y sin herramientas; esquema estricto y validación semántica del motor.
5. Chromium aislado sin JavaScript ni acceso a red externa renderiza el mismo App y CSS de producción. Solo sirve imágenes y fuentes locales y medios privados del propietario con identificadores validados. No usa cookies ni sesiones del navegador del usuario.
6. Revisor `claude-sonnet-5-5` en una llamada y contexto separados: comprobación básica de contenido claramente ofensivo, suplantación y datos privados, con ocho vistas estáticas de escritorio/móvil y las tres bandas decorativas. No se rechazan cambios por gusto o falta de pulido. Se cuentan los tokens antes de cada llamada, incluyendo margen conservador para el esquema: generador hasta 90.000 y revisor hasta 8.000. Los colores libres se corrigen automáticamente para mantener contraste y las composiciones usan variantes CSS propias. Los muestreos y la IA no garantizan detectar todo contenido ofensivo.
7. Publicación condicional únicamente ante aprobación completa y revisión base vigente. Errores conservan el diseño anterior. Una pausa/restauración administrativa invalida trabajo en curso.

## Presupuesto y recuperación

Se reservan **USD 0,05 por intento** antes de generar. El límite de USD 10 por mes UTC admite como máximo 200 intentos con esta reserva, incluso si cuestan menos. Las reservas anteriores conservan su valor original. Esta reserva conservadora no se devuelve: incluye rechazos, revisiones y resultados de cobro incierto. Se muestra además el consumo medido con las tarifas documentadas de los dos modelos. Revisar esas tarifas antes de cambiar modelos o ampliar límites. Hosting, almacenamiento y verificaciones antibot no forman parte del techo de IA.

La reserva asume los modelos fijos indicados, salidas máximas de 8.000/1.000 tokens, texto acotado y hasta 8 imágenes con tamaño acotado. No hay herramientas ni reintentos automáticos del proveedor. Las aportaciones de dibujo se renderizan primero; Haiku evalúa sus imágenes y Sonnet realiza una segunda revisión visual independiente. Solo entonces se agregan a la escena persistente. Cambiar estos límites requiere recalcular la reserva.

Una sola generación global, con plazo máximo de 50 segundos y lease de 70 segundos. Un timeout nunca devuelve presupuesto ni concede participación. Repetir un ID devuelve la solicitud propia sin volver a generar. Los estados publicados consumen un turno de forma atómica con la nueva escena. Una respuesta perdida puede recuperarse mediante el estado privado por ID.

Se conservan hasta 100 revisiones para restaurar. Restaurar o reiniciar pausa las intervenciones y conserva tanto turnos como presupuesto. La cookie del administrador nunca concede derechos a visitantes. La limpieza diaria no elimina la constancia de participación exitosa.

## Verificación

`npm test`, `npm run lint`, `npm run build`, `npm run check`. Las pruebas cubren concurrencia, idempotencia, cuotas, aislamiento, rechazo del esquema, fallos de generación/renderizado/revisión, restauración y retención. Las llamadas reales necesitan las claves anteriores; los dobles de prueba no son una vía activable por variables de producción.

Las pruebas privadas de IA de `/admin` comparten el presupuesto de USD 10 y nunca publican sus propuestas. Las pruebas de flujo con Turnstile se hacen en modo privado desde un navegador de QA autenticado, y se restaura el original antes de habilitar visitantes.

Los pedidos benignos se interpretan creativamente con las capacidades del motor; no se rechazan solo por mencionar una estética o efecto que requiera aproximación. La persistencia compartida del lienzo, colores y tamaños ya son capacidades del producto. Las modificaciones de identidad, código, red o contenido dañino siguen rechazándose.

## Administración de peticiones

El admin ve el texto privado del pedido, tipo de aporte, fecha, estado y motivo. El texto desaparece por retención; las revisiones disponibles siguen permitiendo restauraciones. «Deshacer este cambio» aplica una reversión selectiva: restaura valores visuales solo si siguen siendo los de ese pedido y elimina/restaura su geometría por diferencia de contenido. Conserva los cambios posteriores independientes e informa cuando alguno impide una reversión completa. La operación pausa nuevas intervenciones y no devuelve presupuesto ni participaciones. El botón solo aparece cuando las revisiones necesarias siguen dentro del historial de hasta 100 versiones.

El motor admite colores hexadecimales libres, seis familias tipográficas, cuatro composiciones de cabecera, hasta tres columnas, espaciados, proporciones de imágenes, botones y bordes. El contraste del texto se corrige en código; no se acepta CSS libre ni cambios del contenido profesional.
