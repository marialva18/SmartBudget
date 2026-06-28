# Qori Data Model

## Principios

- El saldo no se guarda: se calcula desde movimientos confirmados.
- El saldo inicial es un movimiento `OPENING_BALANCE`.
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

- `accounts`: efectivo, banco o billetera digital por moneda.
- `account_channel_defaults`: cuenta habitual por moneda y canal.
- `categories`: categorias del sistema o del usuario.
- `transactions`: apertura, ingreso o gasto confirmado.
- `budgets`: presupuesto general o por categoria para un mes.

Los presupuestos no reservan dinero ni cambian saldos. El gasto utilizado se
calcula desde movimientos confirmados de tipo `EXPENSE` del mismo mes, moneda y
categoria cuando corresponda.

Formula conceptual:

```text
real balance = opening balances + income - expenses
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

Las cuentas personales no se comparten. Un gasto puede vincularse al movimiento
personal de quien pago para evitar duplicarlo.

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
