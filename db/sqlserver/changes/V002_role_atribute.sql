USE agroTecno_db;
GO

IF COL_LENGTH(N'seguridad.[user]', N'role') IS NULL
    THROW 50001, 'No existe seguridad.user.role', 1;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_user_username'
      AND object_id = OBJECT_ID(N'seguridad.[user]')
)
    DROP INDEX IX_user_username ON seguridad.[user];
GO

ALTER TABLE seguridad.[user]
    ALTER COLUMN role VARCHAR(20) NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_user_username
ON seguridad.[user] (username)
INCLUDE (status, role);
GO

ALTER PROCEDURE seguridad.sp_registrar_usuario
    @p_username VARCHAR(50),
    @p_plain_password VARCHAR(256),
    @p_role VARCHAR(20),
    @p_created_by VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

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
