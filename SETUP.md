# RedImVi Setup Guide

## Quick Start (Development Mode)

### With PostgreSQL (Recommended)

The server is now configured to use PostgreSQL instead of MongoDB.

```bash
# Server setup
cd server
npm install
npm start

# Client setup (new terminal)
cd client
npm install
npm run dev
```

Access the app at `http://localhost:3000`

---

## PostgreSQL Setup Options

### Option 1: Cloud PostgreSQL (Recommended - Already Configured!)

Your database is already set up on **Render.com**:
- Connection string is already in `server/.env`
- No additional setup needed!
- Just run `npm start` in the server directory

### Option 2: Local PostgreSQL Installation

If you want to use a local PostgreSQL database instead:

#### Windows
1. Download PostgreSQL from [postgresql.org/download](https://www.postgresql.org/download/)
2. Run the installer and follow setup wizard
3. Remember the password you set for the `postgres` user
4. PostgreSQL starts automatically

#### MacOS
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database
```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE redimvidb;

# Create user (optional)
CREATE USER redimvi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE redimvidb TO redimvi_user;

# Exit
\q
```

#### Update .env
```
DATABASE_URL=postgresql://redimvi_user:your_password@localhost:5432/redimvidb
```

---

## Troubleshooting

### "PostgreSQL connection failed"
- Check if PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- For cloud databases, ensure SSL is enabled (already configured)
- Check firewall settings

### "Port 5000 already in use"
- Change PORT in `.env`: `PORT=5001`
- Or kill process on port 5000:
  - Windows: `netstat -ano | findstr :5000` then `taskkill /F /PID <PID>`
  - Mac/Linux: `lsof -i :5000` then `kill -9 <PID>`

### "Sharp installation failed"
- Clear cache: `npm cache clean --force`
- Reinstall: `npm install --save sharp`

### Client can't connect to server
- Ensure server is running on port 5000
- Check `VITE_API_URL` in `client/.env`: `http://localhost:5000/api`
- Check browser console for CORS errors

---

## Environment Variables

**Server (.env)**
```
PORT=5000
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

**Client (.env)**
```
VITE_API_URL=http://localhost:5000/api
```

---

## Database Migration from MongoDB

If you previously used MongoDB, the database has been migrated to PostgreSQL:
- User model now uses Sequelize ORM
- All MongoDB-specific code has been removed
- Password hashing still works the same way
- JWT authentication remains unchanged

---

## Next Steps

After setup, you can:
1. Test authentication (signup/login)
2. Implement image compression with Sharp
3. Implement video compression (FFmpeg integration)
4. Add file download functionality
5. Deploy to production

---

## Testing API Endpoints

Use Postman or curl to test:

```bash
# Health check
curl http://localhost:5000/api/health

# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Easy Start Script

Use the provided batch file to start both server and client:

**Windows:**
```bash
# Just double-click start.bat
# Or run from command line:
start.bat
```

This will:
- Kill any processes on ports 5000 and 3000
- Start the backend server
- Start the frontend client
- Open both in separate terminal windows
