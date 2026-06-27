USE SmartBudgetDb;
GO

IF COL_LENGTH('dbo.profiles', 'high_expense_warning_percent') IS NULL
BEGIN
    ALTER TABLE dbo.profiles
    ADD high_expense_warning_percent SMALLINT NOT NULL
        CONSTRAINT DF_profiles_high_expense_warning_percent DEFAULT 50;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_profiles_high_expense_warning_percent'
)
BEGIN
    ALTER TABLE dbo.profiles
    ADD CONSTRAINT CK_profiles_high_expense_warning_percent
    CHECK (high_expense_warning_percent IN (30, 50, 70));
END;
GO