# SSC — Sistema de Seguimiento de Cirugías Especializadas

Sistema hospitalario para el seguimiento y gestión de cirugías, con panel web administrativo y app móvil.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/) v14 o superior
- [npm](https://www.npmjs.com/)

---

## Configuración inicial (primera vez)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/SSC-Sistema-de-Seguimiento-de-Cirugias.git
cd SSC-Sistema-de-Seguimiento-de-Cirugias
```

### 2. Crear el usuario y base de datos en PostgreSQL

Abrí el psql shell (buscá "SQL Shell (psql)" en el menú inicio) y presioná Enter en todo hasta que pida contraseña:

```
Server [localhost]: Enter
Database [postgres]: Enter
Port [5432]: Enter
Username [postgres]: Enter
Password for user postgres: TU_PASSWORD
```

Una vez dentro del prompt `postgres=#`, ejecutá:

```sql
CREATE USER ssc_user WITH PASSWORD 'ssc_pass_segura';
CREATE DATABASE ssc_db OWNER ssc_user;
GRANT ALL PRIVILEGES ON DATABASE ssc_db TO ssc_user;
ALTER USER ssc_user CREATEDB;
\q
```

### 3. Configurar el backend

```bash
cd backend
cp .env.example .env
npm install
```

El archivo `.env` ya viene preconfigurado para las credenciales anteriores. Si usás otras, editá `DATABASE_URL` en `.env`.

### 4. Correr migraciones y seed

```bash
npx prisma migrate dev
npm run seed
```

Cuando `prisma migrate dev` pida un nombre para la migración, escribí `init` o presioná Enter.

### 5. Configurar el frontend

```bash
cd ../frontend
npm install
```

---

## Levantar el proyecto (uso diario)

Abrí **dos terminales** y ejecutá una en cada una:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Deberías ver: `SSC backend escuchando en http://localhost:4000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Deberías ver la URL local, generalmente `http://localhost:3000`.

> PostgreSQL debe estar corriendo. En Windows arranca automáticamente con el sistema.

---

## Credenciales de acceso por defecto

| Campo    | Valor             |
|----------|-------------------|
| Email    | admin@ssc.local   |
| Password | Admin123!         |

> Estas credenciales las crea `npm run seed`. Cambiá la contraseña del
> administrador apenas ingreses por primera vez en un entorno real.

---

## Variables de entorno (backend)

Archivo: `backend/.env`

| Variable      | Descripción                          | Valor por defecto                                              |
|---------------|--------------------------------------|----------------------------------------------------------------|
| `DATABASE_URL`| Conexión a PostgreSQL                | `postgresql://ssc_user:ssc_pass_segura@localhost:5432/ssc_db` |
| `JWT_SECRET`  | Clave secreta para tokens JWT        | Cambiar por string aleatorio de al menos 32 caracteres        |
| `PORT`        | Puerto del servidor backend          | `4000`                                                         |
| `CORS_ORIGIN` | Origen permitido para CORS           | `http://localhost:3000`                                        |
| `NODE_ENV`    | Entorno de ejecución                 | `development`                                                  |

---

## Estructura del proyecto

```
SSC-Sistema-de-Seguimiento-de-Cirugias/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── routes/
│   │   └── server.ts
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    └── package.json
```

---

## Solución de problemas frecuentes

**`Authentication failed` al iniciar el backend**
→ El usuario `ssc_user` no existe en PostgreSQL. Seguí el paso 2 de la configuración inicial.

**`P3014` — cannot create shadow database**
→ El usuario no tiene permisos. Ejecutá en psql: `ALTER USER ssc_user CREATEDB;`

**`Failed to fetch` en el frontend**
→ El backend no está corriendo o está en un puerto distinto. Verificá que `npm run dev` en el backend muestre el puerto `4000`.

**`Environment variable not found: DATABASE_URL`**
→ No existe el archivo `.env` en la carpeta `backend/`. Ejecutá `cp .env.example .env`.