SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.schema_changes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.schema_changes (
        [sequence] INT NOT NULL CONSTRAINT PK_schema_changes PRIMARY KEY,
        change_id NVARCHAR(255) NOT NULL CONSTRAINT UQ_schema_changes_change_id UNIQUE,
        checksum CHAR(64) NOT NULL,
        git_sha NVARCHAR(64) NOT NULL,
        release_version NVARCHAR(128) NOT NULL,
        applied_at DATETIME2(3) NOT NULL CONSTRAINT DF_schema_changes_applied_at DEFAULT SYSUTCDATETIME()
    );
END;

INSERT INTO dbo.schema_changes ([sequence], change_id, checksum, git_sha, release_version)
VALUES (
    $(change_sequence),
    N'$(change_id)',
    '$(change_checksum)',
    N'$(git_sha)',
    N'$(release_version)'
);
