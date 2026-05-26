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
