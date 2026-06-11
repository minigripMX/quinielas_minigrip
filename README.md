# Quiniela Mundial 2026

Aplicación web para una quiniela corporativa del Mundial 2026. Migra la lógica de un HTML con `localStorage` a React + Vite, Supabase Auth, base de datos real, RLS y realtime.

## Stack

- React + Vite
- Tailwind CSS
- Supabase Auth, Postgres, RLS y Realtime
- Deploy: GitHub Pages

## Módulos

- Login privado con usuario y contraseña.
- Roles `admin` y `user`.
- Tabla de posiciones por aciertos y precisión.
- Mi quiniela con picks `1`, `X`, `2`.
- Bloqueo automático de votos cuando el admin captura resultado.
- Partidos agrupados por grupo con marcador o conteo de votos.
- Panel admin para resultados.
- Panel admin para alta/listado/eliminación de usuarios.

## Setup local

1. Instala dependencias:

```bash
npm install
```

2. Copia variables de entorno:

```bash
cp .env.example .env.local
```

3. Agrega tus llaves de Supabase:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

4. En Supabase SQL Editor ejecuta:

```sql
-- supabase/schema.sql
```

5. Activa Realtime para las tablas `picks`, `results` y `profiles` desde Supabase Database > Replication.

6. Crea el primer admin desde Supabase Auth y SQL Editor:

```sql
insert into public.profiles (id, name, username, role)
values ('AUTH_USER_ID', 'Administrador', 'admin', 'admin');
```

La app usa el email interno `username@quiniela.local` para iniciar sesión con un campo simple de usuario.

7. Corre la app:

```bash
npm run dev
```

## Alta de usuarios desde la app

El panel de usuarios invoca la Edge Function `admin-create-user`, incluida en:

```text
supabase/functions/admin-create-user/index.ts
```

Deploy con Supabase CLI:

```bash
supabase functions deploy admin-create-user
```

La función usa `SUPABASE_SERVICE_ROLE_KEY` solo del lado servidor. No pongas esa llave en el frontend. También elimina usuarios de Supabase Auth, lo que borra su perfil y picks por cascada.

Si no despliegas la función, puedes crear usuarios manualmente desde Supabase Auth y luego insertar su perfil en `profiles`.

## Deploy en GitHub Pages

La app está configurada para publicarse bajo:

```text
https://<usuario>.github.io/quinielas_minigrip/
```

`vite.config.js` usa:

```js
base: '/quinielas_minigrip/'
```

Para publicar:

```bash
npm run deploy
```

Este comando ejecuta `npm run build` y publica `dist` con `gh-pages`. El archivo `public/404.html` redirige al `index.html` para que las rutas funcionen al refrescar en GitHub Pages.

## Notas de seguridad

- No hay registro público.
- RLS permite a usuarios autenticados leer ranking, partidos, picks y resultados.
- Cada usuario solo puede crear/editar sus propios picks.
- Un trigger bloquea picks si el partido ya tiene resultado.
- Solo admins gestionan resultados y usuarios.

## Mundial completo

`supabase/schema.sql` crea la estructura base. Para habilitar varias quinielas al mismo tiempo, ejecuta después:

```text
supabase/multi-pools.sql
```

Luego, si quieres cargar el Mundial completo en la quiniela activa, ejecuta:

```text
supabase/full-world-cup-2026.sql
```

Ese script reemplaza los partidos de la quiniela activa por 104 partidos: 72 de fase de grupos con nombres de selecciones, 16 de ronda de 32, 8 de octavos, 4 de cuartos, 2 semifinales, tercer lugar y final. Conserva usuarios/perfiles y otras quinielas.

## Multiples quinielas

El admin puede crear quinielas desde la pestaña `Quinielas`, seleccionar la quiniela activa y opcionalmente copiar el calendario de la quiniela actual. Cada quiniela tiene sus propios partidos, resultados, picks y tabla.
