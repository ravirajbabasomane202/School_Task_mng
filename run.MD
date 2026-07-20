## Backend

1. Create the database:
```powershell
psql -U postgres
CREATE DATABASE taskmanager;
```

2. Install dependencies and run migrations:
```powershell
cd backend
pip install -r requirements.txt
$env:FLASK_APP = "run.py"
python -m flask db upgrade
python -m flask seed
python run.py
```

Backend runs at `http://localhost:5000`.

Demo logins after seeding:
- Chairman: `chairman@school.com` / `chairman123`
- Director: `director@school.com` / `director123`

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

Optional environment variable:
- `VITE_API_URL=http://localhost:5000/api`

How to use it on another PC
1. Install PostgreSQL

Install the same (or newer) PostgreSQL version.

2. Create the database
createdb -U postgres taskmanager

or in pgAdmin:

Right-click Databases
Create → Database
Name it taskmanager
3. Restore the backup
$env:PGPASSWORD="ravi"

& "E:\databas\bin\pg_restore.exe" `
-U postgres `
-h localhost `
-p 5432 `
-d taskmanager `
-v `
"D:\Backup\taskmanager.backup"

On the new PC, replace E:\databas\bin\pg_restore.exe with the actual location of pg_restore.exe if it's different.
