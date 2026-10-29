SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.schema_changes', N'applied_timezone') IS NULL
    ALTER TABLE dbo.schema_changes ADD applied_timezone NVARCHAR(64) NULL;

EXEC sys.sp_executesql
        N'UPDATE dbo.schema_changes
            SET applied_timezone = @time_zone
            WHERE applied_timezone IS NULL',
        N'@time_zone NVARCHAR(64)',
        @time_zone = N'$(operating_timezone)';

EXEC sys.sp_executesql
        N'ALTER TABLE dbo.schema_changes
            ALTER COLUMN applied_timezone NVARCHAR(64) NOT NULL';