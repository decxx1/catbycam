# Astro Starter Kit: Minimal

```sh
bun create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Installs dependencies                            |
| `bun dev`             | Starts local dev server at `localhost:4321`      |
| `bun build`           | Build your production site to `./dist/`          |
| `bun preview`         | Preview your build locally, before deploying     |
| `bun astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## 🗄️ Database Setup

### Quick Setup (todo en uno)
```bash
bun run db:fresh
```

### Manual Setup (paso a paso)
```bash
# 1. Resetear la base de datos (elimina TODAS las tablas)
bun run db:reset

# 2. Ejecutar migraciones de better-auth (crea user, session, account, verification)
bun run db:auth

# 3. Crear tablas de la aplicación
bun run db:migrate

# 4. Crear datos iniciales (categorías + admin)
bun run db:seed
```

### Scripts disponibles
| Comando | Descripción |
|---------|-------------|
| `bun run db:up` | **Producción** - Crea DB/tablas si no existen, aplica migraciones pendientes |
| `bun run db:fresh` | **Desarrollo** - Reset + auth + migrate + seed (todo en uno) |
| `bun run db:reset` | Elimina todas las tablas |
| `bun run db:auth` | Crea tablas de better-auth |
| `bun run db:migrate` | Crea tablas de la aplicación |
| `bun run db:seed` | Inserta datos iniciales |

### Producción (Docker)
El contenedor ejecuta automáticamente al iniciar:
```bash
bun run db:up && bun run db:auth && bun run db:seed
```
Esto crea la DB si no existe, aplica migraciones pendientes, y ejecuta seeds (idempotentes).

### Estructura de archivos
```
src/db/
├── migrations/          # Migraciones de tablas
│   ├── 001-categories.ts
│   ├── 002-products.ts
│   ├── 003-product-images.ts
│   ├── 004-orders.ts
│   ├── 005-order-items.ts
│   ├── 006-admin-notifications.ts
│   ├── 007-shipping-addresses.ts
│   └── 008-settings.ts
├── seeds/               # Datos iniciales
│   ├── 001-categories.ts
│   └── 002-admin.ts
├── up.ts                # Migraciones inteligentes (estilo Laravel)
├── migrate.ts           # Ejecuta todas las migraciones
├── seed.ts              # Ejecuta todos los seeds
├── reset.ts             # Resetea la base de datos
└── fresh.ts             # Todo en uno
```

### Variables de entorno requeridas (.env)
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=catbycam
DB_PORT=3306

ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password123

BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:4321
```