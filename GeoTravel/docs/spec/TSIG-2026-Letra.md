## Taller de Sistemas de Información Geográficos **Tecnólogo en Informática – Proyecto 2026** 

## **Introducción** 

La empresa turística GeoTravel, que opera en distintos destinos de Uruguay y la región, se encuentra en expansión. Debido a esto, ha decidido modernizar su sistema de gestión incorporando información geográfica para mejorar la planificación y experiencia de los usuarios. 

GeoTravel se dedica a la organización de recorridos turísticos, experiencias culturales y visitas a puntos de interés naturales y urbanos. 

Cada recorrido turístico pasa por diferentes etapas, las cuales se desean gestionar en el sistema: 

- Disponible 

- Fuera de estación 

- Pendiente 

- Cancelado 

Además del estado del recorrido, interesa conocer su nombre, descripción, duración estimada, guía responsable y tipo de experiencia (cultural, gastronómica, natural, histórica). Cada recorrido es estacional, ejemplo de marzo a diciembre, o de noviembre a febrero, etc, además cada punto de interés tiene un orden que indica la forma que se ejecutara el recorrido. Cada recorrido pasa a estado fuera de estación cuando el periodo que se está consultando no corresponda con el del recorrido. 

A su vez, GeoTravel maneja zonas turísticas de interés, las cuales pueden representar áreas de interés, barrios, circuitos específicos o regiones naturales. 

De cada zona se mantiene: nombre, descripción, nivel de atractivo (1-5 siendo 1 el mayor), y observaciones. Las zonas pueden modificarse en su geometría y no deben superponerse entre sí. 

Adicionalmente se podrían registrar atracciones turísticas puntuales que se visitan en los recorridos. Para dichas atracciones es interesante registrar nombre, descripción, clasificación y opcionalmente foto. 

## **Requerimientos funcionales - Usuario administrador** 

## **ABM Zonas Turísticas** 

El sistema permitirá crear, modificar y eliminar zonas de interés turístico directamente sobre el mapa. 

## **ABM Recorridos** 

Se podrán registrar, modificar y eliminar recorridos turísticos con sus datos asociados. Cada estado deberá visualizarse con un color distinto en el mapa. 

## **ABM Atracciones Turísticas** 

Se podrán registrar, modificar y eliminar atracciones turísticas con sus datos asociados. 

## **Avanzar recorrido** 

Se podrá cambiar el estado de un recorrido respetando una secuencia lógica entre etapas. 

## **Histórico de recorridos** 

Se registrará el historial de estados de cada recorrido con sus fechas correspondientes. 

## **Reporte de recorridos por zona** 

Se podrán listar recorridos filtrados por estado y agrupados según zonas turísticas. 

## **Consultas Geográficas** 

- Recorridos por zona: visualizar en el mapa los recorridos dentro de una zona seleccionada. 

- Zonas con más recorridos activos: mostrar las zonas con mayor cantidad de recorridos en curso. 

- Búsqueda de recorrido: localizar el recorrido más cercano a una intersección de calles. 

- Búsqueda de zona: ubicar la zona correspondiente a una dirección ingresada. 

- Puntos por recorrido, puntos en zonas. Puntos más populares (incluídos en más recorridos). 

## **Requerimientos funcionales - Usuario invitado** 

Se deberá Visualizar en el mapa, con los siguientes filtros: 

- Recorridos, pudiendo acceder a su información detallada filtrando por estado, estacionalidad. 

- Puntos de interés y su clasificación. 

## **Requerimientos opcionales** 

- Control de superposición de zonas turísticas 

- Ruta óptima hacia un recorrido desde la ubicación del usuario 

- Agregar/Editar imágenes representativas en los puntos de interés 

- Mapa de calor de actividades turística 

- Gráfica de popularidad de recorridos por zona 

## **Requerimientos no funcionales** 

La aplicación deberá ser responsive. 

## **Tecnologías sugeridas** 

- Plataforma: JEE 

- Servidor Web: Tomcat 

- Servidor de mapas: GeoServer 

- Base de datos: PostgreSQL + PostGIS 

- La interfaz de usuario es a libre elección, puede ser React + (Leaflet / OpenLayers), o pueden usar otras librerías/frameworks que acuerden con su tutor. 

