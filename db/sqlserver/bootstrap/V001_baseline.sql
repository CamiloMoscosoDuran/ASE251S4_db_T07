--- Create the database if it does not exist

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'agroTecno_db')
BEGIN
    CREATE DATABASE agroTecno_db;
END
GO

USE agroTecno_db;
GO

--- Create the schemas if they do not exist

-- Esquema para gestión de usuarios y autenticación
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'seguridad')
BEGIN
    EXEC('CREATE SCHEMA seguridad;');
END
GO

-- Esquema para gestión de órdenes de venta
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'ventas')
BEGIN
    EXEC('CREATE SCHEMA ventas;');
END
GO

-- Esquema para gestión de cuentas por cobrar, cuotas y compromisos de pago
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'cobranzas')
BEGIN
    EXEC('CREATE SCHEMA cobranzas;');
END
GO

--- Create the tables if they do not exist

-- 1. Tabla: seguridad.user
CREATE TABLE seguridad.[user] (
    user_id INT IDENTITY(1,1) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARBINARY(64) NOT NULL,
    role VARCHAR(30) NOT NULL,
    status BIT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NOT NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    restored_at DATETIME NULL
);
GO

-- 2. Tabla: ventas.sales_order
CREATE TABLE ventas.sales_order (
    order_id INT IDENTITY(1,1) NOT NULL,
    entry_date DATETIME NOT NULL DEFAULT GETDATE(),
    referral_guide AS ('REF' + FORMAT(entry_date, 'ddMMyyyy') + '-' + CAST(order_id AS VARCHAR(10))),
    mongo_customer_id VARCHAR(20) NOT NULL,
    total_order DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    order_status CHAR(1) NOT NULL DEFAULT 'P',
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    restored_at DATETIME NULL
);
GO

-- 3. Tabla: ventas.order_detail
CREATE TABLE ventas.order_detail (
    order_detail_id INT IDENTITY(1,1) NOT NULL,
    sales_order_order_id INT NOT NULL,
    mongo_formula_id VARCHAR(20) NOT NULL,
    quantity DECIMAL(8,2) NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    subtotal AS (quantity * unit_price),
    created_at DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 4. Tabla: cobranzas.payment_collection
CREATE TABLE cobranzas.payment_collection (
    collection_id INT IDENTITY(1,1) NOT NULL,
    order_id INT NOT NULL,
    mongo_customer_id VARCHAR(20) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    installments_count INT NOT NULL,
    payment_status CHAR(1) NOT NULL DEFAULT 'P',
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    restored_at DATETIME NULL
);
GO

-- 5. Tabla: cobranzas.collection_detail
CREATE TABLE cobranzas.collection_detail (
    detail_id INT IDENTITY(1,1) NOT NULL,
    collection_id INT NOT NULL,
    line_number INT NOT NULL,
    status BIT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    restored_at DATETIME NULL
);
GO

-- 6. Tabla: cobranzas.installment
CREATE TABLE cobranzas.installment (
    installment_id INT IDENTITY(1,1) NOT NULL,
    collection_id INT NOT NULL,
    installment_num INT NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_type VARCHAR(30) NULL,
    payment_date DATE NULL,
    observation VARCHAR(255) NULL,
    status CHAR(1) NOT NULL DEFAULT 'P',
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    restored_at DATETIME NULL
);
GO

--- Create the constraints if they do not exist

-- 1. CLAVES PRIMARIAS (PRIMARY KEYS)

ALTER TABLE seguridad.[user]
    ADD CONSTRAINT PK_user PRIMARY KEY (user_id);

ALTER TABLE ventas.sales_order
    ADD CONSTRAINT PK_sales_order PRIMARY KEY (order_id);

ALTER TABLE ventas.order_detail
    ADD CONSTRAINT PK_order_detail PRIMARY KEY (order_detail_id);

ALTER TABLE cobranzas.payment_collection
    ADD CONSTRAINT PK_payment_collection PRIMARY KEY (collection_id);

ALTER TABLE cobranzas.collection_detail
    ADD CONSTRAINT PK_collection_detail PRIMARY KEY (detail_id);

ALTER TABLE cobranzas.installment
    ADD CONSTRAINT PK_installment PRIMARY KEY (installment_id);
GO


-- 2. RESTRICCIONES DE UNICIDAD (UNIQUE CONSTRAINTS)

ALTER TABLE seguridad.[user]
    ADD CONSTRAINT UQ_user_username UNIQUE (username);
GO


-- 3. CLAVES FORÁNEAS (FOREIGN KEYS)

-- Relación entre ventas.order_detail y ventas.sales_order
ALTER TABLE ventas.order_detail
    ADD CONSTRAINT FK_order_detail_sales_order 
    FOREIGN KEY (sales_order_order_id)
    REFERENCES ventas.sales_order (order_id)
    ON DELETE CASCADE;

-- Relación entre cobranzas.payment_collection y ventas.sales_order
ALTER TABLE cobranzas.payment_collection
    ADD CONSTRAINT FK_payment_collection_sales_order 
    FOREIGN KEY (order_id)
    REFERENCES ventas.sales_order (order_id)
    ON DELETE NO ACTION;

-- Relación entre cobranzas.collection_detail y cobranzas.payment_collection
ALTER TABLE cobranzas.collection_detail
    ADD CONSTRAINT FK_collection_detail_payment_collection 
    FOREIGN KEY (collection_id)
    REFERENCES cobranzas.payment_collection (collection_id)
    ON DELETE CASCADE;

-- Relación entre cobranzas.installment y cobranzas.payment_collection
ALTER TABLE cobranzas.installment
    ADD CONSTRAINT FK_installment_payment_collection 
    FOREIGN KEY (collection_id)
    REFERENCES cobranzas.payment_collection (collection_id)
    ON DELETE CASCADE;
GO

--- Create the indexes if they do not exist

-- 1. Búsqueda eficiente de usuarios por username (autenticación)
CREATE NONCLUSTERED INDEX IX_user_username
ON seguridad.[user] (username)
INCLUDE (status, role);

-- 2. Filtrado de órdenes por cliente y fecha de ingreso
CREATE NONCLUSTERED INDEX IX_sales_order_mongo_customer
ON ventas.sales_order (mongo_customer_id, entry_date)
INCLUDE (total_order, order_status);

-- 3. Optimización de uniones del detalle hacia la cabecera de la orden
CREATE NONCLUSTERED INDEX IX_order_detail_sales_order_id
ON ventas.order_detail (sales_order_order_id);

-- 4. Rastreo de expedientes de cobro por cliente MongoDB y estado de pago
CREATE NONCLUSTERED INDEX IX_payment_collection_customer
ON cobranzas.payment_collection (mongo_customer_id, payment_status)
INCLUDE (total_amount);

-- 5. Control crítico diario: Vencimiento de cuotas y saldos pendientes
CREATE NONCLUSTERED INDEX IX_installment_due_date_status
ON cobranzas.installment (due_date, status)
INCLUDE (collection_id, installment_num, amount_due, amount_paid);

-- 6. Consultas de cuotas pertenecientes a un expediente de cobranza
CREATE NONCLUSTERED INDEX IX_installment_collection_id
ON cobranzas.installment (collection_id);
GO

--- Create the triggers if they do not exist

-- 1. Trigger: Cifrado automático de contraseñas al insertar usuarios
CREATE OR ALTER TRIGGER seguridad.trg_user_InsertPasswordHash
ON seguridad.[user]
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO seguridad.[user] (
        username,
        password_hash,
        role,
        status,
        created_at,
        created_by,
        updated_at,
        deleted_at,
        restored_at
    )
    SELECT
        username,
        HASHBYTES('SHA2_512', CAST(password_hash AS VARCHAR(256))),
        role,
        ISNULL(status, 1),
        ISNULL(created_at, GETDATE()),
        created_by,
        updated_at,
        deleted_at,
        restored_at
    FROM inserted;
END;
GO

-- 2. Trigger: Cálculo automático del total_order al cambiar el detalle
CREATE OR ALTER TRIGGER ventas.trg_ActualizarTotalOrder
ON ventas.order_detail
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Recalcular para inserciones o actualizaciones
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
        UPDATE so
        SET so.total_order = ISNULL((
            SELECT SUM(quantity * unit_price)
            FROM ventas.order_detail
            WHERE sales_order_order_id = so.order_id
        ), 0.00),
        so.updated_at = GETDATE()
        FROM ventas.sales_order so
        WHERE so.order_id IN (SELECT DISTINCT sales_order_order_id FROM inserted);
    END

    -- Recalcular para eliminaciones
    IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        UPDATE so
        SET so.total_order = ISNULL((
            SELECT SUM(quantity * unit_price)
            FROM ventas.order_detail
            WHERE sales_order_order_id = so.order_id
        ), 0.00),
        so.updated_at = GETDATE()
        FROM ventas.sales_order so
        WHERE so.order_id IN (SELECT DISTINCT sales_order_order_id FROM deleted);
    END
END;
GO


--- Create the views if they do not exist

-- 1. Vista: Control de Cartera Vencida (Cobranzas)
CREATE OR ALTER VIEW cobranzas.vw_cartera_vencida AS
SELECT 
    i.installment_id,
    pc.collection_id,
    pc.order_id,
    pc.mongo_customer_id,
    i.installment_num,
    i.due_date,
    i.amount_due,
    i.amount_paid,
    (i.amount_due - i.amount_paid) AS balance_pending,
    DATEDIFF(DAY, i.due_date, GETDATE()) AS days_overdue
FROM cobranzas.installment i
INNER JOIN cobranzas.payment_collection pc 
    ON i.collection_id = pc.collection_id
WHERE i.status IN ('P', 'A') -- Pendiente o Abonado parcialmente
  AND i.due_date < CAST(GETDATE() AS DATE);
GO

-- 2. Vista: Estado de Cuenta Resumido por Cliente
CREATE OR ALTER VIEW cobranzas.vw_estado_cuenta_cliente AS
SELECT 
    pc.mongo_customer_id,
    COUNT(DISTINCT pc.collection_id) AS total_collections,
    SUM(pc.total_amount) AS total_financed,
    SUM(ISNULL(i.amount_paid, 0)) AS total_collected,
    SUM(pc.total_amount - ISNULL(i.amount_paid, 0)) AS total_outstanding_balance
FROM cobranzas.payment_collection pc
LEFT JOIN cobranzas.installment i 
    ON pc.collection_id = i.collection_id
GROUP BY pc.mongo_customer_id;
GO

-- 3. Vista: Resumen de Órdenes de Venta
CREATE OR ALTER VIEW ventas.vw_resumen_ordenes AS
SELECT 
    so.order_id,
    so.referral_guide,
    so.mongo_customer_id,
    so.entry_date,
    so.total_order,
    so.order_status,
    COUNT(od.order_detail_id) AS total_items
FROM ventas.sales_order so
LEFT JOIN ventas.order_detail od 
    ON so.order_id = od.sales_order_order_id
GROUP BY 
    so.order_id, 
    so.referral_guide, 
    so.mongo_customer_id, 
    so.entry_date, 
    so.total_order, 
    so.order_status;
GO

-- 4. Vista: Usuarios Activos del Sistema (Seguridad)
CREATE OR ALTER VIEW seguridad.vw_usuarios_activos AS
SELECT 
    user_id,
    username,
    role,
    status,
    created_at,
    created_by
FROM seguridad.[user]
WHERE status = 1 
  AND deleted_at IS NULL;
GO

--- Create the stored procedures if they do not exist

-- 1. PROCEDIMIENTO: Registrar un usuario de forma segura
CREATE OR ALTER PROCEDURE seguridad.sp_registrar_usuario
    @p_username VARCHAR(50),
    @p_plain_password VARCHAR(256),
    @p_role VARCHAR(30),
    @p_created_by VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- Inserción directa (el trigger trg_user_InsertPasswordHash o la función HASHBYTES cifrará el password)
    INSERT INTO seguridad.[user] (
        username,
        password_hash,
        role,
        status,
        created_at,
        created_by
    )
    VALUES (
        @p_username,
        HASHBYTES('SHA2_512', CAST(@p_plain_password AS VARCHAR(256))),
        @p_role,
        1,
        GETDATE(),
        @p_created_by
    );
END;
GO

-- 2. PROCEDIMIENTO: Crear una Orden de Venta con su primer ítem de detalle
CREATE OR ALTER PROCEDURE ventas.sp_crear_orden_con_detalles
    @p_mongo_customer_id VARCHAR(20),
    @p_mongo_formula_id VARCHAR(20),
    @p_quantity DECIMAL(8,2),
    @p_unit_price DECIMAL(8,2),
    @p_order_id INT OUTPUT -- Retorna el ID generado para la orden
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- 1. Insertar la cabecera de la orden de venta
        INSERT INTO ventas.sales_order (
            mongo_customer_id,
            entry_date,
            total_order,
            order_status,
            created_at
        )
        VALUES (
            @p_mongo_customer_id,
            GETDATE(),
            0.00, -- El trigger trg_ActualizarTotalOrder actualizará el total automáticamente
            'P',  -- Estado Pendiente
            GETDATE()
        );

        -- Obtener el ID de la orden recién creada
        SET @p_order_id = SCOPE_IDENTITY();

        -- 2. Insertar el ítem en el detalle de la orden
        INSERT INTO ventas.order_detail (
            sales_order_order_id,
            mongo_formula_id,
            quantity,
            unit_price,
            created_at
        )
        VALUES (
            @p_order_id,
            @p_mongo_formula_id,
            @p_quantity,
            @p_unit_price,
            GETDATE()
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 3. PROCEDIMIENTO: Registrar un abono o pago a una cuota de cobranza
CREATE OR ALTER PROCEDURE cobranzas.sp_registrar_abono_cuota
    @p_installment_id INT,
    @p_amount_paid DECIMAL(12,2),
    @p_payment_type VARCHAR(30),
    @p_observation VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        DECLARE @v_amount_due DECIMAL(12,2);
        DECLARE @v_current_paid DECIMAL(12,2);
        DECLARE @v_new_paid DECIMAL(12,2);

        -- Obtener montos actuales de la cuota seleccionada
        SELECT 
            @v_amount_due = amount_due,
            @v_current_paid = amount_paid
        FROM cobranzas.installment
        WHERE installment_id = @p_installment_id;

        -- Validar existencia de la cuota
        IF @v_amount_due IS NULL
        BEGIN
            RAISERROR('La cuota especificada no existe.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Calcular el nuevo total abonado
        SET @v_new_paid = @v_current_paid + @p_amount_paid;

        -- Actualizar la cuota con los nuevos valores y determinar su estado
        UPDATE cobranzas.installment
        SET amount_paid = @v_new_paid,
            payment_type = @p_payment_type,
            payment_date = CAST(GETDATE() AS DATE),
            observation = @p_observation,
            status = CASE 
                        WHEN @v_new_paid >= @v_amount_due THEN 'C' -- Cancelado / Pagado completamente
                        ELSE 'A'                                  -- Abonado parcial
                     END,
            updated_at = GETDATE()
        WHERE installment_id = @p_installment_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

--- Create the seed data for testing and verification

-- ----------------------------------------------------------------------------
-- 1. USUARIOS INICIALES DE PRUEBA / SISTEMA
-- ----------------------------------------------------------------------------
EXEC seguridad.sp_registrar_usuario 
    @p_username = 'admin_agro',
    @p_plain_password = 'AdminPassword123!',
    @p_role = 'Administrador',
    @p_created_by = 'SystemSetup';

EXEC seguridad.sp_registrar_usuario 
    @p_username = 'operador_ventas',
    @p_plain_password = 'VentasPassword123!',
    @p_role = 'Vendedor',
    @p_created_by = 'SystemSetup';
GO

-- ----------------------------------------------------------------------------
-- 2. ÓRDENES DE VENTA Y DETALLES DE PRUEBA
-- ----------------------------------------------------------------------------
DECLARE @order_id_1 INT;
DECLARE @order_id_2 INT;
DECLARE @order_id_3 INT;

-- Orden 1: Cliente CUS001 con Fórmula FOR001
EXEC ventas.sp_crear_orden_con_detalles
    @p_mongo_customer_id = 'CUS001',
    @p_mongo_formula_id = 'FOR001',
    @p_quantity = 10.00,
    @p_unit_price = 150.50,
    @p_order_id = @order_id_1 OUTPUT;

-- Agregar un segundo producto (FOR002) a la misma Orden 1
INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price)
VALUES (@order_id_1, 'FOR002', 5.00, 80.00);

-- Orden 2: Cliente CUS002 con Fórmula FOR003
EXEC ventas.sp_crear_orden_con_detalles
    @p_mongo_customer_id = 'CUS002',
    @p_mongo_formula_id = 'FOR003',
    @p_quantity = 25.00,
    @p_unit_price = 200.00,
    @p_order_id = @order_id_2 OUTPUT;

-- Orden 3: Cliente CUS010 con Fórmula FOR010
EXEC ventas.sp_crear_orden_con_detalles
    @p_mongo_customer_id = 'CUS010',
    @p_mongo_formula_id = 'FOR010',
    @p_quantity = 12.00,
    @p_unit_price = 120.00,
    @p_order_id = @order_id_3 OUTPUT;
GO

-- ----------------------------------------------------------------------------
-- 3. ACUERDOS DE COBRANZA Y CUOTAS DE PRUEBA
-- ----------------------------------------------------------------------------
-- Expediente de cobranza para la Orden 1 (Cliente CUS001)
INSERT INTO cobranzas.payment_collection (
    order_id,
    mongo_customer_id,
    total_amount,
    installments_count,
    payment_status
)
VALUES (
    1,
    'CUS001',
    1905.00,
    2,
    'P'
);

DECLARE @collection_id_1 INT = SCOPE_IDENTITY();

-- Cuota 1 (CUS001): Vencida para validar la vista 'vw_cartera_vencida'
INSERT INTO cobranzas.installment (
    collection_id,
    installment_num,
    due_date,
    amount_due,
    amount_paid,
    status
)
VALUES (
    @collection_id_1,
    1,
    DATEADD(DAY, -15, CAST(GETDATE() AS DATE)),
    952.50,
    0.00,
    'P'
);

-- Cuota 2 (CUS001): Futura
INSERT INTO cobranzas.installment (
    collection_id,
    installment_num,
    due_date,
    amount_due,
    amount_paid,
    status
)
VALUES (
    @collection_id_1,
    2,
    DATEADD(DAY, 15, CAST(GETDATE() AS DATE)),
    952.50,
    0.00,
    'P'
);

-- Expediente de cobranza para la Orden 3 (Cliente CUS010)
INSERT INTO cobranzas.payment_collection (
    order_id,
    mongo_customer_id,
    total_amount,
    installments_count,
    payment_status
)
VALUES (
    3,
    'CUS010',
    1440.00,
    1,
    'P'
);
GO

-- ----------------------------------------------------------------------------
-- 4. SIMULACIÓN DE ABONO EN CUOTA
-- ----------------------------------------------------------------------------
-- Abono parcial a la cuota vencida (ID: 1) del cliente CUS001
EXEC cobranzas.sp_registrar_abono_cuota
    @p_installment_id = 1,
    @p_amount_paid = 500.00,
    @p_payment_type = 'Transferencia',
    @p_observation = 'Abono parcial registrado en campo';
GO

-- ----------------------------------------------------------------------------
-- 5. VERIFICACIÓN
-- ----------------------------------------------------------------------------

SELECT * FROM seguridad.vw_usuarios_activos;

-- 2. Verificar las órdenes de venta registradas y sus totales calculados por el Trigger
SELECT * FROM ventas.vw_resumen_ordenes;

-- 3. Verificar los ítems detallados por cada orden (Clientes CUS001, CUS002, CUS010)
SELECT 
    od.order_detail_id,
    so.referral_guide,
    so.mongo_customer_id,
    od.mongo_formula_id,
    od.quantity,
    od.unit_price,
    od.subtotal
FROM ventas.order_detail od
INNER JOIN ventas.sales_order so ON od.sales_order_order_id = so.order_id;

-- 4. Verificar el estado de cuenta y saldos acumulados por cliente
SELECT * FROM cobranzas.vw_estado_cuenta_cliente;

-- 5. Verificar la cuota vencida del cliente CUS001 con su abono de $500 aplicado
SELECT * FROM cobranzas.vw_cartera_vencida;