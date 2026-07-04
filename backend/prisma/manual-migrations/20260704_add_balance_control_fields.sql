IF COL_LENGTH('dbo.accounts', 'opening_balance') IS NULL
BEGIN
  ALTER TABLE dbo.accounts
    ADD opening_balance DECIMAL(19, 4) NOT NULL
      CONSTRAINT DF_accounts_opening_balance DEFAULT (0);
END;

IF COL_LENGTH('dbo.accounts', 'balance_started_at') IS NULL
BEGIN
  ALTER TABLE dbo.accounts
    ADD balance_started_at DATETIME2 NOT NULL
      CONSTRAINT DF_accounts_balance_started_at DEFAULT (SYSUTCDATETIME());

  EXEC sys.sp_executesql N'
    UPDATE dbo.accounts
    SET balance_started_at = created_at;
  ';
END;

IF COL_LENGTH('dbo.transactions', 'balance_impact_status') IS NULL
BEGIN
  ALTER TABLE dbo.transactions
    ADD balance_impact_status NVARCHAR(30) NOT NULL
      CONSTRAINT DF_transactions_balance_impact_status DEFAULT ('AFFECTS_BALANCE');
END;

EXEC sys.sp_executesql N'
  UPDATE account_rows
  SET opening_balance = opening_rows.amount
  FROM dbo.accounts AS account_rows
  OUTER APPLY (
    SELECT TOP (1) amount
    FROM dbo.transactions AS transaction_rows
    WHERE transaction_rows.account_id = account_rows.id
      AND transaction_rows.type = ''OPENING_BALANCE''
      AND transaction_rows.deleted_at IS NULL
    ORDER BY transaction_rows.created_at ASC
  ) AS opening_rows
  WHERE opening_rows.amount IS NOT NULL;
';
