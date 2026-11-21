# Documento editable con componentes reales

Actualización: 21/11/2026.

El pedido de alinear el botón del lienzo y elevar la marca del retrato se publicó sin cumplirlo: el botón estaba en una capa externa a la copia editable, el selector del span era incorrecto y la prueba solo comprobaba la existencia del contenedor. No alcanzaba con renderizar sin excepciones.

Se evaluaron dos opciones. Extender el puente de estilos hacia componentes del host mantendría dos árboles DOM y exigiría reconciliar selectores, geometría, estilos y eventos para cada nuevo control. Montar la aplicación React real dentro del documento editable permite que todos sus elementos públicos, incluidos controles de dibujo, pertenezcan al mismo árbol y usen sus manejadores originales. Se adopta la segunda.

El host conserva exclusivamente publicación, verificación antibot, credenciales y recuperación. El documento opaco recibe contenido público y una copia validada del borrador numérico. Los componentes originales y la intervención HTML/CSS/JS se ejecutan juntos; los estilos afectan a los elementos reales. Nuevos widgets pueden usar `community.React` y `community.createRoot`. El dibujo conserva sus coordenadas y lógica React; los puentes transportan solo borradores numéricos y solicitudes delimitadas a los servicios existentes. Nunca se ejecuta código generado en Node.

La identidad del documento depende del programa, contenido e idioma. Consultar disponibilidad o recibir el mismo JSON con referencias nuevas no recarga el iframe. Cambios de trazos y estado de guardado se entregan como mensajes y conservan las interacciones existentes.

El generador recibe el HTML actual con sus controles, CSS base y programa previo. Las modificaciones se acumulan y se publican para todos mediante revisiones compartidas, sin generar commits por cada visitante. Las pruebas ejecutan el mismo App React con recursos propios y adaptadores privados de servicios. Una modificación de CSS exige aserciones de estilos: el navegador mide propiedades sobre el selector concreto usando CSS Typed OM. El revisor recibe los valores obtenidos y la auditoría de selectores con cero coincidencias, además de las capturas. Los resultados publicados no conservan como error vigente un fallo ya corregido.

Se mantienen el aislamiento de origen, CSP, cuotas y reversión administrativa. El runtime comparte módulos React con la página principal para evitar duplicar la descarga; sus módulos públicos tienen CORS explícito para el origen opaco. La compilación comprueba también el tamaño del punto de entrada embebido.
