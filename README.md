# CommuniField Login y Registro

Proyecto completo con frontend React + TypeScript y backend Express + TypeScript + MySQL.

## 1. Base de datos
Importa `database/schema.sql` en MySQL/XAMPP/phpMyAdmin.

## 2. Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Pruebas:
- `http://localhost:3000/health`
- `http://localhost:3000/db-test`

Endpoints principales:
- `POST /auth/login`
- `POST /users/register`
- Alias compatibles: `/api/auth/login` y `/api/users/register`

## 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abre `http://localhost:5173`.

## Seguridad incluida
- Validación frontend y backend.
- Hash de contraseña con bcrypt.
- JWT al iniciar sesión.
- Token guardado en `localStorage`.
- Rate limit general.
- Bloqueo configurable por intentos fallidos: `LOGIN_MAX_ATTEMPTS` y `LOGIN_BLOCK_MINUTES`.
- Email, teléfono y username únicos.

## Nota OAuth
Los botones Google/Apple están en el frontend y la ruta backend base existe, pero para OAuth real debes crear credenciales de Google/Apple y conectar Passport o el proveedor oficial.
