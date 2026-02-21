# Deploy to aaPanel (Git + Node.js + PostgreSQL)

## 1) Clone project on server

```bash
cd /www/wwwroot
git clone https://github.com/dovban46/pakkeneonaprty.git neonparty
cd neonparty
git checkout <your-branch-name>
```

## 2) Install dependencies

```bash
npm install
```

## 3) Create runtime environment file

```bash
cp .env.example .env
```

Edit `.env` with your real credentials:

```env
PORT=5005
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=admin_neonparty
PGUSER=admin_neonparty
PGPASSWORD=YOUR_REAL_PASSWORD
PGSSL=false
```

## 4) Run app with PM2

```bash
pm2 start server.js --name neonparty --update-env
pm2 save
pm2 startup
```

## 5) aaPanel reverse proxy

- Domain website in aaPanel -> `Reverse Proxy`
- Target: `http://127.0.0.1:5005`
- Enable reverse proxy and save

## 6) Firewall/Nginx checks

- If using reverse proxy, external `5005` does not need to be open
- Make sure your domain points to this server
- SSL can be managed in aaPanel (`Let's Encrypt`)

## 7) Update app after new commits

```bash
cd /www/wwwroot/neonparty
git fetch --all
git checkout <your-branch-name>
git pull
npm install
pm2 restart neonparty --update-env
```

## 8) Basic health checks

```bash
curl http://127.0.0.1:5005/health
curl http://127.0.0.1:5005/health/db
```

If `/health/db` returns `ok: false`, verify database credentials in `.env`.
