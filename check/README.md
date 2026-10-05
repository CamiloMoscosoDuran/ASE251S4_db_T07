Checker de SQL Server y MongoDB

El servicio expone Swagger UI en `/swagger-ui` y las rutas `/health`, `/connections`, `/version`, `/contract`, `/samples` y `/diagnostics`.

Compose inicia el checker solo después de que ambos servicios de inicialización terminan correctamente. La configuración de conexión y versión se entrega por variables de entorno.
