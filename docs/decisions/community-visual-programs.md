# Código visual comunitario aislado

La versión inicial interpretaba escenas de un catálogo cerrado. Eso permitió un fallo de fidelidad: un cursor de burbujas se convirtió en una paleta, sin crear interacción de puntero.

Se evaluaron dos opciones: permitir commits y ejecuciones de código de repositorio por visitante, o separar el programa visual del sitio profesional. La primera otorga acceso innecesario a APIs, configuración de despliegue y contenido, y requiere infraestructura separada de builds/revisión con costos adicionales. Se adopta la segunda: código HTML/CSS/JS visual nuevo dentro de un iframe opaco, JavaScript en worker terminable, datos profesionales y administración en el host.

El modelo no está limitado a efectos predefinidos: puede escribir algoritmos gráficos e interacciones nuevos. El contrato de entrada es numérico (puntero, tiempo, viewport, scroll), no datos del propietario. El host recorta zonas protegidas y nunca interpreta mensajes como comandos de navegación, escritura o cambio de permisos. Presentación general mantiene los controles seguros de composición y tema. No se promete que cualquier funcionalidad de servidor o edición de la estructura profesional pueda implementarse desde esta capa.

La validación comprueba tamaño y sintaxis sin ejecutar en Node; luego Chromium aislado verifica el arranque, produce capturas y un segundo modelo evalúa seguridad y correspondencia con el pedido. Fuente y estado se publican atómicamente con el cupo; revertir restaura también el programa anterior. El límite mensual de IA se conserva con una reserva ajustada a USD 0,08 por propuesta, más USD 0,08 si necesita la única corrección permitida.

Referencias: [sandbox de iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe), [terminación de workers](https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate), [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas), [CSP worker-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src).
