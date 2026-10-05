# Consumo sin clonar el repositorio

Esta guía es para quien solo necesita los archivos de configuración de Compose para levantar las bases de datos, sin clonar el repositorio completo.

## 1. Requisitos

- Docker Desktop o Docker Engine con Compose v2.

No se necesita Git, SQL Server ni MongoDB instalados localmente.

## 2. Descargar solo los archivos necesarios

Crea una carpeta en tu equipo y descarga únicamente el `compose.yaml` y el `.env.example`:

```bash
mkdir agrotecno-db
cd agrotecno-db
```

Descarga el `compose.yaml` directamente:

```bash
curl -O https://raw.githubusercontent.com/<tu-usuario>/<tu-repo>/main/compose.yaml
curl -O https://raw.githubusercontent.com/<tu-usuario>/<tu-repo>/main/.env.example
```

En PowerShell:

```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/<tu-usuario>/<tu-repo>/main/compose.yaml" -OutFile "compose.yaml"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/<tu-usuario>/<tu-repo>/main/.env.example" -OutFile ".env.example"
```

## 3. Configurar contraseñas

```bash
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Edita el archivo `.env`:

```dotenv
SQL_ADMIN_PASSWORD=TuContraseñaSegura1!
MONGO_ADMIN_PASSWORD=TuContraseñaMongo1!
```

## 4. Levantar

```bash
docker compose pull
docker compose up -d
```

Compose descargará automáticamente desde Docker Hub:

- `camilomoscoso/sql-server:2022` — motor de SQL Server.
- `camilomoscoso/mongo:8` — motor de MongoDB.
- `camilomoscoso/ase251s4-db-sqlserver-init:latest` — inicializador de SQL Server.
- `camilomoscoso/ase251s4-db-mongodb-init:latest` — inicializador de MongoDB.

Los contenedores de inicialización ejecutan los scripts, crean las bases de datos, colecciones y datos semilla, y luego terminan solos.

## 5. Verificar

```bash
docker compose ps -a
```

| Contenedor | Estado esperado |
|---|---|
| `sqlserver` | `Up (healthy)` |
| `mongodb` | `Up (healthy)` |
| `sql-init` | `Exited (0)` |
| `mongo-init` | `Exited (0)` |

## 6. Credenciales de conexión

### SQL Server

```text
Host:     localhost
Puerto:   1433
Usuario:  sa
Password: valor de SQL_ADMIN_PASSWORD
Base:     agroTecno_db
```

### MongoDB

```text
Host:        localhost
Puerto:      27017
Usuario:     admin
Password:    valor de MONGO_ADMIN_PASSWORD
Auth source: admin
Base:        AgroTecnoDB
URI:         mongodb://admin:<password>@localhost:27017/AgroTecnoDB?authSource=admin
```

## 7. Detener

```bash
docker compose down
```

Para eliminar también los datos:

```bash
docker compose down --volumes
```