# Deploy (free): Vercel frontend + Oracle Always Free backend

Everything runs in the cloud, 24/7, at zero cost. Your machine is not involved once
this is done.

```
Browser ──HTTPS──► Vercel (Next.js frontend)   ← free Hobby
                     │  NEXT_PUBLIC_API_BASE = https://api.<domain>
                     ▼
   ┌──────────── Oracle Always Free VM ───────────┐   ← free forever, always on
   │ Caddy :443 ─auto TLS─► backend:8000           │
   │ Postgres (private, on-disk volume)            │
   └───────────────────────────────────────────────┘
```

Order matters: **backend first** (the frontend build needs its URL).

---

## Part A — Backend on Oracle Always Free

### A1. Create the VM (you do this, ~10 min)
1. Sign up at cloud.oracle.com (free, needs a card for identity only — not charged).
2. Create a Compute instance:
   - Shape **VM.Standard.A1.Flex**, **2 OCPU / 6 GB** is plenty (you can go to 4/24).
   - Image **Ubuntu 24.04**.
   - Download the SSH key it offers.
3. Note the instance's **public IP**.

### A2. Open the firewall (the #1 Oracle gotcha — two layers)
- **Cloud:** VCN → Security List → add **Ingress** rules: source `0.0.0.0/0`, TCP, ports **80** and **443**.
- **On the VM** (Ubuntu's own iptables blocks them too):
  ```bash
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
  sudo netfilter-persistent save
  ```

### A3. Install Docker + get the code on the VM
The repo is **private**, so authenticate GitHub on the VM with `gh` (one-time device
login), then clone:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 gh
sudo usermod -aG docker $USER && newgrp docker
gh auth login                                   # choose GitHub.com -> HTTPS -> device code
gh repo clone yogixt/rr-connect-sahayak && cd rr-connect-sahayak
```

### A4. Point a hostname at the VM
- If you own a domain: add an **A record** `api.yourdomain.com -> VM public IP`.
- No domain? Use sslip.io: `api-<ip-with-dashes>.sslip.io` (no setup, real cert).

### A5. Configure + launch
```bash
cp .env.prod.example .env.prod
nano .env.prod        # set DOMAIN, FRONTEND_ORIGIN (Vercel URL from Part B), DB_PASSWORD
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml exec backend python -m scripts.import_pincode
curl https://$DOMAIN/health      # -> {"status":"ok"} once DNS + cert are live
```

> `FRONTEND_ORIGIN` must match the Vercel URL from Part B. It's fine to set a
> placeholder first, deploy the frontend, then update it and re-run `up -d`.

---

## Part B — Frontend on Vercel

From your machine (or let me drive it):
```bash
cd frontend
npx vercel login            # interactive — you do this once
npx vercel link             # create/link the project (root = this frontend folder)
npx vercel env add NEXT_PUBLIC_API_BASE production    # value: https://<your DOMAIN>
npx vercel --prod           # deploy
```
Or do it in the Vercel dashboard: import **yogixt/rr-connect-sahayak**, set
**Root Directory = frontend**, add env var `NEXT_PUBLIC_API_BASE = https://<your DOMAIN>`,
deploy.

After you get the Vercel URL, put it in `.env.prod` as `FRONTEND_ORIGIN` on the VM and
re-run the `up -d` command so CORS allows it.

---

## Done
Open the Vercel URL — the bot talks to the Oracle backend, which serves the flow and the
pincode→ASM lookup from its own Postgres. Nothing depends on your laptop.

### Updating later
```bash
# on the VM
git pull && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
# frontend
cd frontend && npx vercel --prod
```
