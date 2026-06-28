# Qori

Qori es una plataforma de finanzas personales orientada a web y preparada
para una futura aplicacion movil. El sistema centraliza cuentas, movimientos,
presupuestos, metas de ahorro y gastos compartidos, manteniendo una unica API y
una unica base de datos para todos los clientes.

## Proposito

El objetivo del proyecto es ayudar a una persona a entender y organizar su
dinero sin depender de integraciones bancarias iniciales. La informacion se
registra manualmente y los saldos se calculan desde movimientos confirmados.

Qori separa claramente:

- Saldo real.
- Dinero reservado para metas.
- Disponible por cuenta.
- Presupuesto mensual.
- Gastos personales.
- Gastos compartidos.

Las monedas se administran por separado. El sistema no convierte automaticamente
entre PEN y USD.

## Stack Tecnologico

- Frontend: React, TypeScript, Vite, TanStack Query, React Hook Form, Zod y Tailwind CSS.
- Backend: NestJS, TypeScript, Prisma, JWT, cookies HttpOnly, Argon2 y rate limiting.
- Base de datos: SQL Server.
- Persistencia: scripts SQL versionados y ejecutables desde SSMS.
- Email transaccional: Resend o SMTP, configurable solo desde backend.
- Arquitectura prevista: web primero, app movil despues consumiendo la misma API.

## Arquitectura

```text
Qori/
+-- frontend/   # Interfaz web
+-- backend/    # API REST, validaciones y reglas de negocio
+-- database/   # Modelo SQL Server, indices, seeds y scripts
`-- README.md
```

El frontend se enfoca en experiencia de usuario, formularios y visualizacion.
El backend concentra autenticacion, autorizacion, validaciones, reglas
financieras y comunicacion con la base de datos. SQL Server conserva la
persistencia, integridad relacional, indices y auditoria.

## Dominio Del Negocio

Qori modela la vida financiera de un usuario desde estas reglas:

- Cada usuario administra su propia informacion financiera.
- Una persona puede manejar cuentas en una o varias monedas.
- Los saldos se calculan desde movimientos confirmados.
- El saldo inicial de una cuenta se registra como movimiento de apertura.
- Las categorias permiten clasificar ingresos y gastos.
- Los presupuestos se definen por mes y moneda.
- Las metas reservan dinero sin modificar el saldo real.
- Las reservas reducen el disponible de una cuenta.
- Los grupos permiten coordinar gastos compartidos sin compartir cuentas personales.
- Las invitaciones a grupos son accionables dentro de la aplicacion y pueden notificarse por correo cuando el proveedor transaccional esta configurado.
- Los gastos grupales calculan balances por miembro y por moneda.
- Las operaciones relevantes conservan auditoria.

## Funcionalidades

### Autenticacion y Seguridad

- Registro e inicio de sesion.
- Access token de corta duracion.
- Refresh token en cookie HttpOnly.
- Sesiones revocables.
- Recuperacion de contrasena por correo transaccional.
- Hash de contrasenas con Argon2.
- Rate limiting en endpoints sensibles.

### Perfil y Onboarding

- Configuracion inicial de preferencias.
- Seleccion de moneda preferida.
- Objetivos financieros iniciales.
- Primera cuenta financiera.
- Edicion de perfil y preferencias.

### Cuentas

- Cuentas de efectivo, banco o billetera digital.
- Moneda por cuenta.
- Saldo real, reservado y disponible.
- Archivado de cuentas sin eliminar historial.

### Movimientos

- Registro de ingresos y gastos.
- Busqueda y filtros.
- Edicion de movimientos confirmados.
- Eliminacion logica con auditoria.
- Proteccion del movimiento de saldo inicial.

### Categorias

- Categorias del sistema.
- Categorias personales.
- Separacion por ingreso y gasto.
- Archivado de categorias personales.

### Presupuestos

- Presupuesto mensual general.
- Presupuesto mensual por categoria.
- Comparacion entre gasto usado y monto planificado.
- Separacion por moneda.

### Metas

- Metas por moneda.
- Fecha objetivo opcional.
- Reservas desde una o varias cuentas compatibles.
- Progreso calculado desde reservas.
- Cancelacion, completado y borrado logico.

### Dashboard

- Resumen financiero por moneda.
- Saldo real, reservado y disponible.
- Ingresos, gastos y balance mensual.
- Avance de presupuestos.
- Metas activas.
- Ultimos movimientos.

### Grupos y Gastos Compartidos

- Creacion de grupos.
- Invitacion de usuarios registrados.
- Aceptacion o rechazo de invitaciones.
- Campana de notificaciones.
- Registro de gastos grupales.
- Division igual entre participantes activos.
- Balance por miembro y moneda.
- Archivado de grupos.

## Casos De Uso Principales

1. Registrar una cuenta de efectivo, banco o billetera digital.
2. Registrar ingresos y gastos diarios.
3. Consultar saldos por cuenta y moneda.
4. Crear presupuestos mensuales.
5. Reservar dinero para metas.
6. Revisar el progreso de metas de ahorro.
7. Crear grupos para gastos compartidos.
8. Invitar participantes a un grupo.
9. Registrar un gasto grupal indicando quien pago.
10. Consultar cuanto debe o debe recibir cada miembro del grupo.
11. Recuperar acceso a la cuenta mediante correo.

## Principios De Ingenieria

- Separacion entre frontend, backend y base de datos.
- Validacion de entradas en frontend y backend.
- Reglas financieras centralizadas en backend.
- Autorizacion por usuario en recursos financieros.
- Uso de Prisma para acceso a datos.
- Auditoria en operaciones relevantes.
- Textos visibles centralizados en espanol.
- Preparacion para cliente movil usando la misma API.

## Alcance Actual Del MVP

El MVP web cubre el flujo financiero principal: autenticacion, onboarding,
cuentas, movimientos, categorias, presupuestos, metas, dashboard, grupos,
invitaciones, notificaciones y gastos compartidos basicos.

El siguiente crecimiento natural del producto incluye liquidaciones de deudas en
grupos, coach financiero con IA, adjuntos/comprobantes, integracion con canales
externos y aplicacion movil.
