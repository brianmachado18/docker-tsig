#!/usr/bin/env bash
# Configura GeoServer (workspace + datastore PostGIS + 3 capas) desde cero.
# Requiere el stack levantado (docker compose up). Idempotente: ignora "ya existe".
set -uo pipefail
GS="${GS:-http://localhost:8081/geoserver/rest}"
AUTH="${AUTH:-admin:geoserver}"
H='-H Content-Type:text/xml'

echo "==> Workspace geotravel"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" -u "$AUTH" $H \
  -d "<workspace><name>geotravel</name></workspace>" "$GS/workspaces"

echo "==> Datastore postgis (host=postgres dentro de la red Docker)"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" -u "$AUTH" $H \
  -d "<dataStore><name>postgis</name><enabled>true</enabled><connectionParameters><entry key='dbtype'>postgis</entry><entry key='host'>postgres</entry><entry key='port'>5432</entry><entry key='database'>tsig</entry><entry key='schema'>public</entry><entry key='user'>tsig</entry><entry key='passwd'>tsig</entry></connectionParameters></dataStore>" \
  "$GS/workspaces/geotravel/datastores"

FT="$GS/workspaces/geotravel/datastores/postgis/featuretypes?recalculate=nativebbox,latlonbbox"
publish() { # nombre_capa  tabla_nativa  titulo
  curl -s -o /dev/null -w "  $1 -> HTTP %{http_code}\n" -u "$AUTH" $H \
    -d "<featureType><name>$1</name><nativeName>$2</nativeName><title>$3</title><srs>EPSG:4326</srs><projectionPolicy>FORCE_DECLARED</projectionPolicy><enabled>true</enabled></featureType>" \
    "$FT"
}
echo "==> Capas"
publish zona_turistica      zona      "Zonas turisticas"
publish recorrido           recorrido "Recorridos"
publish atraccion_turistica atraccion "Atracciones turisticas"

echo "==> Capas publicadas:"
curl -s -u "$AUTH" "$GS/workspaces/geotravel/datastores/postgis/featuretypes.json" \
  | grep -o '"name":"[^"]*"' || true
