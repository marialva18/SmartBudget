USE SmartBudgetDb;
GO

IF COL_LENGTH('dbo.users', 'terms_accepted_at') IS NULL
BEGIN
    ALTER TABLE dbo.users
    ADD terms_accepted_at DATETIME2(3) NULL;
END;
GO

IF COL_LENGTH('dbo.users', 'privacy_accepted_at') IS NULL
BEGIN
    ALTER TABLE dbo.users
    ADD privacy_accepted_at DATETIME2(3) NULL;
END;
GO

IF COL_LENGTH('dbo.users', 'terms_version') IS NULL
BEGIN
    ALTER TABLE dbo.users
    ADD terms_version NVARCHAR(30) NULL;
END;
GO

IF COL_LENGTH('dbo.users', 'privacy_version') IS NULL
BEGIN
    ALTER TABLE dbo.users
    ADD privacy_version NVARCHAR(30) NULL;
END;
GO

SELECT
    COL_LENGTH('dbo.users', 'terms_accepted_at') AS terms_accepted_at_column_exists,
    COL_LENGTH('dbo.users', 'privacy_accepted_at') AS privacy_accepted_at_column_exists,
    COL_LENGTH('dbo.users', 'terms_version') AS terms_version_column_exists,
    COL_LENGTH('dbo.users', 'privacy_version') AS privacy_version_column_exists;
GO
