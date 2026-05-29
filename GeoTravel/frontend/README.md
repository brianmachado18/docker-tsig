# GeoTravel Frontend

Frontend de GeoTravel GIS construido con React + Vite + Tailwind. Este frontend corre en Docker como servicio `frontend` dentro de `docker-compose.yml`.

## Requisitos
- Docker + Docker Compose
- Repositorio clonado en local

## Ejecución con Docker (recomendada)

Desde la raíz del proyecto (`GeoTravel/`):

```bash
docker compose up frontend
```

Si quieres levantar todo el stack (frontend + backend + geoserver + postgres + tomcat):

```bash
docker compose up
```

Puertos relevantes:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- GeoServer: `http://localhost:8081/geoserver`
- Tomcat: `http://localhost:8082`
- Postgres (host): `localhost:5433`

## Cómo funciona el contenedor frontend

En `docker-compose.yml`, el servicio:
- Usa `node:22-alpine`.
- Monta `./frontend` en `/app`.
- Ejecuta:
  - `npm install`
  - `npm run dev -- --host 0.0.0.0 --port 5173`

Esto permite hot-reload contra tu carpeta local.

## Comandos útiles

Desde raíz `GeoTravel/`:

```bash
docker compose logs -f frontend
docker compose restart frontend
docker compose down
```

Reconstruir y volver a levantar:

```bash
docker compose down
docker compose up --build frontend
```

## Estructura principal

```text
frontend/
  src/
    pages/          # pantallas principales
    components/     # UI por feature (zones, routes, map, auth, etc.)
    store/          # Zustand stores
    services/       # clientes API y servicios
    locales/        # i18n (en/es)
    stitch/         # referencias de diseño
```

## Documentación relacionada

- Router de agentes y skills: [`../AGENTS.md`](../AGENTS.md)
- Backlog de documentación: [`../BACKLOG_DOCUMENTATION.md`](../BACKLOG_DOCUMENTATION.md)
- Instrucciones del frontend:
  - [`./.agent.md`](./.agent.md)
  - [`./.instructions.md`](./.instructions.md)
  - [`./.prompt.md`](./.prompt.md)

## Troubleshooting rápido

- Si `frontend` no responde:
  - revisa logs: `docker compose logs -f frontend`
  - reinicia servicio: `docker compose restart frontend`
- Si backend/GeoServer no están disponibles:
  - levanta stack completo: `docker compose up`
- Si hay errores por dependencias:
  - reinicia limpio con `docker compose down` y luego `docker compose up --build frontend`
