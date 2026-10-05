# Levantar las bases para probar otro sistema

Esta guía es para quien no agregará cambios ni desarrollará el laboratorio. Solo descargará las imágenes publicadas, levantará SQL Server y MongoDB, y conectará su propia aplicación.

## 1. Requisitos

- Docker Desktop o Docker Engine con Compose v2.
- Git para descargar el repositorio.

No se necesita SQL Server ni MongoDB instalados en la computadora.

## 2. Descargar la configuración

```bash
git clone <url-del-repositorio>
cd nueva_estructura
cp .env.example .env
```

En PowerShell:

```powershell
git clone <url-del-repositorio>
cd nueva_estructura
Copy-Item .env.example .env
```

Clonar no implica compilar. En esta guía Compose solo descarga imágenes publicadas desde Docker Hub.

Para consumir sin clonar, consulta la guía [Consumo sin clonar el repositorio](CONSUMO_SIN_REPOSITORIO.md).

## 3. Configurar contraseñas

Edita el archivo `.env` y completa las credenciales:

```dotenv
SQL_ADMIN_PASSWORD=TuContraseñaSegura1!
MONGO_ADMIN_PASSWORD=TuContraseñaMongo1!
```

Para obtener siempre la publicación más reciente:

```dotenv
LAB_VERSION=latest
```

## 4. Levantar el entorno

```bash
docker compose pull
docker compose up -d
```

Compose realiza el proceso completo:

1. Descarga las imágenes de SQL Server y MongoDB desde Docker Hub.
2. Descarga las imágenes de inicialización publicadas.
3. Espera que ambos motores estén saludables.
4. Ejecuta los scripts de inicialización automáticamente.

## 5. Conectar tu aplicación

### SQL Server

```text
Host:     localhost
Puerto:   1433
Usuario:  sa
Password: valor de SQL_ADMIN_PASSWORD
Base:     agroTecno_db
JDBC:     jdbc:sqlserver://localhost:1433;databaseName=agroTecno_db;encrypt=true;trustServerCertificate=true
```

### MongoDB

```text
Host:                 localhost
Puerto:               27017
Usuario:              admin
Password:             valor de MONGO_ADMIN_PASSWORD
Base:                 AgroTecnoDB
Auth source:          admin
URI de conexión:      mongodb://admin:<password>@localhost:27017/AgroTecnoDB?authSource=admin
```

### MongoDB Compass (interfaz gráfica)

Pegar directamente en el campo de conexión:

```
mongodb://admin:<password>@localhost:27017/?authSource=admin
```

### SQL Server Management Studio o Azure Data Studio

```text
Server:       localhost,1433
Login:        sa
Password:     valor de SQL_ADMIN_PASSWORD
Encryption:   Optional / Trust Server Certificate: true
```

## 6. Verificar el entorno

```bash
docker compose ps -a
```

| Contenedor | Estado esperado |
|---|---|
| `sqlserver` | `Up (healthy)` |
| `mongodb` | `Up (healthy)` |
| `sql-init` | `Exited (0)` |
| `mongo-init` | `Exited (0)` |

## 7. Uso diario

Detener conservando datos:

```bash
docker compose down
```

Volver a iniciar:

```bash
docker compose up -d sqlserver mongodb
```

Actualizar imágenes cuando se usa `latest`:

```bash
docker compose pull
docker compose up -d --force-recreate
```

Eliminar todos los datos locales y reconstruir:

```bash
docker compose down --volumes
docker compose up -d
```

> `down --volumes` borra deliberadamente los datos. No usarlo si necesitas conservar la información del ejercicio.