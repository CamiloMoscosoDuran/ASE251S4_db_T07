SET NOCOUNT ON;

DECLARE @requested_version INT = $(target_schema_version);
DECLARE @expected_role_length INT = CASE WHEN @requested_version >= 2 THEN 20 ELSE 30 END;

IF OBJECT_ID(N'dbo.schema_changes', N'U') IS NULL
    THROW 50001, 'No existe dbo.schema_changes', 1;

IF (SELECT COUNT(*) FROM dbo.schema_changes) <> @requested_version
   OR (SELECT ISNULL(MIN([sequence]), 0) FROM dbo.schema_changes) <> 1
   OR (SELECT ISNULL(MAX([sequence]), 0) FROM dbo.schema_changes) <> @requested_version
    THROW 50002, 'Historial de cambios discontinuo o distinto de la versión solicitada', 1;

IF OBJECT_ID(N'seguridad.[user]', N'U') IS NULL
   OR OBJECT_ID(N'ventas.sales_order', N'U') IS NULL
   OR OBJECT_ID(N'ventas.order_detail', N'U') IS NULL
   OR OBJECT_ID(N'cobranzas.payment_collection', N'U') IS NULL
   OR OBJECT_ID(N'cobranzas.collection_detail', N'U') IS NULL
   OR OBJECT_ID(N'cobranzas.installment', N'U') IS NULL
   OR OBJECT_ID(N'ventas.vw_resumen_ordenes', N'V') IS NULL
   OR OBJECT_ID(N'ventas.sp_crear_orden_con_detalles', N'P') IS NULL
    THROW 50003, 'Faltan objetos del contrato SQL Server', 1;

IF COL_LENGTH(N'seguridad.[user]', N'role') <> @expected_role_length
    THROW 50004, 'Longitud de seguridad.user.role incompatible con la versión', 1;

IF NOT EXISTS (SELECT 1 FROM seguridad.[user] WHERE username = 'admin_agro')
   OR NOT EXISTS (SELECT 1 FROM seguridad.[user] WHERE username = 'operador_ventas')
    THROW 50005, 'Faltan usuarios semilla', 1;

PRINT 'SQL Server: contrato ' + CONVERT(VARCHAR(12), @requested_version) + ' verificado';
