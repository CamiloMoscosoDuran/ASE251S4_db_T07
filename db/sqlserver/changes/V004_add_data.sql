USE agroTecno_db;
GO

-- 1. LIMPIEZA DE TABLAS TRANSACCIONALES (En orden por dependencias de Claves Foráneas)
DELETE FROM cobranzas.installment;
DELETE FROM cobranzas.collection_detail;
DELETE FROM cobranzas.payment_collection;
DELETE FROM ventas.order_detail;
DELETE FROM ventas.sales_order;

-- Reiniciar contadores IDENTITY (solo si ya tenían registros para evitar que inicien en 0)
IF IDENT_CURRENT('ventas.sales_order') IS NOT NULL DBCC CHECKIDENT ('ventas.sales_order', RESEED, 0);
IF IDENT_CURRENT('ventas.order_detail') IS NOT NULL DBCC CHECKIDENT ('ventas.order_detail', RESEED, 0);
IF IDENT_CURRENT('cobranzas.payment_collection') IS NOT NULL DBCC CHECKIDENT ('cobranzas.payment_collection', RESEED, 0);
IF IDENT_CURRENT('cobranzas.collection_detail') IS NOT NULL DBCC CHECKIDENT ('cobranzas.collection_detail', RESEED, 0);
IF IDENT_CURRENT('cobranzas.installment') IS NOT NULL DBCC CHECKIDENT ('cobranzas.installment', RESEED, 0);
GO

-- 2. INSERCIÓN DE 15 ÓRDENES DE VENTA (CABECERA Y DETALLE)
-- Nota: El trigger 'trg_ActualizarTotalOrder' recalcula 'total_order' automáticamente al insertar el detalle.

SET NOCOUNT ON;

-- Arreglo temporal/Simulación de inserción alineada con MongoDB
DECLARE @ahora DATETIME = GETDATE();

-- Orden 1: Cliente CUS001 (Ica - Uva) -> Compra FOR001 (NutriBio) y FOR002 (K-Max)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS001', DATEADD(DAY, -15, @ahora), 'C', DATEADD(DAY, -15, @ahora)); -- ID: 1

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES 
(1, 'FOR001', 10.00, 420.00, DATEADD(DAY, -15, @ahora)),
(1, 'FOR002', 5.00, 600.00, DATEADD(DAY, -15, @ahora));

-- Orden 2: Cliente CUS001 -> Compra FOR003 (Calcio-Boro)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS001', DATEADD(DAY, -10, @ahora), 'P', DATEADD(DAY, -10, @ahora)); -- ID: 2

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (2, 'FOR003', 8.00, 480.00, DATEADD(DAY, -10, @ahora));

-- Orden 3: Cliente CUS001 -> Compra FOR006 (Anti-Stress)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS001', DATEADD(DAY, -5, @ahora), 'P', DATEADD(DAY, -5, @ahora)); -- ID: 3

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (3, 'FOR006', 4.00, 560.00, DATEADD(DAY, -5, @ahora));

-- Orden 4: Cliente CUS002 (Cañete - Palto) -> Compra FOR004 (Bio-Root)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS002', DATEADD(DAY, -14, @ahora), 'C', DATEADD(DAY, -14, @ahora)); -- ID: 4

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (4, 'FOR004', 12.00, 510.00, DATEADD(DAY, -14, @ahora));

-- Orden 5: Cliente CUS002 -> Compra FOR005 (MicroMix)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS002', DATEADD(DAY, -8, @ahora), 'P', DATEADD(DAY, -8, @ahora)); -- ID: 5

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (5, 'FOR005', 6.00, 680.00, DATEADD(DAY, -8, @ahora));

-- Orden 6: Cliente CUS003 (Trujillo - Arándano) -> Compra FOR002 y FOR014
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS003', DATEADD(DAY, -12, @ahora), 'C', DATEADD(DAY, -12, @ahora)); -- ID: 6

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES 
(6, 'FOR002', 15.00, 600.00, DATEADD(DAY, -12, @ahora)),
(6, 'FOR014', 10.00, 460.00, DATEADD(DAY, -12, @ahora));

-- Orden 7: Cliente CUS003 -> Compra FOR008 (Shield-K)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS003', DATEADD(DAY, -4, @ahora), 'P', DATEADD(DAY, -4, @ahora)); -- ID: 7

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (7, 'FOR008', 20.00, 440.00, DATEADD(DAY, -4, @ahora));

-- Orden 8: Cliente CUS004 (Chincha - Espárrago) -> Compra FOR007 (SueloSano)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS004', DATEADD(DAY, -11, @ahora), 'A', DATEADD(DAY, -11, @ahora)); -- ID: 8 (A = Anulado / Pospuesto)

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (8, 'FOR007', 25.00, 320.00, DATEADD(DAY, -11, @ahora));

-- Orden 9: Cliente CUS005 (Chanchamayo - Cítricos) -> Compra FOR005 (MicroMix)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS005', DATEADD(DAY, -10, @ahora), 'C', DATEADD(DAY, -10, @ahora)); -- ID: 9

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (9, 'FOR005', 8.00, 680.00, DATEADD(DAY, -10, @ahora));

-- Orden 10: Cliente CUS005 -> Compra FOR009 (VerdeCloro)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS005', DATEADD(DAY, -3, @ahora), 'P', DATEADD(DAY, -3, @ahora)); -- ID: 10

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (10, 'FOR009', 10.00, 520.00, DATEADD(DAY, -3, @ahora));

-- Orden 11: Cliente CUS006 (Sullana - Mango) -> Compra FOR012 (LegumFix)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS006', DATEADD(DAY, -9, @ahora), 'C', DATEADD(DAY, -9, @ahora)); -- ID: 11

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (11, 'FOR012', 5.00, 720.00, DATEADD(DAY, -9, @ahora));

-- Orden 12: Cliente CUS007 (Chiclayo - Maíz) -> Compra FOR001 (NutriBio)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS007', DATEADD(DAY, -8, @ahora), 'C', DATEADD(DAY, -8, @ahora)); -- ID: 12

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (12, 'FOR001', 30.00, 420.00, DATEADD(DAY, -8, @ahora));

-- Orden 13: Cliente CUS008 (Chancay - Fresa) -> Compra FOR003 (Calcio-Boro)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS008', DATEADD(DAY, -7, @ahora), 'P', DATEADD(DAY, -7, @ahora)); -- ID: 13

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (13, 'FOR003', 15.00, 480.00, DATEADD(DAY, -7, @ahora));

-- Orden 14: Cliente CUS009 (Arequipa - Granada) -> Compra FOR011 (N-K Balance)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS009', DATEADD(DAY, -6, @ahora), 'A', DATEADD(DAY, -6, @ahora)); -- ID: 14 (A = Anulado)

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (14, 'FOR011', 10.00, 580.00, DATEADD(DAY, -6, @ahora));

-- Orden 15: Cliente CUS010 (Moquegua - Palto) -> Compra FOR015 (TotalGrip)
INSERT INTO ventas.sales_order (mongo_customer_id, entry_date, order_status, created_at)
VALUES ('CUS010', DATEADD(DAY, -5, @ahora), 'C', DATEADD(DAY, -5, @ahora)); -- ID: 15

INSERT INTO ventas.order_detail (sales_order_order_id, mongo_formula_id, quantity, unit_price, created_at)
VALUES (15, 'FOR015', 10.00, 650.00, DATEADD(DAY, -5, @ahora));
GO


-- 3. INSERCIÓN DE EXPEDIENTES DE COBRANZA Y DETALLES DE ASIGNACIÓN

-- Expediente 1 (Para Orden 1 / Cliente CUS001 / Total: $7,200)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (1, 'CUS001', 7200.00, 2, 'C', DATEADD(DAY, -15, GETDATE())); -- ID: 1

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (1, 1, 'Expediente de crédito contado 15 días - Fundo El Sol', 1, DATEADD(DAY, -15, GETDATE()));

-- Expediente 2 (Para Orden 2 / Cliente CUS001 / Total: $3,840)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (2, 'CUS001', 3840.00, 2, 'P', DATEADD(DAY, -10, GETDATE())); -- ID: 2

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (2, 1, 'Financiamiento en 2 cuotas - Parcela Fundo El Sol', 1, DATEADD(DAY, -10, GETDATE()));

-- Expediente 3 (Para Orden 3 / Cliente CUS001 / Total: $2,240)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (3, 'CUS001', 2240.00, 1, 'P', DATEADD(DAY, -5, GETDATE())); -- ID: 3

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (3, 1, 'Pago único contraentrega - Fundo El Sol', 1, DATEADD(DAY, -5, GETDATE()));

-- Expediente 4 (Para Orden 4 / Cliente CUS002 / Total: $6,120)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (4, 'CUS002', 6120.00, 1, 'C', DATEADD(DAY, -14, GETDATE())); -- ID: 4

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (4, 1, 'Cancelación total en efectivo - Don María', 1, DATEADD(DAY, -14, GETDATE()));

-- Expediente 5 (Para Orden 5 / Cliente CUS002 / Total: $4,080)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (5, 'CUS002', 4080.00, 2, 'P', DATEADD(DAY, -8, GETDATE())); -- ID: 5

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (5, 1, 'Crédito campaña palto 30 días - Don María', 1, DATEADD(DAY, -8, GETDATE()));

-- Expediente 6 (Para Orden 6 / Cliente CUS003 / Total: $13,600)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (6, 'CUS003', 13600.00, 2, 'C', DATEADD(DAY, -12, GETDATE())); -- ID: 6

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (6, 1, 'Crédito corporativo arándanos - Parcela San José', 1, DATEADD(DAY, -12, GETDATE()));

-- Expediente 7 (Para Orden 7 / Cliente CUS003 / Total: $8,800)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (7, 'CUS003', 8800.00, 2, 'P', DATEADD(DAY, -4, GETDATE())); -- ID: 7

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (7, 1, 'Crédito segunda etapa floración - Parcela San José', 1, DATEADD(DAY, -4, GETDATE()));

-- Expediente 8 (Para Orden 8 / Cliente CUS004 / Total: $8,000)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (8, 'CUS004', 8000.00, 1, 'P', DATEADD(DAY, -11, GETDATE())); -- ID: 8

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (8, 1, 'Pospuesto por negociación - Fundo La Esperanza', 1, DATEADD(DAY, -11, GETDATE()));

-- Expediente 9 (Para Orden 9 / Cliente CUS005 / Total: $5,440)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (9, 'CUS005', 5440.00, 1, 'C', DATEADD(DAY, -10, GETDATE())); -- ID: 9

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (9, 1, 'Transferencia bancaria al contado - Fundo Los Olivos', 1, DATEADD(DAY, -10, GETDATE()));

-- Expediente 10 (Para Orden 10 / Cliente CUS005 / Total: $5,200)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (10, 'CUS005', 5200.00, 2, 'P', DATEADD(DAY, -3, GETDATE())); -- ID: 10

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (10, 1, 'Crédito quincenal - Fundo Los Olivos', 1, DATEADD(DAY, -3, GETDATE()));

-- Expediente 11 (Para Orden 11 / Cliente CUS006 / Total: $3,600)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (11, 'CUS006', 3600.00, 1, 'C', DATEADD(DAY, -9, GETDATE())); -- ID: 11

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (11, 1, 'Cancelado en agencias Piura - Valle Verde', 1, DATEADD(DAY, -9, GETDATE()));

-- Expediente 12 (Para Orden 12 / Cliente CUS007 / Total: $12,600)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (12, 'CUS007', 12600.00, 3, 'C', DATEADD(DAY, -8, GETDATE())); -- ID: 12

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (12, 1, 'Crédito maicero 3 cuotas - El Mirador', 1, DATEADD(DAY, -8, GETDATE()));

-- Expediente 13 (Para Orden 13 / Cliente CUS008 / Total: $7,200)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (13, 'CUS008', 7200.00, 2, 'P', DATEADD(DAY, -7, GETDATE())); -- ID: 13

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (13, 1, 'Financiamiento campaña fresa - Santa Isabel', 1, DATEADD(DAY, -7, GETDATE()));

-- Expediente 14 (Para Orden 14 / Cliente CUS009 / Total: $5,800)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (14, 'CUS009', 5800.00, 1, 'P', DATEADD(DAY, -6, GETDATE())); -- ID: 14

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (14, 1, 'Cobranza en observación por cancelación - Don Víctor', 1, DATEADD(DAY, -6, GETDATE()));

-- Expediente 15 (Para Orden 15 / Cliente CUS010 / Total: $6,500)
INSERT INTO cobranzas.payment_collection (order_id, mongo_customer_id, total_amount, installments_count, payment_status, created_at)
VALUES (15, 'CUS010', 6500.00, 1, 'C', DATEADD(DAY, -5, GETDATE())); -- ID: 15

INSERT INTO cobranzas.collection_detail (collection_id, line_number, description, status, created_at)
VALUES (15, 1, 'Pago al contado por cheque gerencia - Fundo El Pedregal', 1, DATEADD(DAY, -5, GETDATE()));
GO


-- 4. INSERCIÓN DE CUOTAS (INSTALLMENTS) PARA CADA EXPEDIENTE

INSERT INTO cobranzas.installment (collection_id, installment_num, due_date, amount_due, amount_paid, payment_type, payment_date, observation, status, created_at)
VALUES 
-- Expediente 1 (CUS001): 2 cuotas pagadas
(1, 1, CAST(DATEADD(DAY, -10, GETDATE()) AS DATE), 3600.00, 3600.00, 'Transferencia', CAST(DATEADD(DAY, -10, GETDATE()) AS DATE), 'Abono completo cuota 1', 'C', GETDATE()),
(1, 2, CAST(DATEADD(DAY, -2, GETDATE()) AS DATE), 3600.00, 3600.00, 'Transferencia', CAST(DATEADD(DAY, -2, GETDATE()) AS DATE), 'Abono completo cuota 2', 'C', GETDATE()),

-- Expediente 2 (CUS001): Cuota 1 vencida con abono parcial, Cuota 2 futura
(2, 1, CAST(DATEADD(DAY, -5, GETDATE()) AS DATE), 1920.00, 1000.00, 'Efectivo', CAST(DATEADD(DAY, -3, GETDATE()) AS DATE), 'Abono parcial registrado en campo', 'A', GETDATE()),
(2, 2, CAST(DATEADD(DAY, 10, GETDATE()) AS DATE), 1920.00, 0.00, NULL, NULL, 'Cuota pendiente', 'P', GETDATE()),

-- Expediente 3 (CUS001): 1 cuota pendiente
(3, 1, CAST(DATEADD(DAY, 5, GETDATE()) AS DATE), 2240.00, 0.00, NULL, NULL, 'Pendiente de cobro', 'P', GETDATE()),

-- Expediente 4 (CUS002): 1 cuota pagada
(4, 1, CAST(DATEADD(DAY, -14, GETDATE()) AS DATE), 6120.00, 6120.00, 'Depósito', CAST(DATEADD(DAY, -14, GETDATE()) AS DATE), 'Pago total inmediato', 'C', GETDATE()),

-- Expediente 5 (CUS002): 2 cuotas pendientes
(5, 1, CAST(DATEADD(DAY, -1, GETDATE()) AS DATE), 2040.00, 0.00, NULL, NULL, 'Cuota 1 vencida', 'P', GETDATE()),
(5, 2, CAST(DATEADD(DAY, 15, GETDATE()) AS DATE), 2040.00, 0.00, NULL, NULL, 'Cuota 2 programa', 'P', GETDATE()),

-- Expediente 6 (CUS003): 2 cuotas pagadas
(6, 1, CAST(DATEADD(DAY, -10, GETDATE()) AS DATE), 6800.00, 6800.00, 'Transferencia', CAST(DATEADD(DAY, -10, GETDATE()) AS DATE), 'Cuota 1 al día', 'C', GETDATE()),
(6, 2, CAST(DATEADD(DAY, -3, GETDATE()) AS DATE), 6800.00, 6800.00, 'Transferencia', CAST(DATEADD(DAY, -3, GETDATE()) AS DATE), 'Cuota 2 al día', 'C', GETDATE()),

-- Expediente 7 (CUS003): 2 cuotas pendientes
(7, 1, CAST(DATEADD(DAY, 7, GETDATE()) AS DATE), 4400.00, 0.00, NULL, NULL, 'Vence próxima semana', 'P', GETDATE()),
(7, 2, CAST(DATEADD(DAY, 22, GETDATE()) AS DATE), 4400.00, 0.00, NULL, NULL, 'Cuota final', 'P', GETDATE()),

-- Expediente 8 (CUS004): 1 cuota vencida
(8, 1, CAST(DATEADD(DAY, -4, GETDATE()) AS DATE), 8000.00, 0.00, NULL, NULL, 'Pendiente por reunión de campo pospuesta', 'P', GETDATE()),

-- Expediente 9 (CUS005): 1 cuota pagada
(9, 1, CAST(DATEADD(DAY, -10, GETDATE()) AS DATE), 5440.00, 5440.00, 'Transferencia', CAST(DATEADD(DAY, -10, GETDATE()) AS DATE), 'Pago completo', 'C', GETDATE()),

-- Expediente 10 (CUS005): 2 cuotas pendientes
(10, 1, CAST(DATEADD(DAY, 5, GETDATE()) AS DATE), 2600.00, 0.00, NULL, NULL, 'Primera cuota', 'P', GETDATE()),
(10, 2, CAST(DATEADD(DAY, 20, GETDATE()) AS DATE), 2600.00, 0.00, NULL, NULL, 'Segunda cuota', 'P', GETDATE()),

-- Expediente 11 (CUS006): 1 cuota pagada
(11, 1, CAST(DATEADD(DAY, -9, GETDATE()) AS DATE), 3600.00, 3600.00, 'Efectivo', CAST(DATEADD(DAY, -9, GETDATE()) AS DATE), 'Pago contraentrega', 'C', GETDATE()),

-- Expediente 12 (CUS007): 3 cuotas pagadas
(12, 1, CAST(DATEADD(DAY, -8, GETDATE()) AS DATE), 4200.00, 4200.00, 'Transferencia', CAST(DATEADD(DAY, -8, GETDATE()) AS DATE), 'Cuota 1 ok', 'C', GETDATE()),
(12, 2, CAST(DATEADD(DAY, -5, GETDATE()) AS DATE), 4200.00, 4200.00, 'Transferencia', CAST(DATEADD(DAY, -5, GETDATE()) AS DATE), 'Cuota 2 ok', 'C', GETDATE()),
(12, 3, CAST(DATEADD(DAY, -1, GETDATE()) AS DATE), 4200.00, 4200.00, 'Transferencia', CAST(DATEADD(DAY, -1, GETDATE()) AS DATE), 'Cuota 3 adelantada', 'C', GETDATE()),

-- Expediente 13 (CUS008): 2 cuotas pendientes
(13, 1, CAST(DATEADD(DAY, 2, GETDATE()) AS DATE), 3600.00, 0.00, NULL, NULL, 'Próxima a vencer', 'P', GETDATE()),
(13, 2, CAST(DATEADD(DAY, 17, GETDATE()) AS DATE), 3600.00, 0.00, NULL, NULL, 'Cuota final', 'P', GETDATE()),

-- Expediente 14 (CUS009): 1 cuota vencida sin pago
(14, 1, CAST(DATEADD(DAY, -2, GETDATE()) AS DATE), 5800.00, 0.00, NULL, NULL, 'Reunión cancelada por el cliente', 'P', GETDATE()),

-- Expediente 15 (CUS010): 1 cuota pagada
(15, 1, CAST(DATEADD(DAY, -5, GETDATE()) AS DATE), 6500.00, 6500.00, 'Cheque', CAST(DATEADD(DAY, -5, GETDATE()) AS DATE), 'Cheque verificado y liberado', 'C', GETDATE());
GO

PRINT '¡Sembrado de 15 transacciones completado con éxito!';