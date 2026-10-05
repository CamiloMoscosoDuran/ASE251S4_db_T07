# Evolución manual del esquema y datos

Esta guía explica cómo agregar nuevas tablas, columnas, colecciones o datos a las bases de datos de forma ordenada y reproducible, usando las carpetas `bootstrap/` y `changes/`.

## Estructura de carpetas

```
db/
├── sqlserver/
│   ├── bootstrap/      ← Scripts de estado inicial (se ejecutan una sola vez al crear la BD)
│   ├── changes/        ← Scripts de cambios incrementales (migraciones)
│   ├── Dockerfile
│   └── run.sh
└── mongodb/
    ├── bootstrap/      ← Scripts de estado inicial (JS para mongosh)
    ├── changes/        ← Scripts de cambios incrementales (JS para mongosh)
    ├── Dockerfile
    └── run.sh
```

## Convención de nombres

Los scripts deben nombrarse con un número de secuencia para garantizar el orden de ejecución:

```
10_nueva_tabla.sql
11_agregar_columna.sql
```

```
10_nueva_coleccion.js
11_agregar_indice.js
```

## Cuándo usar `bootstrap/` y cuándo `changes/`

| Carpeta | Cuándo usarla |
|---|---|
| `bootstrap/` | Estado inicial completo: creación de BD, tablas, colecciones, índices y datos semilla. Solo se ejecuta desde cero. |
| `changes/` | Cambios incrementales que se aplican sobre una BD ya existente: nuevas tablas, columnas, índices o registros adicionales. |

> Si bajas los volúmenes con `down --volumes`, `bootstrap/` se vuelve a ejecutar completo y luego se aplican los `changes/` en orden.

## 1. Agregar un cambio en SQL Server

Crea un archivo nuevo en `db/sqlserver/changes/`:

```sql
-- db/sqlserver/changes/10_nueva_tabla.sql
USE agroTecno_db;
GO

IF OBJECT_ID('dbo.nueva_tabla', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.nueva_tabla (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre NVARCHAR(100) NOT NULL
    );
END
GO
```

## 2. Agregar un cambio en MongoDB

Crea un archivo nuevo en `db/mongodb/changes/`:

```js
// db/mongodb/changes/10_nueva_coleccion.js
db = db.getSiblingDB('AgroTecnoDB');

if (db.getCollectionInfos({ name: 'nueva_coleccion' }).length === 0) {
    db.createCollection('nueva_coleccion');
    db.nueva_coleccion.createIndex({ campo: 1 });
}
```

## 3. Aplicar los cambios

Como se modificaron archivos locales, hay que reconstruir la imagen de inicialización:

```bash
docker compose down --volumes
docker compose -f compose.yaml -f compose.build.yaml up -d --build
```

O, si solo quieres reconstruir sin borrar los datos del motor:

```bash
docker compose -f compose.yaml -f compose.build.yaml up -d --build
```

> Los scripts de `bootstrap/` solo se ejecutan si los volúmenes están vacíos. Los de `changes/` se ejecutan siempre en orden.

## 4. Verificar que se aplicaron

```bash
docker compose logs --no-color sql-init
docker compose logs --no-color mongo-init
```

Debes ver una línea por cada script aplicado:

```
SQL Server: ejecutando bootstrap...
Aplicando bootstrap/01_database.sql
...
SQL Server: ejecutando changes...
Aplicando changes/10_nueva_tabla.sql
SQL Server: listo.
```

## 5. Publicar la nueva versión

Una vez validado localmente, construye y publica las imágenes actualizadas en Docker Hub:

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t camilomoscoso/ase251s4-db-sqlserver-init:latest \
  --push ./db/sqlserver/

docker buildx build --platform linux/amd64,linux/arm64 \
  -t camilomoscoso/ase251s4-db-mongodb-init:latest \
  --push ./db/mongodb/
```

Cualquier persona que ejecute `docker compose pull` descargará la versión actualizada.