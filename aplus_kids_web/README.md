# A Plus Kids Platform

This repository contains the complete A Plus Kids platform:

- `aplus_kids_web` — Next.js frontend
- `aplus_kids_api` — Spring Boot API, database migrations, authentication, profiles, and Kids Champ administration

## Requirements

Install the following software:

- Node.js 20 or newer
- Java JDK 21
- PostgreSQL
- Git (recommended)

Check the installations in PowerShell:

```powershell
node --version
npm --version
java --version
psql --version
```

## 1. Download the project

```powershell
git clone https://github.com/apluskidsdev001/apluskids.git
cd apluskids
```

## 2. Create the PostgreSQL database

The default database is named `aplus_kids`. PostgreSQL must be installed and running before starting the backend.

Create it from PowerShell:

```powershell
psql -U postgres -c "CREATE DATABASE aplus_kids;"
```

You can also create it with pgAdmin:

1. Open pgAdmin and connect to the PostgreSQL server.
2. Right-click **Databases**.
3. Select **Create > Database**.
4. Enter `aplus_kids` and save.

Create only the empty database. Flyway automatically creates and updates the tables when the backend starts.

## 3. Configure the backend

Create this local file:

```text
aplus_kids_api/application-local.yml
```

Add the following configuration and replace the placeholder values:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/aplus_kids
    username: postgres
    password: "YOUR_POSTGRES_PASSWORD"

server:
  port: 8081

aplus:
  frontend-origin: ${FRONTEND_ORIGIN:http://localhost:3000}
  auth:
    jwt-secret: "REPLACE_WITH_A_LONG_RANDOM_SECRET_OF_AT_LEAST_32_BYTES"
```

`application-local.yml` is ignored by Git. Never commit database passwords, email passwords, JWT secrets, or WhatsApp tokens.

Optional email and WhatsApp variables are documented in:

```text
aplus_kids_api/.env.example
```

## 4. Run the backend

Open PowerShell in the repository root:

```powershell
cd aplus_kids_api
.\mvnw.cmd spring-boot:run
```

The backend runs at:

```text
http://localhost:8081
```

On the first successful start, Flyway runs every migration in `src/main/resources/db/migration` and prepares the database schema.

## 5. Run the frontend

Open another PowerShell window:

```powershell
cd path\to\apluskids\aplus_kids_web
npm install
npm run dev
```

Open the website:

```text
http://localhost:3000
```

The frontend connects to `http://localhost:8081` by default. To use a backend at another address, set the URL before starting or building:

```powershell
$env:NEXT_PUBLIC_API_URL="https://api.example.com"
npm run dev
```

## 6. Create the first administrator

An empty installation contains the system roles but does not contain an administrator account.

1. Register an account through the website.
2. Complete email verification.
3. Connect to `aplus_kids` using pgAdmin or `psql`.
4. Replace the example email and run:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE LOWER(u.email) = LOWER('administrator@example.com')
  AND r.name IN ('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')
ON CONFLICT DO NOTHING;
```

Log out and log in again. The account will open the admin dashboard and can manage additional administrators.

Passwords require at least 8 characters.

## Move an existing installation to another PC

Creating a new database does not transfer existing accounts, submissions, ZIP records, or settings.

On the old PC, create a PostgreSQL backup:

```powershell
pg_dump -U postgres -Fc -d aplus_kids -f aplus_kids.backup
```

Copy the backup to the new PC, create the database, and restore it:

```powershell
psql -U postgres -c "CREATE DATABASE aplus_kids;"
pg_restore -U postgres -d aplus_kids --no-owner aplus_kids.backup
```

Also copy this directory from the old backend installation:

```text
aplus_kids_api/data/kids-champ/
```

It contains uploaded artwork and generated ZIP files, which are not stored in PostgreSQL.

## Multiple computers

The recommended arrangement is one central backend, one PostgreSQL database, and one shared file-storage location. Other computers connect to the central website/API. Creating an independent database on every PC produces separate data that does not synchronize automatically.

Do not expose PostgreSQL port `5432` directly to the public internet.

## Build and test

Frontend:

```powershell
cd aplus_kids_web
npm run lint
npm run build
```

Backend:

```powershell
cd aplus_kids_api
.\mvnw.cmd test
.\mvnw.cmd package
```

## Common startup problem

If the backend says port `8081` is already in use, locate the existing process:

```powershell
Get-NetTCPConnection -LocalPort 8081 -State Listen
```

Stop the older backend instance or configure a different server port. Do not run two backend instances on the same port.

## Security and backups

- Keep `application-local.yml` and `application-whatsapp.yml` private.
- Never commit `.env` files or real access tokens.
- Back up both PostgreSQL and `aplus_kids_api/data/kids-champ`.
- Use HTTPS outside the local computer.
- Rotate credentials that appear in messages, screenshots, logs, or Git history.
