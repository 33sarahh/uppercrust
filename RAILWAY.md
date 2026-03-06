# Deploying the upper crust to Railway

This guide assumes you have not used Railway before. Your app is a single Node service: the backend serves the React frontend and the API.

## 1. Push your code to GitHub

Railway deploys from Git. If you haven’t already:

```bash
git add .
git commit -m "Add Railway deployment config"
git push origin main
```

Use the branch you want to deploy (e.g. `main`).

## 2. Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in (GitHub is easiest).
2. Click **“New Project”**.
3. Choose **“Deploy from GitHub repo”** and select your `uppercrust` repo.
4. Railway will detect the root `package.json` and use it to build and run your app.

## 3. Configure the service

1. In the project, open the service that was created from your repo.
2. Go to the **Variables** tab.
3. Add:

   | Variable          | Value                    | Notes                                      |
   |-------------------|--------------------------|--------------------------------------------|
   | `NODE_ENV`        | `production`             | Required for production behavior.          |
   | `SESSION_SECRET`  | (random long string)     | Generate one; e.g. `openssl rand -hex 32`. |

   Railway sets `PORT` for you; you don’t need to add it.

4. (Optional) To persist the SQLite database across deploys, add a **Volume** and then a variable:
   - In the service, open **Settings** → **Volumes** → **Add Volume**. Mount path: `/data`.
   - In **Variables**, add:
   - **`DATABASE_PATH`** = `/data/orders.db`  
   Then the database file will live on the volume instead of the ephemeral filesystem.

## 4. Deploy

- If you connected a GitHub repo, every push to the selected branch triggers a new deploy.
- You can also trigger a deploy from the Railway dashboard (e.g. **Deploy** / **Redeploy**).

## 5. Get your URL

1. Open your service in Railway.
2. Go to **Settings** → **Networking** → **Generate Domain** (or use an existing one).
3. Your app will be available at `https://<your-service>.up.railway.app`.

## 6. Test

- Open the generated URL in a browser; you should see the upper crust app.
- Try registering, logging in, and placing an order.
- If you didn’t add a volume, the SQLite DB is ephemeral: data can be lost on redeploy. For real persistence, use the Volume + `DATABASE_PATH` above, or consider migrating to PostgreSQL later.

## Summary

- **One service**: backend builds the frontend and serves it; no separate frontend service.
- **Build**: `npm run build` (installs backend + frontend deps, builds React).
- **Start**: `npm start` → `node backend/server.js`.
- **Env**: `NODE_ENV=production`, `SESSION_SECRET`, and optionally `DATABASE_PATH` for a Volume.

For more, see [Railway’s Node.js docs](https://docs.railway.app/guides/nodejs).
