# Portfolio comunitario

La identidad y el contenido profesional siguen en `/api/content`. La capa comunitaria es un documento declarativo separado, con contenido profesional protegido y una capa visual de HTML/CSS/JavaScript aislados. Los programas visuales nuevos se guardan como revisiones; no escriben el repositorio ni disparan un deploy por pedido.

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

Cupo de publicaciones configurable por cookie firmada de navegador, no por identidad humana. Borrar cookies o cambiar de dispositivo puede eludir esta aproximación; IP derivada y Turnstile dificultan el abuso. Las cookies llevan HttpOnly, SameSite=Strict y Secure en producción.

Diseño, dibujos vectoriales y animaciones se interpretan mediante componentes propios. Las ilustraciones quedan en tres bandas separadas del contenido. El modo dibujo permite preparar hasta 12 trazos locales, con siete colores y cuatro tamaños de pincel. Para guardarlos entre sesiones se envían por el mismo circuito de publicación: esquema numérico estricto, Turnstile, cupo y dos revisiones visuales independientes. Un prompt o dibujo publicado suma una intervención al contador del navegador. Los enlaces, CV, formularios e identidad son inmutables para el visitante. El botón de diseño original conserva el acceso a la presentación del autor.

## Seguridad y publicación

1. Validación de origen, cookie, texto y límites de entrada.
2. Control persistente por IP derivada (30 envíos/hora); Turnstile validado en servidor, con hostname y acción exactos.
3. Reserva atómica con ETag de revisión base, turno temporal, token utilizado y presupuesto; cupos configurables por navegador/día y control adicional por IP.
4. Generador `claude-haiku-5-5` con salida estructurada y sin herramientas; esquema estricto y validación semántica del motor.
5. Chromium aislado sin acceso a red externa renderiza el mismo App y CSS de producción. Solo sirve imágenes y fuentes locales y medios privados del propietario con identificadores validados. No usa cookies ni sesiones del navegador del usuario.
6. Revisor `claude-sonnet-5-5` en una llamada y contexto separados: comprobación básica de contenido claramente ofensivo, suplantación y datos privados, con ocho vistas de escritorio/móvil y las tres bandas decorativas, más secuencias del canvas cuando hay código visual nuevo y acercamientos de las superficies de dibujo habilitadas. No se rechazan cambios por gusto o falta de pulido. Se cuentan los tokens antes de cada llamada, incluyendo margen conservador para el esquema: generador hasta 90.000 y revisor hasta 20.000. Los colores libres se corrigen automáticamente para mantener contraste y las composiciones usan variantes CSS propias. Los muestreos y la IA no garantizan detectar todo contenido ofensivo.
7. Publicación condicional únicamente ante aprobación completa y revisión base vigente. Errores conservan el diseño anterior. Una pausa/restauración administrativa invalida trabajo en curso.

## Presupuesto y recuperación

Se reservan **USD 0,08 por intento** antes de generar. El límite de USD 10 por mes UTC admite como máximo 125 intentos sin corrección adicional con esta reserva, incluso si cuestan menos. Las reservas anteriores conservan su valor original. Esta reserva conservadora no se devuelve: incluye rechazos, revisiones y resultados de cobro incierto. Se muestra además el consumo medido con las tarifas documentadas de los dos modelos. Revisar esas tarifas antes de cambiar modelos o ampliar límites. Hosting, almacenamiento y verificaciones antibot no forman parte del techo de IA.

La reserva asume los modelos fijos indicados, salidas máximas de 8.000/2.000 tokens, texto acotado y hasta 18 imágenes con tamaño acotado. No hay herramientas ni reintentos de transporte del proveedor. Una propuesta con fallos de calidad puede recibir una única corrección, reservando otros USD 0,08 de forma atómica antes de llamar a la IA. La corrección repite validación técnica y revisión independiente, sin gastar otra participación ni otro intento diario. Si faltan presupuesto o tiempo, se conserva el diseño anterior. Las aportaciones de dibujo se renderizan primero; Haiku evalúa sus imágenes y Sonnet realiza una segunda revisión visual independiente. Solo entonces se agregan a la escena persistente. Cambiar estos límites requiere recalcular la reserva.

Una sola generación global, con plazo máximo de 50 segundos y lease de 70 segundos. Un timeout nunca devuelve presupuesto ni concede participación. Repetir un ID devuelve la solicitud propia sin volver a generar. Los estados publicados consumen un turno de forma atómica con la nueva escena. Una respuesta perdida puede recuperarse mediante el estado privado por ID.

Se conservan hasta 100 revisiones para restaurar. Restaurar o reiniciar pausa las intervenciones y conserva tanto turnos como presupuesto. La cookie del administrador nunca concede derechos a visitantes. La limpieza diaria no elimina la constancia de participación exitosa.

## Verificación

`npm test`, `npm run lint`, `npm run build`, `npm run check`. Las pruebas cubren concurrencia, idempotencia, cuotas, aislamiento, rechazo del esquema, fallos de generación/renderizado/revisión, restauración y retención. Las llamadas reales necesitan las claves anteriores; los dobles de prueba no son una vía activable por variables de producción.

Las pruebas privadas de IA de `/admin` comparten el presupuesto de USD 10 y nunca publican sus propuestas. Las pruebas de flujo con Turnstile se hacen en modo privado desde un navegador de QA autenticado, y se restaura el original antes de habilitar visitantes.

Los pedidos benignos se interpretan creativamente con las capacidades del motor; no se rechazan solo por mencionar una estética o efecto que requiera aproximación. La persistencia compartida del lienzo, colores y tamaños ya son capacidades del producto. Las modificaciones de identidad, código, red o contenido dañino siguen rechazándose.

## Administración de peticiones

El admin ve el texto privado del pedido, tipo de aporte, fecha, estado y motivo. El texto desaparece por retención; las revisiones disponibles siguen permitiendo restauraciones. «Deshacer este cambio» aplica una reversión selectiva: restaura valores visuales solo si siguen siendo los de ese pedido y elimina/restaura su geometría por diferencia de contenido. Conserva los cambios posteriores independientes e informa cuando alguno impide una reversión completa. La operación pausa nuevas intervenciones y no devuelve presupuesto ni participaciones. El botón solo aparece cuando las revisiones necesarias siguen dentro del historial de hasta 100 versiones.

El motor admite colores hexadecimales libres, seis familias tipográficas, cuatro composiciones de cabecera, hasta tres columnas, espaciados, proporciones de imágenes, botones y bordes. El contraste del texto se corrige en código; no se acepta CSS libre ni cambios del contenido profesional.

## Cupos configurables y efectos de puntero

El administrador configura publicaciones por navegador (1–100, inicialmente 5) e intentos diarios (3–50, inicialmente 10). Los registros antiguos equivalen a una intervención; los nuevos acumulan un contador atómico. Rechazos no suman publicaciones; revertir no devuelve cupo. Subir el límite habilita de inmediato nuevas publicaciones para quienes lo habían alcanzado. No se restablecen gastos ni intervenciones anteriores. Se conserva el límite global de presupuesto y el control adicional por IP (al menos diez intentos diarios, o el doble del cupo diario por navegador).

La generación declara `changedFields`: solo se aplican esos campos sobre la escena vigente. Un pedido exclusivo de cursor solo puede modificar `program`, incluso si el modelo devuelve una paleta o composición diferentes. El revisor evalúa seguridad y fidelidad al pedido, leyendo el código además de las vistas. No se sustituye una interacción solicitada por una paleta parecida.

## Motor de código visual

`program` contiene HTML, CSS y JavaScript nuevos escritos por la IA (24.000 caracteres combinados). No es un catálogo cerrado de efectos. El JavaScript define `render({ctx,width,height,pointer,time,scrollY})` y dibuja mediante Canvas 2D; conserva estado entre llamadas. HTML/SVG y CSS agregan composición y animaciones dentro de una capa aislada. La capa recibe coordenadas, clic presionado y scroll; nunca texto de formularios ni datos profesionales.

Se ejecuta dentro de un Web Worker desechable en un iframe con `sandbox="allow-scripts"`, sin same-origin. CSP bloquea red, imágenes externas, otros frames, formularios y cargas de código externo; la capa conserva solo etiquetas y atributos visuales permitidos. El worker no tiene DOM ni APIs de red habilitadas. El host limita resolución a 1280×900 y hasta 30 frames/s; termina el worker si una respuesta tarda más de 200 ms (un segundo para iniciar). El código nunca se evalúa en Node: solo se comprueba su sintaxis. Los workers y el iframe se destruyen al cambiar de versión. Movimiento reducido detiene el render y oculta la capa.

El iframe no recibe eventos directamente ni captura clics/foco. El host recorta sus regiones de pintura para excluir texto, fotos, enlaces y controles protegidos; regiones superpuestas se unen antes de excluirlas. El contenido y la administración quedan en el documento principal. El motor de capturas ejecuta esta misma capa, verifica que arranque sin errores, genera vistas de escritorio/móvil y descarta el cambio ante fallo o timeout. La revisión visual y de fuente reduce riesgos semánticos, pero no garantiza identificar toda gráfica ofensiva ni todos los casos temporales.

Esto permite implementar código visual nuevo sin permisos de repositorio, secretos, red o backend. Cambios de infraestructura, nuevas APIs, autenticación o almacenamiento adicional requieren implementación del propietario; no son permisos concedidos a visitantes.


## Comprobación temporal y corrección acotada

La generación usa esfuerzo `high` y la revisión esfuerzo `medium`, con los límites de tokens indicados. El revisor recibe código, métricas y secuencias reales de movimiento, pausa y reanudación en escritorio y móvil. Antes de publicar se exigen fotogramas suficientes, ausencia de errores y de borrados del canvas en espera, latencia acotada tras los tres fotogramas de calentamiento y —para efectos continuos de puntero— ausencia de desapariciones intermitentes. Las métricas son del presentador confiable, no del código generado. HTML/CSS se revisan visualmente; las mediciones de alfa corresponden al canvas.

Si falla una prueba técnica o el revisor detecta un efecto incompleto/inestable, se entrega el diagnóstico al generador y se permite una sola corrección cuando quedan al menos 35 segundos y se pudo reservar el costo adicional. Fallos de proveedor, seguridad, revisión base o límite de tiempo no disparan reintentos. La propuesta corregida vuelve a pasar por el mismo circuito; si falla, no se publica. `/admin` muestra cuántos fotogramas se probaron y si se utilizó la corrección.

El presentador conserva la imagen anterior mientras espera al worker y reemplaza el fotograma completo al recibirlo; solo redimensiona el canvas cuando cambia su tamaño. Las máscaras de protección se actualizan antes del próximo pintado sin alternar la visibilidad de toda la capa al hacer scroll.


## Etapas independientes y dibujo sobre imágenes

La generación con esfuerzo alto y las pruebas se completan en una invocación; la revisión independiente usa otra, con su propio plazo de hasta 50 segundos. Si hace falta una corrección, se reserva su presupuesto antes y se continúa en otra etapa, seguida de una nueva revisión. Cada etapa renueva un lease de 70 segundos. El navegador continúa automáticamente mediante POST al estado propio con un token de etapa único; repetirlo no vuelve a ejecutar IA ni puede avanzar otra etapa. GET es solo lectura. La cookie del solicitante y el origen se verifican en cada POST; un admin solo puede continuar sus diagnósticos. Una pausa o restauración invalida los tokens y descarta los artefactos pendientes. Nunca hay una publicación intermedia.

Los candidatos, capturas y métricas de la etapa pendiente permanecen en el documento privado, con tamaño acotado, y se eliminan al finalizar, cancelar o expirar. Solo se publica la escena revisada. No se repiten cupos, Turnstile ni participación durante las continuaciones. El consumo medido se acumula por diferencia para no contabilizar dos veces los pasos previos.

`drawingTargets` distingue bandas, foto del hero (`portrait`) e imágenes de proyectos (`projects`). Activar dibujo en una foto no es equivalente al lienzo de bandas. Los trazos numéricos se guardan contra su superficie exacta (`portrait` o `project:<id>`), después de Turnstile y dos revisiones visuales. La foto original y los destinos de enlaces no cambian. Cada aporte aprobado aparece para los siguientes visitantes; los borradores locales no se publican sin ese proceso. Se generan acercamientos de la imagen afectada para moderarla. Las imágenes de proyectos solo reciben eventos de dibujo al activar el modo; sus enlaces siguen accesibles fuera de él. Las coordenadas usan la transformación real del SVG para respetar la rotación de la foto.

El lienzo captura una copia del trazo en cada actualización de React, sin depender de un ref que puede vaciarse al soltar el clic. Una barrera de errores por lienzo permite restablecerlo sin perder el portfolio.

El presupuesto de descarga de JavaScript se ajustó de 230 a 240 KB para las superficies interactivas y las continuaciones; se mantienen las comprobaciones de tamaño, assets, EN/ES, OG y CV.


### Guardado automático de dibujos

El lienzo conserva el borrador numérico en `localStorage` durante un máximo de 30 días, separado por superficie y validado al recuperar. Después de 2,5 segundos sin dibujar se envía automáticamente, con Turnstile y un indicador de estado sin abrir formularios. Se bloquean nuevos trazos durante ese envío para no mezclar versiones. La solicitud guarda su UUID antes del POST; recargar retoma el estado y las etapas de esa misma solicitud sin duplicar el aporte. Los fallos transitorios tienen un solo reintento automático, con nueva verificación antibot, y luego ofrecen reintentar o seguir editando; el borrador nunca se borra por un rechazo. El cupo por navegador, los límites diarios y el presupuesto siguen vigentes. Al aprobarse, se muestra el dibujo compartido y se retiran únicamente los trazos ya guardados del borrador.

Los dibujos manuales usan dos revisiones breves de seguridad sobre acercamientos de su superficie en escritorio y móvil. No regeneran código ni vuelven a probar animaciones preexistentes: se revisa el trazo numérico realmente aportado. Se permiten garabatos, anotaciones, letras decorativas y dibujos sobre la foto; solo se frenan contenidos claramente prohibidos. Los cambios generados mediante prompts conservan sus pruebas de funcionamiento y revisión independiente. Los errores técnicos registran una categoría acotada en administración, sin secretos ni mensajes crudos del proveedor.
