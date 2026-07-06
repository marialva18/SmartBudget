# Qori

Qori es una aplicación web full-stack para la gestión de finanzas personales. Permite organizar cuentas, registrar ingresos y gastos, transferir dinero entre cuentas propias, crear presupuestos mensuales, definir metas de ahorro, revisar movimientos en un calendario, analizar reportes financieros y coordinar gastos compartidos desde una interfaz sencilla, responsive y profesional.

El sistema está pensado para ayudar a una persona a entender mejor su dinero sin depender de integraciones bancarias iniciales. Cada usuario registra su información financiera de forma manual, separada y segura, mientras Qori calcula saldos, disponibles, presupuestos, metas y reportes.

## Tabla de contenido

- [Descripción general](#descripción-general)
- [Objetivo del proyecto](#objetivo-del-proyecto)
- [Características principales](#características-principales)
- [Módulos del sistema](#módulos-del-sistema)
- [Arquitectura general](#arquitectura-general)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Estado actual del proyecto](#estado-actual-del-proyecto)
- [Próximas mejoras](#próximas-mejoras)
- [Capturas del sistema](#capturas-del-sistema)
- [Autor](#autor)
- [Uso y derechos](#uso-y-derechos)

## Descripción general

Qori centraliza la administración financiera personal en una sola plataforma. El usuario puede crear cuentas, registrar movimientos, clasificar gastos, planificar presupuestos, reservar dinero para metas, revisar reportes y controlar gastos compartidos con otras personas.

La aplicación diferencia conceptos importantes como:

- Saldo real.
- Dinero reservado.
- Disponible por cuenta.
- Ingresos.
- Gastos.
- Transferencias entre cuentas propias.
- Presupuesto mensual.
- Metas de ahorro.
- Gastos compartidos.

Esta separación permite que los reportes sean más claros y que el usuario no confunda movimientos internos, como pasar dinero de Yape a efectivo, con ingresos reales.

## Objetivo del proyecto

El objetivo de Qori es ofrecer una herramienta clara para organizar el dinero personal y demostrar el desarrollo de una aplicación web moderna completa, integrando frontend, backend, base de datos, autenticación, seguridad, lógica financiera, reportes, experiencia responsive y despliegue en la nube.

Qori busca responder preguntas cotidianas como:

- ¿Cuánto dinero tengo realmente?
- ¿Cuánto tengo disponible después de separar dinero para metas?
- ¿En qué categorías estoy gastando más?
- ¿Estoy respetando mi presupuesto mensual?
- ¿Cómo cambiaron mis gastos frente al periodo anterior?
- ¿Qué movimientos tengo programados?
- ¿Quién pagó en un gasto compartido y cuánto debe cada persona?

## Características principales

- Registro de usuarios.
- Verificación de correo electrónico.
- Inicio de sesión seguro.
- Recuperación de contraseña.
- Perfil con preferencias financieras.
- Selección de moneda preferida.
- Configuración de zona horaria.
- Tema claro, oscuro o sistema.
- Onboarding inicial para configurar la experiencia.
- Gestión de cuentas financieras.
- Saldo inicial con fecha de inicio de control.
- Registro de ingresos y gastos.
- Transferencias entre cuentas propias.
- Categorías de ingresos y gastos.
- Presupuestos mensuales.
- Metas de ahorro.
- Reservas de dinero para metas.
- Dashboard financiero.
- Calendario financiero.
- Recurrencias para pagos o ingresos frecuentes.
- Grupos para gastos compartidos.
- Liquidaciones entre miembros de grupo.
- Análisis financiero con gráficos.
- Comparación entre periodos.
- Exportación de reportes en Excel y PDF.
- Notificaciones internas.
- Ayudas discretas dentro de la interfaz.
- Diseño responsive.
- Navegación consolidada por módulos.

## Módulos del sistema

### Autenticación

Permite crear una cuenta, iniciar sesión, verificar el correo electrónico, recuperar la contraseña y proteger las pantallas privadas de la aplicación.

### Onboarding

Guía al usuario en la configuración inicial de Qori. Permite definir preferencias, objetivos financieros y crear la primera cuenta para empezar a registrar movimientos.

### Dashboard

Muestra un resumen general del estado financiero del usuario. Incluye saldos por moneda, ingresos, gastos, balance mensual, avance de presupuestos, metas activas y últimos movimientos.

### Cuentas

Permite administrar cuentas de efectivo, bancos o billeteras digitales. Cada cuenta tiene moneda propia, saldo inicial, saldo real, dinero reservado y disponible.

Las cuentas pueden archivarse sin perder el historial financiero.

### Movimientos

Permite registrar ingresos y gastos, filtrarlos, buscarlos y editarlos. Los movimientos se asocian a una cuenta y, cuando corresponde, a una categoría.

También incluye una pestaña interna para gestionar categorías, de modo que la navegación principal se mantenga más limpia.

### Transferencias propias

Permite mover dinero entre cuentas del mismo usuario, por ejemplo de Yape a efectivo.

Una transferencia propia:

- Resta dinero de la cuenta origen.
- Suma dinero a la cuenta destino.
- No cuenta como ingreso.
- No cuenta como gasto.
- No altera los reportes de consumo.
- Sí afecta los saldos reales de cada cuenta.

Esta lógica evita que el usuario infle artificialmente sus ingresos o gastos cuando solo está moviendo dinero entre sus propias cuentas.

### Categorías

Permite clasificar ingresos y gastos. Existen categorías del sistema y categorías personales creadas por el usuario.

Las categorías ayudan a que los reportes, presupuestos y análisis sean más útiles.

### Planificación

Agrupa los módulos de Presupuestos y Metas para que la experiencia sea más ordenada.

#### Presupuestos

Permite definir límites mensuales de gasto, ya sea de forma general o por categoría. Qori compara lo planificado con lo gastado para mostrar cuánto se ha usado y cuánto queda disponible dentro del presupuesto.

#### Metas

Permite crear objetivos de ahorro y reservar dinero desde cuentas compatibles. Reservar dinero no realiza una transferencia bancaria real; solo separa parte del disponible dentro de Qori para medir el avance de la meta.

### Agenda

Agrupa Calendario y Recurrencias.

#### Calendario

Permite visualizar los movimientos por día. Muestra ingresos, gastos, transferencias y balance diario respetando la zona horaria configurada por el usuario.

#### Recurrencias

Permite programar ingresos o gastos frecuentes. Qori los muestra como pendientes para que el usuario pueda confirmarlos antes de que afecten su saldo.

### Grupos

Permite organizar gastos compartidos. Un usuario puede crear grupos, invitar participantes, registrar quién pagó un gasto, dividirlo entre miembros y revisar cuánto debe o debe recibir cada persona.

También permite registrar liquidaciones para reflejar pagos entre participantes.

### Análisis financiero

Permite revisar reportes visuales con filtros por periodo, cuenta, categoría, grupo, moneda, tipo de movimiento e impacto en saldo.

Incluye:

- Resumen de ingresos y gastos.
- Balance del periodo.
- Gasto promedio diario.
- Gastos por categoría.
- Distribución por cuenta.
- Evolución en el tiempo.
- Gastos más altos.
- Comparación con periodos anteriores.
- Exportación en Excel.
- Exportación en PDF.

### Coach financiero

Qori incluye un coach financiero opcional con IA. Su objetivo es ayudar al usuario a interpretar su información financiera, recibir orientación general y consultar dudas sobre sus hábitos de gasto.

### Notificaciones

La aplicación muestra avisos internos para elementos accionables, como invitaciones pendientes a grupos o recurrencias por confirmar.

## Arquitectura general

Qori está dividido en tres partes principales:

```text
Usuario
   |
   v
Frontend web
   |
   v
Backend API
   |
   v
Base de datos SQL Server
```

El frontend se encarga de la experiencia visual, navegación, formularios y gráficos. El backend concentra autenticación, validaciones, reglas financieras, autorización, auditoría y comunicación con la base de datos. La base de datos conserva la información del usuario, movimientos, cuentas, grupos, metas, presupuestos y configuraciones.

## Tecnologías utilizadas

### Frontend

- React.
- TypeScript.
- Vite.
- React Router DOM.
- TanStack Query.
- React Hook Form.
- Zod.
- Recharts.
- Tailwind CSS.
- Lucide React.

### Backend

- Node.js.
- NestJS.
- TypeScript.
- Prisma ORM.
- JWT.
- Cookies HttpOnly.
- Argon2.
- Validación con DTOs.
- Rate limiting.
- Envío de correos transaccionales.
- Generación de reportes Excel y PDF.

### Base de datos y despliegue

- SQL Server.
- Azure SQL Database.
- Vercel para frontend.
- Render para backend.
- SMTP/Gmail para correos.
- Gemini API opcional para el coach financiero.

## Seguridad y privacidad

Qori incorpora medidas de seguridad enfocadas en proteger la información financiera del usuario:

- Contraseñas cifradas con Argon2.
- Tokens de acceso de corta duración.
- Refresh token en cookie HttpOnly.
- Verificación de correo electrónico.
- Recuperación de contraseña mediante token temporal.
- Validaciones en frontend y backend.
- Autorización por usuario propietario.
- Rate limiting en endpoints sensibles.
- Auditoría de operaciones importantes.
- Separación de secretos entre frontend y backend.
- Eliminación lógica en movimientos y recursos relevantes.

## Estado actual del proyecto

Qori se encuentra en estado de MVP avanzado funcional. La aplicación ya cubre los flujos principales de una plataforma de finanzas personales:

- Autenticación.
- Onboarding.
- Cuentas.
- Movimientos.
- Transferencias propias.
- Categorías.
- Presupuestos.
- Metas.
- Calendario.
- Recurrencias.
- Grupos.
- Liquidaciones.
- Dashboard.
- Análisis financiero.
- Exportación de reportes.
- Tema claro/oscuro/sistema.
- Notificaciones internas.

## Próximas mejoras

Algunas mejoras futuras consideradas:

- Filtro específico para transferencias.
- Transferencias entre monedas con tipo de cambio.
- Alertas de saldo bajo.
- Alertas de gasto inusual.
- Adjuntos o comprobantes.
- Pruebas end-to-end.
- Mayor accesibilidad automatizada.
- Aplicación móvil usando la misma API.
- Integraciones externas opcionales.

## Capturas del sistema

Espacio sugerido para capturas:

- Pantalla de bienvenida.
- Registro e inicio de sesión.
- Onboarding.
- Dashboard.
- Cuentas.
- Movimientos y transferencias.
- Categorías.
- Planificación.
- Agenda.
- Grupos.
- Análisis financiero.
- Configuración.

## Autor

Proyecto desarrollado por María Alva Ruiz como aplicación full-stack de finanzas personales.

## Uso y derechos

Este proyecto fue desarrollado con fines académicos, demostrativos y de aprendizaje. El uso, modificación o distribución debe respetar la autoría del proyecto y las condiciones definidas por la propietaria del repositorio.
