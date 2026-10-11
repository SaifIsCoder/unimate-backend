# UniMate Backend — Render Production Deployment Guide

This guide walks you through deploying the **uniMate Backend** as a production-grade Web Service on [Render](https://render.com), connecting it to [Supabase PostgreSQL](https://supabase.com).

---

## 1. Prerequisites Checklist

Before you deploy:
- [ ] A Render account ([render.com](https://render.com)).
- [ ] A Supabase account with an active PostgreSQL database.
- [ ] Your code pushed to a GitHub or GitLab repository.
- [ ] Secure 32-byte hex strings generated for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## 2. Preparing and Pushing to GitHub

Ensure all changes are committed and pushed to your repository. **Never commit `.env` or sensitive JSON credentials.**

```bash
# From the project root
git status

# Verify .env is untracked
git status --ignored | grep .env

# Commit and push
git add .
git commit -m "chore: make backend production-ready for Render deployment"
git push origin main
```

---

## 3. Creating the Render Web Service

### Option A: Automatic Setup using Blueprint (`render.yaml`)

If using Render's **Blueprints**:
1. In the Render Dashboard, click **New +** → **Blueprint**.
2. Select your repository.
3. Render reads `render.yaml` and provisions the Web Service with health check `/health`, start command, and environment variables configured automatically.
4. Fill in the required secrets marked `sync: false` (e.g. `DATABASE_URL`).

### Option B: Manual Setup via Dashboard

1. In the Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub/GitLab repository.
3. Configure the service settings:
   - **Name:** `unimate-backend` (or your preferred name)
   - **Region:** Choose a region geographically close to your Supabase instance (e.g., `Oregon (US West)` or `Frankfurt (EU Central)`).
   - **Root Directory:**
     - If the repository contains the whole project: `server`
     - If the repository only contains the backend: leave blank (`.`)
   - **Runtime:** `Node`
   - **Build Command:** `npm ci --omit=dev`
   - **Start Command:** `npm start`
   - **Plan:** `Starter` (or `Free` for testing; Starter is recommended for persistent connections)
4. Under **Advanced**:
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** `Yes`

---

## 4. Environment Variables Configuration

In Render Dashboard → **Environment**, add the following variables:

| Variable | Required? | Example / Value | Description |
|---|---|---|---|
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations, secure error masking, and rate limiting. |
| `PORT` | **Yes** | `10000` | Render assigns this automatically; our server binds to `0.0.0.0:$PORT`. |
| `DATABASE_URL` | **Yes** | `postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:6543/postgres` | Supabase **Transaction pooler** URI (port 6543). |
| `JWT_SECRET` | **Yes** | `[generated 64-char hex string]` | Signs short-lived access tokens (1 day). |
| `JWT_REFRESH_SECRET` | **Yes** | `[distinct 64-char hex string]` | Signs long-lived refresh tokens (7 days). **Must be different from JWT_SECRET**. |
| `CORS_ORIGINS` | **Yes** | `https://admin.unimate.app,https://student.unimate.app` | Comma-separated list of approved web origins (no trailing slash). |
| `FRONTEND_URL` | Optional | `https://admin.unimate.app` | Primary frontend URL (used as fallback for CORS if `CORS_ORIGINS` is unset). |
| `DB_POOL_MAX` | Optional | `10` | Maximum connections in the `pg` pool. Default is `10`. Keep conservative on free-tier Supabase. |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | API key from Google AI Studio for Gemini assistant features. |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Optional | `{"type":"service_account",...}` | Paste the entire Firebase service account JSON as a single-line string. |

### Generating Secure Secrets
Run this in PowerShell or Bash:
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET (run again for a different string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. Connecting to Supabase PostgreSQL

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings** → **Database**.
3. Under **Connection string**, select **URI**.
4. Choose the **Transaction Pooler** mode (port `6543` or pooler host like `aws-0-[region].pooler.supabase.com:6543`).
   > **Why Pooler?** Serverless platforms like Render can open multiple ephemeral connections. The Supabase connection pooler prevents running out of PostgreSQL connections.
5. Replace `[YOUR-PASSWORD]` with your actual Supabase database password.
6. Paste the resulting URI into Render's `DATABASE_URL` environment variable.

### SSL Configuration
The application automatically configures SSL for Supabase poolers. If your enterprise policy requires a custom CA certificate:
- Set `DB_CA_CERT` to the PEM content of the Supabase Root CA.
- Or set `DB_SSL_REJECT_UNAUTHORIZED=true`.

---

## 6. Configuring CORS for the Frontend

Render provides an HTTPS URL (e.g., `https://unimate-backend.onrender.com`).

1. Configure `CORS_ORIGINS` in Render with every frontend URL that needs to communicate with the API:
   ```
   https://unimate.vercel.app,https://admin.unimate.vercel.app
   ```
2. In production, requests with credentials (`cookies` or `Authorization: Bearer <token>`) are strictly validated against `CORS_ORIGINS`.
3. If testing from localhost alongside production:
   ```
   http://localhost:3000,https://unimate.vercel.app
   ```

---

## 7. Persistent File Storage Strategy

> [!WARNING]
> **Render's Local Disk is Ephemeral**  
> Files saved under `public/uploads/` will be **lost on redeploy or container restart**.

### Current Implementation
- Filenames are randomized (`crypto.randomBytes(16)`) to prevent path traversal attacks.
- Only `.jpg`, `.jpeg`, `.png`, and `.webp` extensions and mime-types are permitted.
- File size is restricted to 5MB.

### Recommended Production Solution: Supabase Storage / S3
To persist user avatars and course attachments:
1. In Supabase Dashboard, create a public or private Storage bucket named `unimate-uploads`.
2. Update the upload endpoint to pipe the buffer directly to Supabase Storage:
   ```javascript
   import { createClient } from "@supabase/supabase-js";
   const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
   const { data, error } = await supabase.storage.from("unimate-uploads").upload(filename, file.buffer, { contentType: file.mimetype });
   ```
3. Alternatively, attach a **Render Persistent Disk** under your Web Service's **Disks** tab mounted to `/var/data/uploads` and set an environment variable `UPLOAD_DIR=/var/data/uploads`.

---

## 8. Verifying the Deployment

Once Render displays **Service is live**:

### 1. Check Top-level Health Check
```bash
curl -i https://your-service-name.onrender.com/health
```
**Expected Response:**
```json
HTTP/2 200
content-type: application/json; charset=utf-8
x-content-type-options: nosniff

{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

### 2. Check API Versioned Health Check
```bash
curl -i https://your-service-name.onrender.com/api/v1/health
```
**Expected Response:**
```json
HTTP/2 200
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

### 3. Check 404 Route Handling
```bash
curl -i https://your-service-name.onrender.com/api/v1/invalid-route
```
**Expected Response:**
```json
HTTP/2 404
{
  "success": false,
  "error": {
    "message": "Route not found",
    "type": "AppError"
  }
}
```

---

## 9. Troubleshooting & Common Failures

### 1. `FATAL: Missing required environment variable(s): DATABASE_URL`
- **Cause:** One of the required environment variables is not configured in the Render dashboard.
- **Fix:** Go to **Environment** in the Render service settings and verify `DATABASE_URL` and `JWT_SECRET` are present.

### 2. `error: password authentication failed for user "postgres"`
- **Cause:** The database password in `DATABASE_URL` is incorrect or contains special characters that were not percent-encoded (e.g., `@` encoded as `%40`).
- **Fix:** Reset the database password in the Supabase Dashboard, URL-encode special characters, and update `DATABASE_URL`.

### 3. `error: remaining connection slots are reserved for non-replication superuser connections`
- **Cause:** Too many connections open to Supabase.
- **Fix:** Switch your `DATABASE_URL` to the **Transaction Pooler** (`port 6543`), and set `DB_POOL_MAX=5` in Render environment variables.

### 4. `Health check failed on /health`
- **Cause:** Service failed to start within Render's timeout window, or crashed during startup.
- **Fix:** Open **Logs** tab in Render. Look for uncaught startup errors or failed database connections. Our server starts listening immediately and logs any database warnings without crashing the HTTP server.

### 5. `CORS error: Response to preflight request doesn't pass access control check`
- **Cause:** The frontend URL sending requests is not listed in `CORS_ORIGINS`.
- **Fix:** Add the frontend's exact origin (e.g., `https://my-frontend.vercel.app`) to `CORS_ORIGINS` in Render and wait for the service to redeploy.
