# 🆓 Deploy LogiCore - 100% FREE Forever

## Free Tier Stack:
- ✅ **Render** - Free web services & PostgreSQL
- ✅ **MongoDB Atlas** - Free 512MB database
- ✅ **Total Cost:** $0/month forever

### ⚠️ Free Tier Limitations:
- Backend sleeps after 15 min of inactivity (wakes up in ~30 seconds)
- PostgreSQL database expires after 90 days (can create new one)
- 512MB MongoDB storage
- Perfect for: Portfolio, demos, learning, small projects

---

## 🚀 Step-by-Step (20 Minutes)

### Step 1: Create Render Account (2 minutes)
1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub (easiest)
4. Verify email

### Step 2: Create PostgreSQL Database (3 minutes)
1. In Render Dashboard, click "New +" → "PostgreSQL"
2. Settings:
   - **Name:** `logicore-postgres`
   - **Database:** `smart_supply_chain`
   - **User:** (auto-generated)
   - **Region:** Choose closest to you
   - **PostgreSQL Version:** 15
   - **Plan:** **Free**
3. Click "Create Database"
4. Wait 2-3 minutes for provisioning
5. **SAVE THESE** (you'll need them):
   - Scroll down to "Connections"
   - Copy "Internal Database URL" (starts with `postgres://`)
   - Also note: Hostname, Port, Database, Username, Password

### Step 3: Create MongoDB Database (3 minutes)
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up (free)
3. Create free cluster:
   - Provider: **AWS**
   - Region: Choose closest to you
   - Cluster Tier: **M0 Sandbox (FREE)**
   - Cluster Name: `logicore`
4. Click "Create Cluster" (takes 3-5 minutes)
5. Create database user:
   - Click "Database Access" → "Add New Database User"
   - Username: `logicore`
   - Password: (generate or create your own) **SAVE THIS!**
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"
6. Whitelist IP:
   - Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
7. Get connection string:
   - Click "Database" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your password
   - **SAVE THIS!** (e.g., `mongodb+srv://logicore:yourpassword@cluster0.xxxxx.mongodb.net`)

### Step 4: Run Database Migrations (5 minutes)

#### Connect to PostgreSQL:
```bash
# Use the connection details from Step 2
psql "postgres://username:password@hostname/database"
```

#### Run migrations in order:
```sql
-- 1. Auth schema
\i db/auth_schema.sql

-- 2. Inventory tables
\i backend/create-inventory-flow-tables.sql

-- 3. Audit trail
\i backend/create-audit-trail.sql

-- 4. User ownership
\i backend/add-user-ownership.sql

-- Exit
\q
```

**Alternative:** Use a GUI tool:
- Download [pgAdmin](https://www.pgadmin.org/) (free)
- Or use [TablePlus](https://tableplus.com/) (free trial)
- Connect using the credentials from Step 2
- Run each SQL file

### Step 5: Push Code to GitHub (2 minutes)
```bash
# If not already on GitHub
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 6: Deploy Backend on Render (5 minutes)
1. In Render Dashboard, click "New +" → "Web Service"
2. Click "Connect a repository" → Select your GitHub repo
3. Settings:
   - **Name:** `logicore-backend`
   - **Region:** Same as your database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** **Free**

4. Click "Advanced" → Add Environment Variables:

```bash
# PostgreSQL (from Step 2 - use Internal Database URL parts)
PGHOST=dpg-xxxxx-a.oregon-postgres.render.com
PGPORT=5432
PGDATABASE=smart_supply_chain
PGUSER=logicore_postgres_user
PGPASSWORD=xxxxxxxxxxxxx

# Server
PORT=4001
NODE_ENV=production

# JWT Secret (generate new one)
JWT_SECRET=run_this_command_to_generate_one
JWT_EXPIRES_IN=7d

# MongoDB (from Step 3)
MONGODB_URI=mongodb+srv://logicore:yourpassword@cluster0.xxxxx.mongodb.net
MONGODB_DB_NAME=smart_supply_chain

# CORS (we'll update this after frontend deploy)
CORS_ORIGIN=*

# Optional: Gemini API keys (leave empty if you don't have them)
GEMINI_API_KEY=
GEMINI_FALLBACK_API_KEY=
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as JWT_SECRET value.

5. Click "Create Web Service"
6. Wait 5-10 minutes for deployment
7. **SAVE YOUR BACKEND URL** (e.g., `https://logicore-backend.onrender.com`)

### Step 7: Deploy Frontend on Render (3 minutes)
1. In Render Dashboard, click "New +" → "Static Site"
2. Select your GitHub repo
3. Settings:
   - **Name:** `logicore-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist/public`

4. Add Environment Variable:
```bash
VITE_API_URL=https://logicore-backend.onrender.com
```
(Use your backend URL from Step 6)

5. Click "Create Static Site"
6. Wait 3-5 minutes for deployment
7. **SAVE YOUR FRONTEND URL** (e.g., `https://logicore-frontend.onrender.com`)

### Step 8: Update CORS (2 minutes)
1. Go back to your backend service in Render
2. Click "Environment" in left sidebar
3. Update `CORS_ORIGIN`:
```bash
CORS_ORIGIN=https://logicore-frontend.onrender.com
```
(Use your frontend URL from Step 7)

4. Click "Save Changes"
5. Service will automatically redeploy (takes 2-3 minutes)

### Step 9: Test Your Deployment (2 minutes)
1. Visit your frontend URL
2. Try to register a new account
3. Login with:
   - Email: `admin@logicore.com`
   - Password: `admin123`
4. Test creating a product
5. Check health endpoint: `https://your-backend-url.onrender.com/health`

---

## ✅ You're Live - 100% FREE!

**Your URLs:**
- Frontend: https://logicore-frontend.onrender.com
- Backend: https://logicore-backend.onrender.com

**Login:**
- Email: admin@logicore.com
- Password: admin123

⚠️ **Change the admin password immediately!**

---

## 🔄 Auto-Deploy on Git Push

Render automatically deploys when you push to GitHub:
```bash
git add .
git commit -m "Update"
git push
```

Your app will redeploy automatically!

---

## 💡 Free Tier Tips

### Backend Sleeps After 15 Minutes
- First request after sleep takes ~30 seconds to wake up
- Keep it awake: Use a free uptime monitor (see below)

### Keep Your App Awake (Optional)
Use a free ping service:

**Option 1: UptimeRobot (Recommended)**
1. Go to https://uptimerobot.com (free)
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-backend-url.onrender.com/health`
   - Interval: 5 minutes
3. This pings your app every 5 minutes, keeping it awake

**Option 2: Cron-job.org**
1. Go to https://cron-job.org (free)
2. Create job to ping your health endpoint every 5 minutes

### PostgreSQL Database Expires After 90 Days
- Render sends email reminder before expiration
- Export your data before expiration
- Create new free database and restore data
- Or upgrade to paid plan ($7/month) for permanent database

### MongoDB 512MB Limit
- More than enough for most small projects
- Monitor usage in MongoDB Atlas dashboard
- Upgrade to paid tier if needed ($9/month for 2GB)

---

## 🆘 Troubleshooting

### Backend won't start
1. Check logs: Render Dashboard → Your Service → Logs
2. Verify all environment variables are set
3. Check database connection strings

### Frontend can't connect to backend
1. Verify `VITE_API_URL` is correct
2. Check `CORS_ORIGIN` matches frontend URL exactly
3. Test backend: `curl https://your-backend-url.onrender.com/health`

### Database connection errors
**PostgreSQL:**
- Use "Internal Database URL" from Render (not External)
- Check all PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD are correct

**MongoDB:**
- Verify connection string format
- Check password doesn't have special characters (or URL encode them)
- Verify IP whitelist includes 0.0.0.0/0

### "Service Unavailable" on first request
- Normal! Backend is waking up from sleep
- Wait 30 seconds and refresh
- Consider using UptimeRobot to keep it awake

---

## 📊 What You Get (FREE)

✅ **Frontend:** Static site with CDN
✅ **Backend:** Node.js web service
✅ **PostgreSQL:** 1GB storage (expires after 90 days)
✅ **MongoDB:** 512MB storage (permanent)
✅ **SSL:** Automatic HTTPS
✅ **Custom Domain:** Supported (free)
✅ **Auto-deploy:** On git push
✅ **Logs:** Real-time logs in dashboard

---

## 🎯 Upgrade Options (If Needed Later)

### Render Paid Plans:
- **Starter:** $7/month - No sleep, permanent PostgreSQL
- **Standard:** $25/month - More resources

### MongoDB Atlas Paid:
- **M10:** $9/month - 2GB storage
- **M20:** $25/month - 5GB storage

### When to Upgrade:
- Backend sleep is annoying users
- Need permanent PostgreSQL
- Need more MongoDB storage
- Need better performance

---

## 🔐 Security Checklist

- [ ] Change admin password
- [ ] Use strong JWT_SECRET (generated, not default)
- [ ] CORS_ORIGIN set to your frontend URL (not *)
- [ ] MongoDB IP whitelist configured
- [ ] Environment variables never committed to git
- [ ] Regular backups of database

---

## 📦 Backup Your Data

### PostgreSQL Backup:
```bash
# Export database
pg_dump "postgres://user:pass@host/db" > backup.sql

# Restore to new database
psql "postgres://user:pass@newhost/newdb" < backup.sql
```

### MongoDB Backup:
1. MongoDB Atlas → Clusters → "..." → "Backup"
2. Or use `mongodump`:
```bash
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/smart_supply_chain"
```

---

## 🎉 Success!

Your supply chain management system is now running in production - completely FREE!

**Share your project:**
- Add the URL to your resume
- Share with potential employers
- Use for your portfolio

**Need help?**
- Render Docs: https://render.com/docs
- MongoDB Docs: https://docs.atlas.mongodb.com
- Render Community: https://community.render.com

---

**Last Updated:** March 2, 2026
