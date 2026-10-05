# Inicialización en una máquina nueva

Esta guía es para integrantes del equipo que van a desarrollar o modificar el laboratorio. Instala las herramientas, clona el repositorio y levanta el entorno completo en tu máquina.

## 1. Requisitos

- Docker Desktop (Windows/macOS) o Docker Engine con Compose v2 (Linux).
- Git para clonar el repositorio.

No se necesita SQL Server ni MongoDB instalados localmente. Docker los proporciona como contenedores.

## 2. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd nueva_estructura
```

En PowerShell:

```powershell
git clone <url-del-repositorio>
cd nueva_estructura
```

## 3. Configurar contraseñas

Copia el archivo de ejemplo y completa las credenciales:

```bash
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Edita el archivo `.env` y completa las contraseñas requeridas:

```dotenv
SQL_ADMIN_PASSWORD=TuContraseñaSegura1!
MONGO_ADMIN_PASSWORD=TuContraseñaMongo1!
```

> SQL Server exige contraseñas con al menos 8 caracteres combinando mayúsculas, minúsculas, números y símbolos.

## 4. Construir y levantar desde el código fuente

Esta variante compila las imágenes de inicialización localmente a partir de los `Dockerfile` y scripts en `db/`:

```bash
docker compose -f compose.yaml -f compose.build.yaml up -d --build
```

Compose realiza el proceso completo:

1. Descarga las imágenes base de SQL Server y MongoDB.
2. Construye las imágenes de inicialización (`sql-init` y `mongo-init`).
3. Crea los volúmenes `sql-data` y `mongo-data`.
4. Espera que ambos motores estén saludables.
5. Ejecuta los scripts de `bootstrap/` en cada motor.
6. Ejecuta los scripts de `changes/` si los hay.

## 5. Verificar el resultado

```bash
docker compose ps -a
```

Estado esperado:

| Contenedor | Estado |
|---|---|
| `sqlserver` | `Up (healthy)` |
| `mongodb` | `Up (healthy)` |
| `sql-init` | `Exited (0)` |
| `mongo-init` | `Exited (0)` |

Los contenedores `sql-init` y `mongo-init` terminan con código `0` porque son tareas de inicialización, no servidores permanentes.

## 6. Consultar logs cuando algo falla

```bash
docker compose logs --no-color sqlserver
docker compose logs --no-color mongodb
docker compose logs --no-color sql-init
docker compose logs --no-color mongo-init
```

Problemas frecuentes:

- **Contraseña débil en SQL Server**: completar `SQL_ADMIN_PASSWORD` con una contraseña que cumpla los requisitos (mayúsculas, minúsculas, números y símbolos).
- **Puerto 1433 ocupado**: cambiar `SQL_HOST_PORT` en `.env`.
- **Puerto 27017 ocupado**: cambiar `MONGO_HOST_PORT` en `.env`.
- **Docker Desktop detenido**: iniciarlo antes de ejecutar Compose.
- **Imagen no encontrada**: ejecutar `docker login` y luego repetir el comando.

## 7. Detener o reiniciar

Detener conservando datos:

```bash
docker compose down
```

Volver a iniciar con los mismos datos (sin volver a ejecutar los scripts):

```bash
docker compose up -d sqlserver mongodb
```

Eliminar todos los datos y reconstruir desde cero:

```bash
docker compose down --volumes
docker compose -f compose.yaml -f compose.build.yaml up -d --build
```

> `down --volumes` borra deliberadamente las bases locales. No usarlo si necesitas conservar los datos del ejercicio.

## 8. Agregar cambios al esquema

Para agregar nuevas tablas, columnas o colecciones, consulta la guía [Evolución manual del esquema](EVOLUCION_MANUAL.md).