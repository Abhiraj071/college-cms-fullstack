# MongoDB Setup Instructions

## Current Status
MongoDB is being installed on your system. This may take a few minutes.

## Once Installation Completes:

### Step 1: Start MongoDB Service
Open a **new PowerShell window as Administrator** and run:
```powershell
net start MongoDB
```

If that doesn't work, try:
```powershell
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\data\db"
```

### Step 2: Initialize the Database
In your current terminal, run:
```bash
cd backend
node initDb.js
```

This will create the admin user automatically.

### Step 3: Restart the Backend Server
Press Ctrl+C to stop the current server, then run:
```bash
node server.js
```

### Step 4: Login
- Open http://localhost:8080
- Username: `admin`
- Password: `admin123`

## Alternative: Use MongoDB Atlas (Cloud - No Installation)

If MongoDB installation is taking too long or fails:

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free M0 cluster
4. Get your connection string
5. Update `backend/.env` file:
   ```
   MONGODB_URI=your_atlas_connection_string_here
   ```
6. Restart the backend server

## Need Help?
If you're still having issues, let me know and I'll help you troubleshoot!
