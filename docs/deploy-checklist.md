# Qori Deploy Checklist

## Azure SQL

- Crear la base productiva y ejecutar los scripts en orden desde `database/scripts`.
- Para una base existente, ejecutar las migraciones incrementales pendientes, incluida `011_add_user_consent_fields.sql`.
- Configurar un usuario tecnico para el backend y asignarlo al rol minimo necesario.
- Guardar la cadena real solo como variable `DATABASE_URL` del backend.

## Render Backend

- Configurar `NODE_ENV=production`, `TRUST_PROXY=true` y `FRONTEND_ORIGIN` con el dominio real de Vercel.
- Configurar `DATABASE_URL`, `JWT_ACCESS_SECRET`, `EMAIL_PROVIDER`, SMTP, URLs de verificacion y recuperacion, y Gemini si el coach esta habilitado.
- No usar `localhost`, `change_me` ni `replace_...` en variables de produccion.
- Configurar `THROTTLE_TTL_MS=60000` y `THROTTLE_LIMIT=100` como limite global inicial; las escrituras financieras quedan ademas limitadas a 30/min por IP y coach a 10/min por IP.
- No crear variables `VITE_` para secretos.
- Usar `npm --prefix backend run build` como verificacion de build.

## Vercel Frontend

- Configurar solo `VITE_API_BASE_URL` apuntando a la API publica de Render, por ejemplo `https://api.example.com/api/v1`.
- No configurar claves SMTP, Gemini, JWT ni SQL en Vercel.
- Usar `npm --prefix frontend run build` como verificacion de build.

## Cookies Cross-Site

- En produccion, la cookie refresh usa `secure=true` y `sameSite='none'` para funcionar entre Vercel y Render.
- Confirmar que CORS permita exactamente el dominio de Vercel y acepte credenciales.

## Smoke Test

- Registrar un usuario nuevo aceptando terminos y privacidad.
- Verificar que `users.terms_accepted_at`, `privacy_accepted_at`, `terms_version` y `privacy_version` queden poblados.
- Verificar correo, iniciar sesion, cerrar sesion, recuperar contrasena y volver a iniciar sesion.
