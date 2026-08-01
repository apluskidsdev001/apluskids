# A Plus Kids Platform

Installation and local-operation guide for the A Plus Kids website, API, PostgreSQL database, and Kids Champ administration system.

## Project folders

The frontend and backend must be kept next to each other:

```text
apluskids/
  aplus_kids_web/   Next.js frontend
  aplus_kids_api/   Spring Boot backend
```

## Requirements

Install these applications before starting:

- Node.js 20 or newer
- Java JDK 21
- PostgreSQL
- Git (optional, but recommended)

Confirm the installations in PowerShell:

```powershell
node --version
npm --version
java --version
psql --version
```

## 1. Create the PostgreSQL database

The default database name is `aplus_kids`. PostgreSQL must already be installed and running.

Using PostgreSQL command line:

```powershell
psql -U postgres -c "CREATE DATABASE aplus_kids;"
```

Alternatively, open pgAdmin, right-click **Databases**, select **Create > Database**, and enter `aplus_kids`.

Only the empty database needs to be created manually. The backend uses Flyway to create and update all tables when it starts.

## 2. Configure the backend

Copy the example configuration values or create `aplus_kids_api/application-local.yml`. Do not commit this file or share its passwords and tokens.

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

Email and WhatsApp settings are optional during the initial database startup. Configure them before testing verification emails or WhatsApp delivery. Use `aplus_kids_api/.env.example` as the reference and never store real secrets in Git.

## 3. Start the backend

Open PowerShell in the backend folder:

```powershell
cd path\to\apluskids\aplus_kids_api
.\mvnw.cmd spring-boot:run
```

The API should start at:

```text
http://localhost:8081
```

Flyway will run the database migrations automatically. If port `8081` is already occupied, stop the other backend process before starting another instance:

```powershell
Get-NetTCPConnection -LocalPort 8081 -State Listen
```

## 4. Install and start the frontend

Open a second PowerShell window:

```powershell
cd path\to\apluskids\aplus_kids_web
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend uses `http://localhost:8081` as its default API. When the API is hosted elsewhere, set its public address before building or starting the frontend:

```powershell
$env:NEXT_PUBLIC_API_URL="https://api.example.com"
npm run dev
```

## 5. Create the first administrator

Database migrations create the roles, but an empty database does not contain an administrator account.

1. Register a normal account through the website.
2. Complete email verification.
3. Open pgAdmin or `psql` and run the following statement after replacing the email:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE LOWER(u.email) = LOWER('administrator@example.com')
  AND r.name IN ('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')
ON CONFLICT DO NOTHING;
```

Log out and log in again. The account will then open the administrator dashboard. That super-admin can create or manage additional administrators from the admin area.

Passwords must contain at least 8 characters.

## Existing installation: move all data to another PC

Creating a new empty database does not copy users, submissions, ZIP records, or configuration. To move the existing installation, transfer both the PostgreSQL database and stored files.

Create a database backup on the old PC:

```powershell
pg_dump -U postgres -Fc -d aplus_kids -f aplus_kids.backup
```

On the new PC, create the database and restore it:

```powershell
psql -U postgres -c "CREATE DATABASE aplus_kids;"
pg_restore -U postgres -d aplus_kids --no-owner aplus_kids.backup
```

Also copy this backend directory to the same relative location on the new PC:

```text
aplus_kids_api/data/kids-champ/
```

This directory contains uploaded artwork and generated ZIP files; those files are not stored inside PostgreSQL.

## Multiple computers

For normal multi-computer use, run one backend, one PostgreSQL database, and one shared file-storage location on a server. Other computers should open the website and connect to that central backend. Installing an independent database on every PC produces separate users and submissions that will not synchronize automatically.

For another computer on the same trusted network:

- Allow the backend and frontend ports through the server firewall.
- Set `NEXT_PUBLIC_API_URL` to the server API address.
- Set `FRONTEND_ORIGIN` to the exact website origin.
- Configure PostgreSQL network access only if the backend is running on a different machine from PostgreSQL.
- Never expose PostgreSQL port `5432` directly to the public internet.

## Build checks

Frontend:

```powershell
npm run lint
npm run build
```

Backend:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
```

## Important security notes

- Never commit `application-local.yml`, access tokens, database passwords, email app passwords, or JWT secrets.
- Use different secrets for development and production.
- Rotate any credential accidentally pasted into chat, logs, screenshots, or source code.
- Keep PostgreSQL and uploaded child artwork private.
- Back up the database and `data/kids-champ` directory regularly.
- Use HTTPS for any installation accessed outside the local computer.
