# Qori Data Model

## Principios

- El saldo real se calcula desde movimientos confirmados que afectan saldo.
- El saldo inicial se guarda en la cuenta y se refleja como un movimiento
  `OPENING_BALANCE` para conservar historial.
- Cada cuenta define `balance_started_at`, la fecha desde la que Qori controla
  el saldo real.
- Los movimientos anteriores a `balance_started_at` quedan para analisis y no
  modifican el saldo real.
- Los movimientos futuros quedan pendientes y no modifican el saldo real hasta
  que se confirmen como movimientos que afectan saldo.
- La clasificacion de impacto de saldo se compara por dia local usando la zona
  horaria del perfil del usuario. Esto evita que un movimiento del mismo dia
  local se clasifique mal por diferencias UTC.
- Ajustar saldo crea un movimiento auditado con `source = BALANCE_ADJUSTMENT`;
  no sobrescribe movimientos historicos.
- Las monedas se consultan y muestran por separado.
- El dinero reservado para metas reduce el disponible, no el saldo real.
- Las recurrencias generan ocurrencias pendientes.
- Las cuentas, categorias y movimientos financieros conservan historial.
- Los archivos viven en Azure Blob Storage; SQL guarda metadatos y relaciones.

## Identidad

- `users`: identidad, estado, hash de contrasena y aceptacion de terminos y
  privacidad.
- `profiles`: preferencias, zona horaria y consentimiento de IA.
- `user_onboarding_objectives`: objetivos seleccionados durante la configuracion
  inicial.
- `user_sessions`: dispositivos y sesiones revocables.
- `refresh_tokens`: hashes de refresh tokens.
- `password_reset_tokens`: recuperacion de contrasena.
- `email_verification_tokens`: verificacion de correo.

## Finanzas personales

- `accounts`: efectivo, banco o billetera digital por moneda. Incluye
  `opening_balance` y `balance_started_at`.
- `account_channel_defaults`: cuenta habitual por moneda y canal.
- `categories`: categorias del sistema o del usuario.
- `transactions`: apertura, ingreso o gasto confirmado. Incluye
  `balance_impact_status` con valores `AFFECTS_BALANCE`, `ANALYSIS_ONLY` o
  `PENDING_FUTURE`.
- `budgets`: presupuesto general o por categoria para un mes.

Los presupuestos no reservan dinero ni cambian saldos. El gasto utilizado se
calcula desde movimientos confirmados de tipo `EXPENSE` del mismo mes, moneda y
categoria cuando corresponda.

Formula conceptual:

```text
real balance = opening balances + income - expenses
where transaction.balance_impact_status = AFFECTS_BALANCE
available balance = real balance - active goal reservations
```

## Metas

- `goals`: objetivo, moneda y estado.
- `goal_reservations`: monto reservado desde una cuenta concreta.

El progreso se calcula sumando reservas activas o insuficientes. Una reserva
revertida deja de aportar al progreso.

## Recurrencias

- `recurring_schedules`: regla y proxima fecha.
- `recurring_occurrences`: instancia pendiente, confirmada, omitida o cancelada.

Confirmar una ocurrencia crea exactamente un movimiento o una reserva de meta.
La operacion debe ejecutarse en una transaccion de Prisma.

## Grupos

- `financial_groups`: espacio compartido.
- `group_members`: participantes y roles.
- `group_expenses`: gasto pagado por un miembro.
- `group_expense_splits`: parte correspondiente a cada miembro.
- `group_settlements`: liquidaciones entre miembros.

Cada gasto grupal guarda splits finales por miembro, calculados por partes
iguales, montos personalizados o porcentajes. Las cuentas personales no se
comparten. Al crear un gasto de grupo, el usuario que paga elige una cuenta
personal propia de la misma moneda; Qori crea un movimiento `GROUP_EXPENSE` y lo
vincula mediante `personal_transaction_id`. Las liquidaciones reducen el neto
pendiente entre miembros del grupo y tambien se vinculan a un movimiento
`GROUP_SETTLEMENT` del usuario que registra el pago: gasto si paga, ingreso si
recibe.

## IA y canales

- `coach_conversations` y `coach_messages`: historial del coach.
- `external_channel_links`: vinculo con WhatsApp u otro canal.
- `transaction_drafts`: interpretacion estructurada y nivel de confianza.
- `voice_transcriptions`: resultado de Whisper u otro transcriptor.

El agente no accede directamente a Prisma. NestJS controla sus herramientas.

## Archivos

- `file_objects`: metadatos y clave de Azure Blob Storage.
- `transaction_attachments`: comprobantes asociados a movimientos.

No se guardan archivos binarios ni rutas locales en SQL Server.

## Auditoria

- `audit_logs`: accion, entidad, canal, request ID y valores anteriores/nuevos.

La auditoria se escribe desde el servicio de negocio dentro de la misma
transaccion que modifica el recurso cuando sea posible.

## Reglas que deben probarse en backend

1. El usuario es propietario de cada recurso consultado o modificado.
2. Cuenta, movimiento y reserva usan monedas compatibles.
3. La categoria coincide con ingreso o gasto.
4. Una cuenta o categoria archivada no recibe operaciones nuevas.
5. Una clave de idempotencia no crea dos movimientos.
6. Una reserva no supera el disponible en el momento de crearla.
7. Las divisiones de un gasto grupal suman el monto total.
8. Una ocurrencia recurrente solo se confirma una vez.
9. Las eliminaciones financieras son logicas y auditadas.

## Indices de rendimiento

- `IX_transactions_balance_account`: calculo de saldo real por cuenta usando
  solo movimientos que afectan saldo.
- `IX_transactions_user_currency_type_date`: reportes, presupuestos y resumen
  mensual por usuario, moneda, tipo y fecha.
- `IX_goal_reservations_user_status_account`: disponible por cuenta y reservas
  activas o insuficientes.
- `IX_group_members_group_status`: carga de miembros activos de un grupo.
- `IX_coach_messages_conversation_deleted`: borrado logico de mensajes durante
  cierre de cuenta.
