# SSC — Sistema de Seguimiento de Cirugías Especializadas

Sistema hospitalario para el seguimiento y gestión de cirugías, con panel web administrativo y app móvil.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/) v14 o superior — **o** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ver opción A abajo, no requiere instalar PostgreSQL)
- [npm](https://www.npmjs.com/)

---

## Configuración inicial (primera vez)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/SSC-Sistema-de-Seguimiento-de-Cirugias.git
cd SSC-Sistema-de-Seguimiento-de-Cirugias
```

### 2. Base de datos: crear el usuario y la base

**Opción A — Docker (recomendada, un solo comando):**

```bash
docker run -d --name ssc-postgres \
  -e POSTGRES_USER=ssc_user \
  -e POSTGRES_PASSWORD=ssc_pass_segura \
  -e POSTGRES_DB=ssc_db \
  -p 5432:5432 \
  postgres:16-alpine
```

Crea el usuario, la base y las credenciales que el `.env.example` ya trae por defecto,
sin instalar nada más. Si Docker Desktop no está corriendo, abrilo primero (tarda uno o
dos minutos en levantar el motor la primera vez). Para pausar/reanudar entre sesiones:
`docker stop ssc-postgres` / `docker start ssc-postgres`. Para confirmar que ya acepta
conexiones: `docker exec ssc-postgres pg_isready -U ssc_user`.

**Opción B — PostgreSQL instalado localmente:**

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

Si es la base recién creada (opción A o B de arriba) y sólo querés aplicar las
migraciones que ya están versionadas en el repo:

```bash
npx prisma migrate deploy
npm run seed
```

Si en cambio vas a modificar `schema.prisma` y generar una migración nueva, usá:

```bash
npx prisma migrate dev
```
Cuando pida un nombre para la migración, escribí uno descriptivo (o `init` la primera vez).

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

> PostgreSQL debe estar corriendo antes de `npm run dev`. Si lo instalaste local en
> Windows, arranca automáticamente con el sistema. Si usás la opción Docker, acordate
> de `docker start ssc-postgres` (o dejar Docker Desktop abierto, que lo mantiene arriba).

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
| `RESEND_API_KEY` | API key de Resend (emails). Vacía ⇒ emails auditados como "omitido" | *(vacía)* |
| `EMAIL_FROM`  | Remitente de los emails              | `SSC <notificaciones@tu-dominio.com>`                          |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Service account de Firebase en base64 (push FCM). Vacía ⇒ push deshabilitado | *(vacía)* |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Alternativa: ruta a un .json local del service account | *(vacía)* |

> El flujo completo de notificaciones (Socket.IO + FCM + Resend) está documentado
> en [`../docs/NOTIFICACIONES.md`](../docs/NOTIFICACIONES.md).

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

**`connect ECONNREFUSED` / no conecta a la base**
→ El servidor de PostgreSQL no está corriendo. Con Docker: `docker start ssc-postgres`
(y si el contenedor no existe, volvé a correr el comando `docker run` del paso 2).
Confirmá que ya acepta conexiones con `docker exec ssc-postgres pg_isready -U ssc_user`.

**`P3014` — cannot create shadow database**
→ El usuario no tiene permisos. Ejecutá en psql: `ALTER USER ssc_user CREATEDB;`

**`Failed to fetch` en el frontend**
→ El backend no está corriendo o está en un puerto distinto. Verificá que `npm run dev` en el backend muestre el puerto `4000`.

**`Environment variable not found: DATABASE_URL`**
→ No existe el archivo `.env` en la carpeta `backend/`. Ejecutá `cp .env.example .env`.