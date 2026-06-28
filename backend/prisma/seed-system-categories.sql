SET NOCOUNT ON;

DECLARE @SystemCategories TABLE (
  [name] NVARCHAR(100) NOT NULL,
  [old_name] NVARCHAR(100) NULL,
  [type] NVARCHAR(20) NOT NULL,
  [icon] NVARCHAR(50) NULL
);

INSERT INTO @SystemCategories ([name], [old_name], [type], [icon])
VALUES
  (N'Sin categoría', N'Sin categoria', N'EXPENSE', N'circle-help'),
  (N'Alimentación', N'Alimentacion', N'EXPENSE', N'utensils'),
  (N'Transporte', NULL, N'EXPENSE', N'bus'),
  (N'Vivienda', NULL, N'EXPENSE', N'house'),
  (N'Salud', NULL, N'EXPENSE', N'heart-pulse'),
  (N'Educación', N'Educacion', N'EXPENSE', N'graduation-cap'),
  (N'Entretenimiento', NULL, N'EXPENSE', N'popcorn'),
  (N'Servicios', NULL, N'EXPENSE', N'receipt'),
  (N'Compras', NULL, N'EXPENSE', N'shopping-bag'),
  (N'Otros gastos', NULL, N'EXPENSE', N'circle'),

  (N'Sin categoría', N'Sin categoria', N'INCOME', N'circle-help'),
  (N'Sueldo', NULL, N'INCOME', N'briefcase'),
  (N'Freelance', NULL, N'INCOME', N'laptop'),
  (N'Ventas', NULL, N'INCOME', N'store'),
  (N'Regalos', NULL, N'INCOME', N'gift'),
  (N'Inversiones', NULL, N'INCOME', N'trending-up'),
  (N'Otros ingresos', NULL, N'INCOME', N'circle');

UPDATE c
SET
  c.[name] = s.[name],
  c.[icon] = s.[icon],
  c.[status] = N'ACTIVE',
  c.[archived_at] = NULL,
  c.[updated_at] = SYSUTCDATETIME()
FROM dbo.categories AS c
INNER JOIN @SystemCategories AS s
  ON c.[user_id] IS NULL
  AND c.[is_system] = 1
  AND c.[type] = s.[type]
  AND (
    c.[name] = s.[name]
    OR c.[name] = s.[old_name]
  );

INSERT INTO dbo.categories ([user_id], [name], [type], [icon], [is_system], [status])
SELECT
  NULL,
  s.[name],
  s.[type],
  s.[icon],
  1,
  N'ACTIVE'
FROM @SystemCategories AS s
WHERE NOT EXISTS (
  SELECT 1
  FROM dbo.categories AS c
  WHERE c.[user_id] IS NULL
    AND c.[is_system] = 1
    AND c.[type] = s.[type]
    AND (
      c.[name] = s.[name]
      OR c.[name] = s.[old_name]
    )
);
