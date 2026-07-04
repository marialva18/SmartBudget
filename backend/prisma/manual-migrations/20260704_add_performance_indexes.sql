IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_transactions_balance_account'
    AND object_id = OBJECT_ID('dbo.transactions')
)
BEGIN
  CREATE INDEX IX_transactions_balance_account
    ON dbo.transactions (user_id, balance_impact_status, account_id, type);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_transactions_user_currency_type_date'
    AND object_id = OBJECT_ID('dbo.transactions')
)
BEGIN
  CREATE INDEX IX_transactions_user_currency_type_date
    ON dbo.transactions (user_id, currency, type, occurred_at DESC);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_goal_reservations_user_status_account'
    AND object_id = OBJECT_ID('dbo.goal_reservations')
)
BEGIN
  CREATE INDEX IX_goal_reservations_user_status_account
    ON dbo.goal_reservations (user_id, status, account_id);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_group_members_group_status'
    AND object_id = OBJECT_ID('dbo.group_members')
)
BEGIN
  CREATE INDEX IX_group_members_group_status
    ON dbo.group_members (group_id, status);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_coach_messages_conversation_deleted'
    AND object_id = OBJECT_ID('dbo.coach_messages')
)
BEGIN
  CREATE INDEX IX_coach_messages_conversation_deleted
    ON dbo.coach_messages (conversation_id, deleted_at);
END;
