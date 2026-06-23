from __future__ import annotations

import argparse
import struct
from pathlib import Path
from typing import Iterable


def read_dbf_records(path: Path) -> list[dict[str, object] | None]:
    with path.open("rb") as file:
        header = file.read(32)
        if len(header) != 32:
            raise ValueError(f"DBF invalido: {path}")

        record_count = int.from_bytes(header[4:8], "little")
        header_length = int.from_bytes(header[8:10], "little")
        record_length = int.from_bytes(header[10:12], "little")
        field_count = (header_length - 33) // 32

        fields: list[tuple[str, str, int, int]] = []
        for _ in range(field_count):
            descriptor = file.read(32)
            name = descriptor[:11].split(b"\x00", 1)[0].decode("latin1")
            field_type = chr(descriptor[11])
            length = descriptor[16]
            decimals = descriptor[17]
            fields.append((name, field_type, length, decimals))

        file.read(1)  # terminador

        records: list[dict[str, object] | None] = []
        for _ in range(record_count):
            raw_record = file.read(record_length)
            if len(raw_record) != record_length:
                break

            deleted = raw_record[0:1] == b"*"
            position = 1
            record: dict[str, object] = {}

            for name, field_type, length, decimals in fields:
                raw_value = raw_record[position:position + length]
                position += length
                record[name] = decode_dbf_value(raw_value, field_type, decimals)

            records.append(None if deleted else record)

        return records


def decode_dbf_value(raw_value: bytes, field_type: str, decimals: int) -> object:
    cleaned = raw_value.decode("latin1", errors="ignore").replace("\x00", "").strip()
    if cleaned == "":
        return None

    if field_type == "N":
        if "*" in cleaned:
            return None
        if decimals > 0:
            return float(cleaned)
        return int(cleaned)

    return cleaned


def read_shp_geometries(path: Path) -> list[str | None]:
    geometries: list[str | None] = []
    with path.open("rb") as file:
        header = file.read(100)
        if len(header) != 100:
            raise ValueError(f"SHP invalido: {path}")

        while True:
            record_header = file.read(8)
            if not record_header:
                break
            if len(record_header) != 8:
                raise ValueError(f"Record header incompleto en {path}")

            _, content_length_words = struct.unpack(">2i", record_header)
            content = file.read(content_length_words * 2)
            if len(content) != content_length_words * 2:
                raise ValueError(f"Record content incompleto en {path}")

            shape_type = struct.unpack("<i", content[:4])[0]
            if shape_type == 0:
                geometries.append(None)
            elif shape_type == 1:
                geometries.append(read_point_wkt(content))
            elif shape_type == 3:
                geometries.append(read_polyline_wkt(content))
            else:
                raise ValueError(f"Shape type no soportado {shape_type} en {path}")

    return geometries


def read_point_wkt(content: bytes) -> str:
    x, y = struct.unpack("<2d", content[4:20])
    return f"POINT({format_number(x)} {format_number(y)})"


def read_polyline_wkt(content: bytes) -> str | None:
    num_parts, num_points = struct.unpack("<2i", content[36:44])
    if num_parts <= 0 or num_points <= 1:
        return None

    parts = list(struct.unpack(f"<{num_parts}i", content[44:44 + (4 * num_parts)]))
    points_offset = 44 + (4 * num_parts)
    points = [
        struct.unpack("<2d", content[points_offset + (index * 16): points_offset + ((index + 1) * 16)])
        for index in range(num_points)
    ]

    multiline_parts: list[str] = []
    for part_index, start in enumerate(parts):
        end = parts[part_index + 1] if part_index + 1 < len(parts) else num_points
        line_points = points[start:end]
        if len(line_points) < 2:
            continue
        line_wkt = ", ".join(f"{format_number(x)} {format_number(y)}" for x, y in line_points)
        multiline_parts.append(f"({line_wkt})")

    if not multiline_parts:
        return None

    return f"MULTILINESTRING({', '.join(multiline_parts)})"


def format_number(value: float) -> str:
    return format(value, ".15g")


def sql_literal(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def batched(iterable: list[tuple[str, ...]], size: int) -> Iterable[list[tuple[str, ...]]]:
    for index in range(0, len(iterable), size):
        yield iterable[index:index + size]


def build_camineria_rows(records: list[dict[str, object] | None], geometries: list[str | None]) -> list[tuple[str, ...]]:
    if len(records) != len(geometries):
        raise ValueError("La cantidad de registros DBF y geometrías SHP no coincide para caminería.")

    rows: list[tuple[str, ...]] = []
    for record, geometry in zip(records, geometries):
        if record is None or geometry is None:
            continue

        rows.append((
            sql_literal(record.get("gid")),
            sql_literal(record.get("codigo")),
            sql_literal(record.get("numero")),
            sql_literal(record.get("nombre")),
            sql_literal(record.get("depto")),
            sql_literal(record.get("jurisdicci")),
            sql_literal(record.get("categoria")),
            sql_literal(record.get("sentido")),
            sql_literal(record.get("carriles")),
            sql_literal(record.get("calzada")),
            sql_literal(record.get("fuente")),
            sql_literal(record.get("observacio")),
            sql_literal(record.get("nat_juridi")),
            f"ST_GeomFromText({sql_literal(geometry)}, 4326)"
        ))

    return rows


def build_postes_rows(records: list[dict[str, object] | None], geometries: list[str | None]) -> list[tuple[str, ...]]:
    if len(records) != len(geometries):
        raise ValueError("La cantidad de registros DBF y geometrías SHP no coincide para postes km.")

    rows: list[tuple[str, ...]] = []
    for record, geometry in zip(records, geometries):
        if record is None or geometry is None:
            continue

        rows.append((
            sql_literal(record.get("ruta")),
            sql_literal(record.get("km")),
            sql_literal(record.get("relev_por")),
            f"ST_GeomFromText({sql_literal(geometry)}, 4326)"
        ))

    return rows


def emit_insert_blocks(table_name: str, columns: list[str], rows: list[tuple[str, ...]]) -> list[str]:
    statements: list[str] = []
    column_list = ", ".join(columns)
    for batch in batched(rows, 250):
        values = ",\n".join("    (" + ", ".join(row) + ")" for row in batch)
        statements.append(f"INSERT INTO {table_name} ({column_list}) VALUES\n{values};")
    return statements


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera SQL para importar caminería nacional y postes km a PostGIS.")
    parser.add_argument("--camineria-dir", required=True, type=Path)
    parser.add_argument("--postes-dir", required=True, type=Path)
    args = parser.parse_args()

    camineria_records = read_dbf_records(args.camineria_dir / "v_camineria_nacional.dbf")
    camineria_geometries = read_shp_geometries(args.camineria_dir / "v_camineria_nacional.shp")
    postes_records = read_dbf_records(args.postes_dir / "postes_km.dbf")
    postes_geometries = read_shp_geometries(args.postes_dir / "postes_km.shp")

    camineria_rows = build_camineria_rows(camineria_records, camineria_geometries)
    postes_rows = build_postes_rows(postes_records, postes_geometries)

    statements: list[str] = [
        "BEGIN;",
        """
DROP TABLE IF EXISTS camineria_nacional;
CREATE TABLE camineria_nacional (
    id BIGSERIAL PRIMARY KEY,
    gid BIGINT,
    codigo TEXT,
    numero INTEGER,
    nombre TEXT,
    depto TEXT,
    jurisdiccion TEXT,
    categoria TEXT,
    sentido TEXT,
    carriles TEXT,
    calzada TEXT,
    fuente TEXT,
    observacion TEXT,
    nat_juridica TEXT,
    geom geometry(MultiLineString, 4326) NOT NULL
);
        """.strip(),
        """
DROP TABLE IF EXISTS postes_km;
CREATE TABLE postes_km (
    id BIGSERIAL PRIMARY KEY,
    ruta INTEGER,
    km INTEGER,
    relev_por TEXT,
    geom geometry(Point, 4326) NOT NULL
);
        """.strip(),
    ]

    statements.extend(emit_insert_blocks(
        "camineria_nacional",
        [
            "gid", "codigo", "numero", "nombre", "depto", "jurisdiccion",
            "categoria", "sentido", "carriles", "calzada", "fuente",
            "observacion", "nat_juridica", "geom"
        ],
        camineria_rows
    ))

    statements.extend(emit_insert_blocks(
        "postes_km",
        ["ruta", "km", "relev_por", "geom"],
        postes_rows
    ))

    statements.extend([
        "CREATE INDEX idx_camineria_nacional_geom ON camineria_nacional USING GIST (geom);",
        "CREATE INDEX idx_camineria_nacional_numero ON camineria_nacional (numero);",
        "CREATE INDEX idx_postes_km_geom ON postes_km USING GIST (geom);",
        "CREATE INDEX idx_postes_km_ruta ON postes_km (ruta);",
        "ANALYZE camineria_nacional;",
        "ANALYZE postes_km;",
        "COMMIT;"
    ])

    print("\n".join(statements))


if __name__ == "__main__":
    main()
