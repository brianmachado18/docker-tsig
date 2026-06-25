\[Título de Artículo\]

\[Primer Autor\]

\[email@address\]

\[Segundo Autor\]

\[email@address\]

\[Tercer Autor\]

\[email@address\] \[Cuarto Autor\]  
\[email@address\]

**RESUMEN**
GeoTravel es una aplicación web SIG orientada a la gestión de recorridos turísticos sobre un mapa interactivo, que integra visualización, edición y consulta espacial de rutas, zonas y atracciones. La solución implementa dos formas de diseño de recorridos: dibujo manual de la geometría sobre el mapa y armado a partir de paradas seleccionadas, con cálculo automático del trazado sobre calles reales mediante servicios de ruteo, optimización del orden de las paradas y persistencia de atributos operativos como estado, duración, guía y vigencia estacional. 

**Palabras Clave**
GIS, Servicios Web GIS, Servicios Web, GeoServer, OpenLayers, Spring Boot, Docker, Postgis 

# INTRODUCCIÓN
Las aplicaciones geográficas de uso general ofrecen una cobertura amplia, pero no siempre brindan información suficiente para contextos locales específicos. En el caso del turismo en Uruguay, esto se vuelve especialmente visible: aunque herramientas como Google Maps permiten ubicarse y orientarse, buena parte de la información relevante depende de aportes de la comunidad y no siempre aparece integrada de forma completa o consistente.

GeoTravel busca cubrir ese vacío mediante una aplicación web SIG centrada en el territorio uruguayo, que reúne en un solo lugar atracciones, recorridos y zonas turísticas. De este modo, el usuario accede a información organizada y contextualizada, con opciones para explorar destinos y consultar indicaciones de manera más directa. El trabajo se enmarca en la edición 2026 de la asignatura Taller de Sistemas de Información Geográficos Empresariales.

(Pendiente de completar)__El resto del documento se organiza de la siguiente manera. La sección 2 presenta \[…\]. En la sección 3 \[…\]. Por último, en la sección \[…\] se presentan las conclusiones del trabajo.__

# MARCO CONCEPTUAL

\[En esta sección se introducen resumidamente los conceptos que puedan ser necesarios para la comprensión del artículo. En esta sección se pueden incluir las definiciones básicas del curso: web services, web services geográficos, clientes SIG, BD Geográficas\] En esta sección se describen varios conceptos que \[…\].

## \[Concepto 1\]

\[Breve descripción del concepto 1.\]

## \[Concepto 2\]

\[Breve descripción del concepto 2.\]

# DESCRIPCIÓN DEL PROBLEMA

\[En esta sección se describe el problema planteado. Incluir aquí toda la documentación teórica\]

El problema planteado consiste en el estudio del estándar \[…\].

Este estándar se aplica en \[…considerar las funcionalidades macro, el objetivo del estándar.\].

Además, se plantean como tarea adicional probar el producto… \[ que implementa el estándar\].

Por último, se debe implementar un prototipo de Servidor de Mapas accediendo a una BD Geográfica con datos de prueba provistos en el curso \[….\].

# SOLUCIÓN PLANTEADA

\[En esta sección se describe de forma general lo que se hizo, o sea, de todo lo planteado en la sección 3, a qué se llegó. Sería conveniente incluir una figura o diagrama que diera una visión global de la solución.\]

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPwAAACRCAIAAABoo0K0AAAAAXNSR0IArs4c6QAAAAlwSFlzAAAOwwAADsQBiC4+owAAAr9JREFUeF7t0kERACAMBDHAvyWE8YJBx6YObpt5zx5OgVKBVRprqwK/APQc5ApAn3u5wdAzkCsAfe7lBkPPQK4A9LmXGww9A7kC0OdebjD0DOQKQJ97ucHQM5ArAH3u5QZDz0CuAPS5lxsMPQO5AtDnXm4w9AzkCkCfe7nB0DOQKwB97uUGQ89ArgD0uZcbDD0DuQLQ515uMPQM5ApAn3u5wdAzkCsAfe7lBkPPQK4A9LmXGww9A7kC0OdebjD0DOQKQJ97ucHQM5ArAH3u5QZDz0CuAPS5lxsMPQO5AtDnXm4w9AzkCkCfe7nB0DOQKwB97uUGQ89ArgD0uZcbDD0DuQLQ515uMPQM5ApAn3u5wdAzkCsAfe7lBkPPQK4A9LmXGww9A7kC0OdebjD0DOQKQJ97ucHQM5ArAH3u5QZDz0CuAPS5lxsMPQO5AtDnXm4w9AzkCkCfe7nB0DOQKwB97uUGQ89ArgD0uZcbDD0DuQLQ515uMPQM5ApAn3u5wdAzkCsAfe7lBkPPQK4A9LmXGww9A7kC0OdebjD0DOQKQJ97ucHQM5ArAH3u5QZDz0CuAPS5lxsMPQO5AtDnXm4w9AzkCkCfe7nB0DOQKwB97uUGQ89ArgD0uZcbDD0DuQLQ515uMPQM5ApAn3u5wdAzkCsAfe7lBkPPQK4A9LmXGww9A7kC0OdebjD0DOQKQJ97ucHQM5ArAH3u5QZDz0CuAPS5lxsMPQO5AtDnXm4w9AzkCkCfe7nB0DOQKwB97uUGQ89ArgD0uZcbDD0DuQLQ515uMPQM5ApAn3u5wdAzkCsAfe7lBkPPQK4A9LmXGww9A7kC0OdebjD0DOQKQJ97ucHQM5ArAH3u5QZDz0CuAPS5lxsMPQO5AtDnXm4w9AzkCkCfe7nB0DOQKwB97uUGQ89ArgD0uZcbDD0DuQIPhs4D17rtvlwAAAAASUVORK5CYII=)

Figure 1 - Título para la figura

\[Se podrían incluir sub-secciones para describir los puntos más relevantes de la problemática, por ejemplo, relevamiento de productos relacionados, alternativas de configuración, algún punto que necesite más detalle para su comprensión, etc.\]

# ARQUITECTURA DEL SISTEMA

\[En esta sección se presenta resumidamente la arquitectura del sistema. Se podría incluir como sub-sección de la sección 4.\]

# IMPLEMENTACIÓN

\[En esta sección se brinda más detalle en cuanto a los productos, herramientas y tecnologías utilizadas.\]

## Productos y Herramientas

\[En esta sub-sección se describen los productos y herramientas que se evaluaron y/o utilizaron, presentando brevemente una evaluación de los mismos. Se sugiere incluir una tabla para resumir la evaluación, incluyendo por ejemplo: puntos fuertes, puntos débiles, evaluación general, etc.\]

Tabla 1. Evaluación de Productos y Herramientas

| **Producto**   | **Puntos Fuertes** | **Puntos Débiles** | **Evaluación General** |
| -------------- | ------------------ | ------------------ | ---------------------- |
| \[Producto 1\] |                    |                    |                        |
| \[Producto 2\] |                    |                    |                        |

## Problemas Encontrados

\[En esta sección se describen brevemente los problemas encontrados y si fue posible, cómo se resolvieron.\]

# EVALUACIÓN DE LA SOLUCIÓN

\[En esta sección se evalúa críticamente la solución identificando y mencionando brevemente sus puntos fuertes y puntos débiles.\]

# DESARROLLO DEL PROYECTO

\[OPCIONAL: En esta sección se describe cómo fue el desarrollo del proyecto, porcentaje de tiempo dedicado a cada tarea, desviación con respecto al cronograma inicial y análisis de los posibles motivos que llevaron a que el proyecto se desarrollara de la forma descripta.\]

# CONCLUSIONES Y TRABAJO A FUTURO

\[En esta sección se presentan las conclusiones y trabajo a futuro. Es el espacio para las recomendaciones en base a lo que se estudió: se puede usar, se recomienda usar, todavía no hay soporte suficiente, etc.\]

# REFERENCIAS

- Laboratorio de Integración de Sistemas. Taller de Sistemas de Información Geográficos Empresariales - Trabajo Obligatorio. Año 2013. <http://www.fing.edu.uy/inco/cursos/tsi/TSIG> \[Consulta: Mayo 2013\]
- ACM Proceedings Templates  
   <http://www.acm.org/chapters/policy/toolkit/template.html>  
   \[Consulta: Mayo 2010\]