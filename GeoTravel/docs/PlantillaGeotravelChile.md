# Documentación de referencia técnica — GeoTravel

## 1. Propósito de este documento

Este documento resume CÓMO está resuelto el proyecto `geotravel` para poder reutilizar sus ideas en otro sistema geoespacial. No describe una idea teórica: está basado en la implementación real del repositorio.

El proyecto combina:

- **PostgreSQL + PostGIS** como fuente de verdad geoespacial.
- **GeoServer** para publicar capas geográficas como **WMS**.
- **Backend JEE/JAX-RS** para CRUD, reglas de negocio y consultas espaciales.
- **Frontend React + Leaflet** para visualización, edición y herramientas de usuario.

---

## 2. Arquitectura real del proyecto

## 2.1 Componentes

### Base de datos
- Servicio Docker: `db`
- Imagen: `postgis/postgis:16-3.4`
- Script inicial: `db/schema.sql`

### GeoServer
- Servicio Docker: `geoserver`
- Imagen: `kartoza/geoserver:2.25.2`
- Data dir versionado en repo: `geoserver_data/`

### Backend
- Proyecto Java WAR desplegado en Tomcat
- Stack: Jersey + JAX-RS + JDBC directo
- Punto de entrada REST: `backend/src/main/webapp/WEB-INF/web.xml`

### Frontend
- React + Leaflet + react-leaflet-draw + recharts
- Archivo principal: `frontend/src/App.jsx`

## 2.2 Flujo de datos

### Datos de negocio
```text
Frontend -> Backend REST -> PostGIS
```

### Datos cartográficos publicados por GeoServer
```text
Frontend -> GeoServer WMS -> PostGIS
```

PUNTO CLAVE: **GeoServer NO consume el backend**.  
GeoServer y el backend leen la **misma base PostGIS** por caminos distintos.

Eso simplifica la arquitectura:

- el backend resuelve negocio y escritura;
- GeoServer publica mapas;
- el frontend puede usar ambas fuentes al mismo tiempo.

---

## 3. Modelo conceptual del dominio

El proyecto trabaja con 3 entidades geográficas principales:

### 3.1 Zona turística
- Geometría: `POLYGON`
- SRID: `4326`
- Representa un área turística
- Campos principales:
  - `nombre`
  - `descripcion`
  - `nivel_atractivo`
  - `observaciones`
  - `geom`

### 3.2 Recorrido
- Geometría: `LINESTRING`
- SRID: `4326`
- Representa una ruta turística
- Campos principales:
  - `nombre`
  - `descripcion`
  - `duracion_estimada`
  - `guia_responsable`
  - `tipo_experiencia`
  - `estado`
  - `estacion_inicio`
  - `estacion_fin`
  - `geom`

### 3.3 Atracción turística
- Geometría: `POINT`
- SRID: `4326`
- Representa un punto de interés
- Campos principales en el código actual:
  - `nombre`
  - `descripcion`
  - `clasificacion`
  - `foto_url`
  - `tiempo_estimado`
  - `geom`

### 3.4 Relación recorrido ↔ atracción
- Tabla: `recorrido_atraccion`
- Resuelve qué atracciones forman parte de un recorrido
- Guarda también el campo `orden`

### 3.5 Histórico de estados
- Tabla: `historico_estado`
- Guarda transiciones de estado de los recorridos

---

## 4. Casos de uso implementados

## 4.1 Modo invitado

El invitado puede entrar sin autenticarse desde `frontend/src/components/LoginScreen.jsx`.

Puede:

- ver recorridos disponibles;
- buscar direcciones o intersecciones;
- identificar la zona que contiene un punto;
- ver el recorrido disponible más cercano;
- inspeccionar zonas, recorridos y atracciones;
- ver capas vectoriales renderizadas en Leaflet;
- calcular “cómo llego” a un recorrido.

Restricción importante:

- en backend, `AuthFilter` deja pasar todos los `GET`;
- `POST`, `PUT` y `DELETE` requieren token simple.

## 4.2 Modo administrador

El admin puede:

- crear, editar y eliminar recorridos;
- crear, editar y eliminar zonas;
- crear, editar y eliminar atracciones;
- avanzar estado de recorridos;
- consultar historial de estados;
- ver reporte por zona;
- activar capas WMS de GeoServer;
- subir imágenes para atracciones.

---

## 5. Cómo se resolvieron los casos de uso

## 5.1 CRUD geoespacial

La decisión importante fue esta:

- el frontend trabaja con geometrías en **GeoJSON**;
- el backend convierte ese GeoJSON a geometría PostGIS con `ST_GeomFromGeoJSON`;
- cuando devuelve datos, vuelve a serializar con `ST_AsGeoJSON`.

Eso aparece repetidamente en servicios como:

- `RecorridoService`
- `ZonaTuristicaService`
- `AtraccionTuristicaService`

Patrón:

```sql
ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)
ST_AsGeoJSON(geom)
```

Esto es una buena decisión para reutilizar en otro proyecto porque desacopla:

- el editor del mapa en frontend;
- el motor espacial de base de datos.

## 5.2 Consultas espaciales

### Recorridos dentro de una zona
Se usa:

```sql
ST_Intersects(r.geom, z.geom)
```

Archivo clave:
- `backend/src/main/java/com/geotravel/service/RecorridoService.java`

### Zona que contiene un punto
Se usa:

```sql
ST_Contains(z.geom, ST_SetSRID(ST_MakePoint(?, ?), 4326))
```

Archivo clave:
- `backend/src/main/java/com/geotravel/service/ZonaTuristicaService.java`

### Atracciones dentro de una zona
Se usa:

```sql
ST_Contains(z.geom, a.geom)
```

Archivo clave:
- `backend/src/main/java/com/geotravel/service/AtraccionTuristicaService.java`

### Recorrido más cercano a un punto
Se usa KNN geográfico:

```sql
ORDER BY geom::geography <-> ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
LIMIT 1
```

Esto está BIEN pensado. No es solo distancia euclidiana en grados: convierte a `geography`.

### Validación de superposición de zonas
Se usa:

```sql
ST_Overlaps(...)
```

Archivo clave:
- `backend/src/main/java/com/geotravel/service/ZonaTuristicaService.java`

## 5.3 Estacionalidad de recorridos

El recorrido tiene:

- `estacion_inicio`
- `estacion_fin`

Antes de listar recorridos, el backend ejecuta `actualizarEstacionalidad()` y cambia estados automáticamente según el mes actual.

Regla:

- si el mes actual queda fuera del rango, pasa a `fuera_de_estacion`;
- si vuelve a entrar al rango, vuelve a `disponible`;
- `cancelado` no se toca.

Archivo clave:
- `backend/src/main/java/com/geotravel/service/RecorridoService.java`

Además, el listado soporta filtrar por `mes` para simular disponibilidad estacional.

## 5.4 Historial de estados

Cuando se avanza manualmente el estado:

1. se actualiza `recorrido.estado`;
2. se inserta una fila en `historico_estado`.

Eso se hace en una transacción JDBC.

Estados implementados:

- `pendiente -> disponible`
- `disponible -> cancelado`
- `cancelado -> pendiente`

No hay workflow complejo ni máquina de estados formal; es una transición simple basada en mapa.

## 5.5 Reporte por zona

El reporte cruza zonas con recorridos mediante `ST_Intersects` y cuenta por estado:

- disponibles
- pendientes
- fuera de estación
- cancelados

Ese reporte alimenta:

- una gráfica de barras;
- un modo visual de “zonas activas” en el mapa.

---

## 6. Cómo se manejó GeoServer

## 6.1 Conexión de GeoServer

GeoServer está definido en `docker-compose.yml` y monta su data directory desde:

- `./geoserver_data:/opt/geoserver/data_dir`

El datastore ya está preconfigurado en:

- `geoserver_data/workspaces/geotravel/postgis_geotravel/datastore.xml`

Configuración relevante verificada:

- workspace: `geotravel`
- datastore: `postgis_geotravel`
- host: `db`
- port: `5432`
- db: `geotravel`
- schema: `public`
- dbtype: `postgis`
- user: `postgres`

Esto significa que GeoServer queda enchufado DIRECTAMENTE al contenedor de PostGIS usando la red interna de Docker Compose.

## 6.2 Qué publica GeoServer

Hay 3 feature types versionados:

- `recorrido`
- `zona_turistica`
- `atraccion_turistica`

Archivos:

- `geoserver_data/workspaces/geotravel/postgis_geotravel/recorrido/featuretype.xml`
- `geoserver_data/workspaces/geotravel/postgis_geotravel/zona_turistica/featuretype.xml`
- `geoserver_data/workspaces/geotravel/postgis_geotravel/atraccion_turistica/featuretype.xml`

Todas las capas trabajan con:

- `EPSG:4326`
- bounding boxes declaradas
- tipo `VECTOR`

## 6.3 Estilos SLD

Cada capa tiene estilo propio:

- recorridos: por `estado`
- zonas: por `nivel_atractivo`
- atracciones: por `clasificacion`

Archivos:

- `geoserver_data/workspaces/geotravel/styles/estilo_recorridos.sld`
- `geoserver_data/workspaces/geotravel/styles/estilo_zonas.sld`
- `geoserver_data/workspaces/geotravel/styles/estilo_atracciones.sld`

Esto es importante porque la simbología del WMS NO depende del frontend.  
El frontend solo pide la capa; GeoServer decide cómo dibujarla.

## 6.4 Decisión arquitectónica importante

El proyecto usa GeoServer SOLO para **WMS**.

No encontré consumo de:

- WFS
- WFS-T
- GeoJSON servido por GeoServer

La edición NO pasa por GeoServer.  
La edición pasa por:

```text
Leaflet draw -> Backend REST -> PostGIS
```

Y la visualización opcional de mapas publicados pasa por:

```text
Leaflet WMS -> GeoServer -> PostGIS
```

ESTA separación es sana y reusable.

---

## 7. Cómo se consumió GeoServer en el frontend

## 7.1 Consumo real

El frontend usa `WMSTileLayer` de `react-leaflet`.

Archivo:
- `frontend/src/App.jsx`

Capas consumidas:

```jsx
<WMSTileLayer
  url="http://localhost:8081/geoserver/geotravel/wms"
  layers="geotravel:recorrido"
  format="image/png"
  transparent={true}
/>
```

Y equivalentes para:

- `geotravel:zona_turistica`
- `geotravel:atraccion_turistica`

## 7.2 Cuándo se muestran

Solo el administrador puede activar los toggles WMS:

- WMS Recorridos
- WMS Zonas
- WMS Atracciones

Cuando una capa WMS está activa, el frontend deja de renderizar esa misma entidad como geometría vectorial local.

Ejemplo:

- si `wmsRecorridos === true`, ya no dibuja los `Polyline` locales de recorridos.

Eso evita doble render.

## 7.3 Qué problema resolvió esto

La app tiene dos formas de visualización:

### Visualización local
- usa GeoJSON devuelto por backend;
- sirve para interacción rica;
- permite seleccionar features fácilmente.

### Visualización WMS
- usa mapas renderizados por GeoServer;
- sirve para validar publicación cartográfica real;
- desacopla la simbología del frontend.

En otro proyecto, esta dualidad es MUY útil.

---

## 8. Cómo se manejó la edición de recorridos

Este es uno de los puntos más importantes del proyecto.

## 8.1 Dos modos de creación/edición

`NuevoRecorridoModal.jsx` implementa dos estrategias:

### A. Crear desde puntos
El usuario selecciona:

- atracciones;
- o zonas;
- con orden de paradas.

Luego el sistema genera una geometría `LineString`.

### B. Dibujar sobre el mapa
El usuario completa datos y después dibuja la ruta manualmente con `leaflet-draw`.

Esto es una buena decisión porque cubre dos necesidades reales:

- recorrido lógico basado en POIs;
- recorrido libre dibujado manualmente.

## 8.2 Generación automática del recorrido desde puntos

Flujo:

1. el usuario arma una lista de puntos;
2. opcionalmente optimiza el orden;
3. el frontend calcula la ruta entre pares consecutivos;
4. construye un `LineString` GeoJSON;
5. envía ese GeoJSON al backend.

Archivo clave:
- `frontend/src/components/NuevoRecorridoModal.jsx`

## 8.3 Optimización de orden

La optimización NO usa un solver de ruteo real.

Usa una heurística greedy:

- mantiene origen y destino fijos;
- reordena solo las paradas intermedias;
- elige siempre el siguiente punto más cercano en línea recta.

Tradeoff:

- **ventaja**: simple, rápida, sin costo extra;
- **desventaja**: no garantiza la ruta óptima global.

## 8.4 Cálculo de la geometría

Para cada tramo entre puntos consecutivos, el frontend llama a OpenRouteService:

- endpoint `directions/driving-car`

Si ORS responde:

- concatena las coordenadas reales de la ruta.

Si ORS falla:

- cae a línea recta entre puntos.

Eso hace al flujo robusto.

## 8.5 Edición de recorridos existentes

Cuando se edita un recorrido:

1. `App.jsx` marca `editingId` y `editandoRecorrido`;
2. abre `NuevoRecorridoModal`;
3. el modal consulta `/api/recorridos/{id}/atracciones`;
4. si existen atracciones asociadas, precarga los puntos y vuelve a modo `puntos`.

Después:

- si se guarda desde puntos, primero actualiza el recorrido;
- luego reemplaza la tabla `recorrido_atraccion` completa con el nuevo orden.

Método backend:
- `setAtraccionesRecorrido(...)`

Importante:

- la relación se reescribe completa;
- no hay diff parcial.

Eso simplifica la lógica.

## 8.6 Redibujo de geometría

Para cualquier entidad en edición, si ya existe geometría:

- el `FormModal` muestra la opción **“Redibujar geometría”**;
- al activarla, el flujo vuelve a `leaflet-draw`;
- la nueva geometría reemplaza a la anterior.

Esto está resuelto en:

- `frontend/src/App.jsx`
- `react-leaflet-draw`

## 8.7 Quirk importante

Si el recorrido se arma usando una **zona** como punto:

- el sistema NO usa el centroide;
- toma el **primer vértice** del polígono.

Eso está en `getPuntoCoords()` dentro de `NuevoRecorridoModal.jsx`.

Para otro proyecto, lo correcto normalmente sería usar:

- centroid;
- point on surface;
- o un access point de negocio.

---

## 9. Cómo se manejó la edición de zonas y atracciones

## 9.1 Zonas

Flujo:

1. se abre `NuevaZonaModal`;
2. se cargan datos textuales;
3. al confirmar, el usuario dibuja el polígono en el mapa;
4. antes de persistir, el backend valida superposición con `ST_Overlaps`.

Si hay superposición:

- el frontend avisa;
- permite guardar igualmente con confirmación.

## 9.2 Atracciones

Flujo:

1. se abre `NuevaAtraccionModal`;
2. la ubicación se define por:
   - búsqueda de dirección;
   - click en mapa;
   - o mantener ubicación actual en edición;
3. luego se guardan datos descriptivos.

La geocodificación usa Nominatim/OpenStreetMap.

---

## 10. Manejo de imágenes en atracciones

La solución implementada fue práctica y flexible.

## 10.1 Selección de imagen

`ImagePicker.jsx` soporta 3 modos:

1. **Buscar** en Wikimedia Commons
2. **Pegar URL**
3. **Subir archivo**

## 10.2 Subida al backend

Cuando se sube archivo:

1. el navegador convierte a Base64;
2. POST a `/api/atracciones/upload`;
3. backend decodifica;
4. backend guarda en disco;
5. devuelve una URL relativa `/uploads/...`.

Backend:
- `backend/src/main/java/com/geotravel/controller/AtraccionTuristicaController.java`

## 10.3 Decisión funcional

La app guarda **URL de imagen**, no blob binario en BD.

Eso es mejor para un sistema web simple porque:

- reduce peso en base de datos;
- evita serializar binarios grandes en consultas normales;
- separa contenido multimedia de datos de negocio.

---

## 11. Búsqueda geográfica y experiencia de mapa

## 11.1 Geocoding

Archivo:
- `frontend/src/data/api.js`

La función `geocode()`:

- usa Nominatim;
- intenta detectar intersecciones;
- agrega contexto `Montevideo, Uruguay`.

OJO: esto vuelve a la aplicación muy específica del dominio/localidad actual.

## 11.2 “¿Cómo llego?”

Desde el detalle de un recorrido, el usuario puede pedir ruta desde su ubicación actual.

Modos soportados:

- a pie
- auto
- bici

Implementación:

1. toma geolocalización del navegador;
2. llama a OpenRouteService;
3. dibuja la ruta como `Polyline`;
4. muestra distancia y duración.

---

## 12. Seguridad y autenticación

## 12.1 Qué hay implementado

Hay una autenticación muy simple:

- login por email/password;
- backend devuelve token tipo `admin-{id}`;
- `AuthFilter` solo verifica que el header empiece con `Bearer admin-`.

Además:

- los `GET` quedan públicos;
- `POST/PUT/DELETE` quedan protegidos.

## 12.2 Qué significa esto

Esto sirve para demo, prototipo o entrega académica.

NO es una base segura para producción porque:

- no hay JWT real;
- no hay expiración;
- no hay firma;
- la contraseña se compara en texto plano;
- el filtro acepta cualquier token con prefijo correcto.

Para otro proyecto, esto debe reemplazarse.

---

## 13. Archivos clave por responsabilidad

## Infraestructura
- `docker-compose.yml` — orquesta db, geoserver, backend y frontend
- `backend/Dockerfile` — build del WAR y despliegue en Tomcat
- `frontend/Dockerfile` — entorno de desarrollo React

## Base geoespacial
- `db/schema.sql` — esquema inicial
- `db/dump.sql` — dump más cercano al estado real actual
- `db/migration_foto_url.sql` — migración puntual de imágenes

## Backend
- `backend/src/main/java/com/geotravel/config/DatabaseConnection.java`
- `backend/src/main/java/com/geotravel/config/AuthFilter.java`
- `backend/src/main/java/com/geotravel/config/CorsFilter.java`
- `backend/src/main/java/com/geotravel/controller/*.java`
- `backend/src/main/java/com/geotravel/service/*.java`

## Frontend
- `frontend/src/App.jsx` — orquestación principal
- `frontend/src/data/api.js` — acceso a API y helpers geográficos
- `frontend/src/components/NuevoRecorridoModal.jsx`
- `frontend/src/components/NuevaZonaModal.jsx`
- `frontend/src/components/NuevaAtraccionModal.jsx`
- `frontend/src/components/ImagePicker.jsx`
- `frontend/src/components/LoginScreen.jsx`

## GeoServer
- `geoserver_data/workspaces/geotravel/workspace.xml`
- `geoserver_data/workspaces/geotravel/namespace.xml`
- `geoserver_data/workspaces/geotravel/postgis_geotravel/datastore.xml`
- `geoserver_data/workspaces/geotravel/postgis_geotravel/*/featuretype.xml`
- `geoserver_data/workspaces/geotravel/styles/*.sld`

---

## 14. Decisiones de diseño que sí vale la pena copiar

## 14.1 GeoJSON entre frontend y backend
Excelente para interoperabilidad.

## 14.2 PostGIS como fuente única
Evita duplicación y permite que backend y GeoServer compartan datos.

## 14.3 GeoServer solo para publicación cartográfica
Muy buena separación de responsabilidades.

## 14.4 Edición fuera de GeoServer
Más simple que WFS-T y suficiente para la mayoría de CRUD geoespaciales.

## 14.5 Relaciones de recorrido con atracciones por tabla intermedia
Correcto para ordenar POIs y enriquecer recorridos.

## 14.6 Reporte espacial + mapa + gráfico
Buena combinación de analítica y visualización.

---

## 15. Limitaciones y deudas técnicas detectadas

Esto es MUY importante si vas a usar este proyecto como referencia.

## 15.1 Desalineación entre esquema y código

Verifiqué una diferencia real:

- `db/schema.sql` todavía define `foto BYTEA` y NO incluye claramente el estado final del modelo de atracción;
- `AtraccionTuristicaService.java` trabaja con `foto_url` y `tiempo_estimado`;
- `db/dump.sql` sí refleja `foto_url` y `tiempo_estimado`.

Conclusión:

**el archivo más confiable para entender el modelo actual no es solo `schema.sql`; también hay que mirar `dump.sql` y migraciones.**

## 15.2 Desalineación de volumen de uploads

Encontré otra inconsistencia:

- `docker-compose.yml` monta `uploads:/opt/uploads`
- `AtraccionTuristicaController.java` guarda en `/usr/local/tomcat/webapps/ROOT/uploads`

Eso significa que el volumen actual NO coincide con la ruta real de guardado.

Para otro proyecto, esto hay que corregir antes de copiar la solución.

## 15.3 URL de GeoServer hardcodeada

El frontend usa:

- `http://localhost:8081/geoserver/geotravel/wms`

Eso funciona localmente, pero no es portable.  
En otro proyecto conviene parametrizarlo con variables de entorno.

## 15.4 API key expuesta en frontend

La clave de OpenRouteService está embebida en `NuevoRecorridoModal.jsx` y también se usa en `App.jsx`.

Eso es cómodo para demo, pero malo para producción.

## 15.5 Seguridad mínima

La autenticación actual es de maqueta. No copiar tal cual.

## 15.6 Dependencia geográfica implícita

La geocodificación empuja búsquedas a:

- Montevideo
- Uruguay

Eso hay que generalizar si querés reutilizar el sistema.

---

## 16. Cómo reutilizar esta arquitectura en otro proyecto

Si yo tuviera que portar esta solución, copiaría la IDEA, no el código textual.

## 16.1 Lo que sí replicaría

1. **PostGIS como fuente central**
2. **Backend REST que recibe/entrega GeoJSON**
3. **GeoServer conectado al mismo PostGIS**
4. **Leaflet para edición y visualización**
5. **WMS opcional para publicación cartográfica**
6. **Consultas espaciales en SQL/PostGIS**
7. **Tabla intermedia para ordenar POIs dentro de recorridos**

## 16.2 Lo que cambiaría

1. Autenticación real con JWT
2. Variables de entorno para URLs y keys
3. Migrations formales
4. Uso de centroides o access points para zonas
5. Solver de rutas más robusto si el negocio lo exige
6. Manejo de archivos consistente con storage real

---

## 17. Resumen ejecutivo

La esencia del proyecto es esta:

- **Backend** = negocio + CRUD + consultas espaciales
- **PostGIS** = modelo geográfico real
- **GeoServer** = publicación cartográfica WMS
- **Frontend** = experiencia interactiva, edición y exploración

La parte más valiosa como referencia es la separación entre:

- edición transaccional vía backend,
- y publicación cartográfica vía GeoServer.

ESA es la decisión que más conviene reutilizar.
