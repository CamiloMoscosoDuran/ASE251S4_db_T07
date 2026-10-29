USE agroTecno_db;
GO

ALTER TABLE cobranzas.collection_detail
    ADD description VARCHAR(255) NULL;
GO

UPDATE cobranzas.collection_detail
SET description = ''
WHERE description IS NULL;
GO

ALTER TABLE cobranzas.collection_detail
    ALTER COLUMN description VARCHAR(255) NOT NULL;
GO