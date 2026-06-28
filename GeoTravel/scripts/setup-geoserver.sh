#!/bin/sh
# Configura GeoServer (workspace + datastore PostGIS + 3 capas) desde cero.
# Puede ejecutarse desde el host o como servicio one-shot de Docker Compose.
# Idempotente: intenta crear recursos y luego valida que las capas existan.
set -u
GS="${GS:-http://localhost:8081/geoserver/rest}"
AUTH="${AUTH:-admin:geoserver}"
WORKSPACE="${WORKSPACE:-geotravel}"
DATASTORE="${DATASTORE:-postgis}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-tsig}"
DB_SCHEMA="${DB_SCHEMA:-public}"
DB_USER="${DB_USER:-tsig}"
DB_PASSWORD="${DB_PASSWORD:-tsig}"
CONTENT_TYPE="Content-Type:text/xml"

echo "==> Esperando GeoServer REST en ${GS}"
ready=0
attempt=1
while [ "$attempt" -le 60 ]; do
  code="$(curl -s -o /dev/null -w "%{http_code}" -u "$AUTH" "$GS/about/version.xml" || true)"
  if [ "$code" = "200" ]; then
    ready=1
    break
  fi
  sleep 5
  attempt=$((attempt + 1))
done

if [ "$ready" != "1" ]; then
  echo "GeoServer REST no quedo disponible en ${GS}" >&2
  exit 1
fi

echo "==> Workspace ${WORKSPACE}"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" -u "$AUTH" \
  -H "$CONTENT_TYPE" \
  -d "<workspace><name>${WORKSPACE}</name></workspace>" "$GS/workspaces"

echo "==> Datastore ${DATASTORE} (host=${DB_HOST})"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" -u "$AUTH" \
  -H "$CONTENT_TYPE" \
  -d "<dataStore><name>${DATASTORE}</name><enabled>true</enabled><connectionParameters><entry key='dbtype'>postgis</entry><entry key='host'>${DB_HOST}</entry><entry key='port'>${DB_PORT}</entry><entry key='database'>${DB_NAME}</entry><entry key='schema'>${DB_SCHEMA}</entry><entry key='user'>${DB_USER}</entry><entry key='passwd'>${DB_PASSWORD}</entry></connectionParameters></dataStore>" \
  "$GS/workspaces/${WORKSPACE}/datastores"

FT="$GS/workspaces/${WORKSPACE}/datastores/${DATASTORE}/featuretypes?recalculate=nativebbox,latlonbbox"
publish() { # nombre_capa  tabla_nativa  titulo
  curl -s -o /dev/null -w "  $1 -> HTTP %{http_code}\n" -u "$AUTH" \
    -H "$CONTENT_TYPE" \
    -d "<featureType><name>$1</name><nativeName>$2</nativeName><title>$3</title><srs>EPSG:4326</srs><projectionPolicy>FORCE_DECLARED</projectionPolicy><enabled>true</enabled></featureType>" \
    "$FT"
}
echo "==> Capas"
publish zona      zona      "Zonas turisticas"
publish recorrido           recorrido "Recorridos"
publish atraccion atraccion "Atracciones turisticas"

echo "==> Capas publicadas:"
published="$(curl -s -u "$AUTH" "$GS/workspaces/${WORKSPACE}/datastores/${DATASTORE}/featuretypes.json")"
echo "$published" | grep -o '"name":"[^"]*"' || true

for layer in zona recorrido atraccion; do
  if ! echo "$published" | grep -q "\"name\":\"${layer}\""; then
    echo "No se publico la capa ${WORKSPACE}:${layer}" >&2
    exit 1
  fi
done
