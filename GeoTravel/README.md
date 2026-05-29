# TSIG Docker

Base Docker para un proyecto con:

- PostgreSQL + PostGIS
- GeoServer
- Java + Spring Boot
- React
- Tomcat

Git e IntelliJ se usan en tu maquina como herramientas de desarrollo. No conviene meter IntelliJ dentro del Docker del proyecto.

## Requisitos

- Docker Desktop
- Git
- IntelliJ IDEA

## Configuracion de entorno (.env)

Este proyecto usa variables de entorno para alinear frontend, backend, base de datos y GeoServer.

1. Crear archivo local `.env` a partir del ejemplo:

```bash
cp .env.example .env
```

2. Revisar/ajustar valores en `.env` segun tu entorno local.

3. Levantar el stack con esas variables:

```bash
docker compose up --build
```

Notas:

- `.env` es local de cada desarrollador (no se versiona).
- Si cambia `.env.example`, conviene replicar esos cambios en tu `.env`.

## Levantar el entorno

```bash
docker compose up --build
```

## URLs

- React: http://localhost:5173
- Spring Boot: http://localhost:8080/api/status
- Spring Health: http://localhost:8080/actuator/health
- GeoServer: http://localhost:8081/geoserver
- Tomcat: http://localhost:8082
- PostgreSQL: localhost:5433

## Credenciales locales

PostgreSQL:

- Base: `tsig`
- Usuario: `tsig`
- Password: `tsig`

GeoServer:

- Usuario: `admin`
- Password: `geoserver`

## IntelliJ

Abre la carpeta `backend` como proyecto Maven o abre la carpeta raiz y marca `backend` como modulo. Para ejecutar Spring fuera de Docker, usa estas variables:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/tsig
SPRING_DATASOURCE_USERNAME=tsig
SPRING_DATASOURCE_PASSWORD=tsig
GEOSERVER_URL=http://localhost:8081/geoserver
```

## React en desarrollo

Si prefieres trabajar con Vite fuera de Docker:

```bash
cd frontend
npm install
npm run dev
```

## WARs en Tomcat

Coloca archivos `.war` dentro de:

```text
tomcat/webapps
```

Tomcat los despliega en http://localhost:8082.

## Reiniciar datos locales

Esto borra la base y los datos persistidos de GeoServer:

```bash
docker compose down -v
```

## Datos de prueba compartidos

Los archivos dentro de `postgres/init/` se ejecutan automaticamente cuando PostgreSQL se crea por primera vez.

Ahora hay dos scripts:

- `01-postgis.sql`: activa PostGIS.
- `02-datos-prueba.sql`: crea una tabla `puntos_interes` con geometria `Point` y datos de ejemplo.

Si alguien ya habia levantado el proyecto antes, debe borrar el volumen para que se ejecuten otra vez:

```bash
docker compose down -v
docker compose up --build
```

Importante: `docker compose down -v` borra la base local de esa persona.
