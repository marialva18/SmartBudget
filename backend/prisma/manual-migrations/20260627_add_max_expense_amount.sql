USE SmartBudgetDb;
GO

IF COL_LENGTH('dbo.profiles', 'max_expense_amount_pen') IS NULL
BEGIN
    ALTER TABLE dbo.profiles
    ADD max_expense_amount_pen DECIMAL(19, 4) NULL;
END;
GO

IF COL_LENGTH('dbo.profiles', 'max_expense_amount_usd') IS NULL
BEGIN
    ALTER TABLE dbo.profiles
    ADD max_expense_amount_usd DECIMAL(19, 4) NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_profiles_max_expense_amount_pen'
)
BEGIN
    ALTER TABLE dbo.profiles
    ADD CONSTRAINT CK_profiles_max_expense_amount_pen
    CHECK (max_expense_amount_pen IS NULL OR max_expense_amount_pen > 0);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_profiles_max_expense_amount_usd'
)
BEGIN
    ALTER TABLE dbo.profiles
    ADD CONSTRAINT CK_profiles_max_expense_amount_usd
    CHECK (max_expense_amount_usd IS NULL OR max_expense_amount_usd > 0);
END;
GO