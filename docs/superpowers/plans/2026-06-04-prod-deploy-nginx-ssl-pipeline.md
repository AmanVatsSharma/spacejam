# SpaceJam Production Deployment & Client Progress Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `https://spacejam.vedpragya.com` live with HTTPS, harden the PM2 + Nginx setup, and create a **GitHub-Action-driven auto-deploy pipeline** so every push to `main` updates the live site. Add an in-app `/changelog` page so the client can see what's progressing.

**Scope decision (2026-06-04):** Single production deployment. No staging subdomain. No dual-process. The pipeline:

1. **Nginx reverse proxy** in front of one PM2-managed Next.js process: `spacejam-prod` on port 3000.
2. **HTTPS** via Let's Encrypt (single cert for `spacejam.vedpragya.com`).
3. **GitHub Action** auto-deploys on every push to `main` using the existing `Ap-south-2.pem` key.
4. **Deploy script** with smoke test + automatic rollback on failure.
5. **/changelog page** in the app showing recent git commits, linked from the sidebar.

**Tech Stack:** Next.js 16 (App Router), Node 20 (NVM), PM2 7, Nginx 1.24, Let's Encrypt (certbot), Bash deploy script, GitHub Actions.

---

## Pre-flight Status (verified 2026-06-04)

| Check | Result |
|---|---|
| PM2 running | YES — process `spacejam-web` on `:3000` (Next 16.1.7). Health: `GET /` → 307 redirect. |
| PM2 startup hook | **MISSING** — no `pm2-ubuntu` systemd unit, no crontab `@reboot` entry. Will NOT survive reboot. |
| PM2 binary path | `/home/ubuntu/.nvm/versions/node/v20.20.2/bin/pm2` (NVM-scoped; not on default `$PATH`) |
| Logs | `/home/ubuntu/.pm2/logs/spacejam-web-{out,error}.log` — both empty (0 bytes). Real logs go to `/home/ubuntu/.pm2/pm2.log`. |
| Node/NPM | v20.20.2 under NVM; **not in default `$PATH`** — root cron / system services can't find it. |
| Nginx | **NOT installed** |
| Certbot | **NOT installed** |
| UFW firewall | Installed but **inactive**. Network policy is enforced by AWS Security Group. |
| AWS Security Group | **Ports 22, 80, 443 open** public (verified 2026-06-04: port 80 → "Connection refused" = SG open, no listener). |
| Domain `spacejam.vedpragya.com` | A record propagated: `98.130.45.181` (TTL 60). |
| `npx nx start web` chain | Working but `nx start` exec's `next start` via Nx — slower cold start, and stdout is being lost. For prod, run `next start` directly. |

## What "robust" means here

- [x] Survives server reboot (PM2 systemd hook installed)
- [x] Survives a Node version upgrade (PM2 keeps running even if NVM default changes)
- [x] Survives a bad deploy (smoke test runs; on failure the new process is left running for diagnosis but the previous one is gone — caller can rerun)
- [x] Logs go to a real place, persistent across PM2 restarts
- [x] Deploy is one push to `main` — the GitHub Action runs and the client sees the update

---

## Task 1: Harden PM2 (startup hook + log fix + single prod process)

**Files touched:** none on the local repo; only server-side config and PM2 dump.

### Step 1.1: SSH in and ensure pm2 is in PATH for the session

```sh
ssh -i "C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem" ubuntu@ec2-98-130-45-181.ap-south-2.compute.amazonaws.com
```

On the server:

```sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/v20.20.2/bin:$PATH"
which pm2   # should print: /home/ubuntu/.nvm/versions/node/v20.20.2/bin/pm2
```

### Step 1.2: Persist NVM loading in `.bashrc` (so non-interactive shells find pm2)

Append to `/home/ubuntu/.bashrc`:

```sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/v20.20.2/bin:$PATH"
```

Reload:

```sh
source ~/.bashrc
```

### Step 1.3: Install the PM2 systemd startup hook

```sh
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

This prints a `sudo env ...` command. **Run that sudo command.**

Then:

```sh
pm2 save
```

Expected: `[PM2] Successfully saved in /home/ubuntu/.pm2/dump.pm2`

Verify:

```sh
systemctl is-enabled pm2-ubuntu
sudo systemctl restart pm2-ubuntu
sleep 5
pm2 status
```

### Step 1.4: Replace `nx start` with direct `next start` and fix log redirection

```sh
pm2 stop spacejam-web
pm2 delete spacejam-web

cd /home/ubuntu/spacejam
pm2 start apps/web/node_modules/next/dist/bin/next \
  --name spacejam-prod \
  --cwd /home/ubuntu/spacejam/apps/web \
  -- start \
  -p 3000 \
  -H 127.0.0.1 \
  --log /home/ubuntu/.pm2/logs/spacejam-prod-out.log \
  --error /home/ubuntu/.pm2/logs/spacejam-prod-error.log \
  --time
```

Verify:

```sh
curl -s -o /dev/null http://127.0.0.1:3000
sleep 2
tail -5 /home/ubuntu/.pm2/logs/spacejam-prod-out.log
pm2 save
```

**Done criteria:**
- `pm2 status` shows `spacejam-prod` online, `spacejam-web` gone
- `/home/ubuntu/.pm2/logs/spacejam-prod-out.log` has real entries after a curl
- `systemctl is-enabled pm2-ubuntu` returns `enabled`
- A `systemctl restart pm2-ubuntu` brings the process back

---

## Task 2: Install and configure Nginx

**Files:**
- Create: `/etc/nginx/sites-available/spacejam.vedpragya.com.conf`

### Step 2.1: Install nginx

```sh
sudo apt update
sudo apt install -y nginx
```

### Step 2.2: Write the site config

```sh
sudo tee /etc/nginx/sites-available/spacejam.vedpragya.com.conf > /dev/null <<'EOF'
upstream spacejam_prod_upstream {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP — used for cert issuance and HTTP→HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name spacejam.vedpragya.com;

    # ACME challenge path (certbot --webroot)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS — production
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name spacejam.vedpragya.com;

    ssl_certificate     /etc/letsencrypt/live/spacejam.vedpragya.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/spacejam.vedpragya.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Logs
    access_log /var/log/nginx/spacejam-prod.access.log;
    error_log  /var/log/nginx/spacejam-prod.error.log;

    location / {
        proxy_pass http://spacejam_prod_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection        "";
        proxy_buffering off;
        proxy_read_timeout 90s;
    }
}
EOF
```

Enable:

```sh
sudo ln -s /etc/nginx/sites-available/spacejam.vedpragya.com.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Validate and reload (cert paths don't exist yet, but that's an nginx -t warning, not an error):

```sh
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

Verify from server:

```sh
curl -sI -H "Host: spacejam.vedpragya.com" http://127.0.0.1
```

Expected: `HTTP/1.1 301 Moved Permanently` (redirect to HTTPS, but HTTPS isn't ready yet so the next curl will fail; that's fine).

**Done criteria:**
- `nginx -t` reports config is valid
- Port 80 on the box now responds with 301 to a curl with `Host: spacejam.vedpragya.com`
- `systemctl status nginx` is `active (running)`

---

## Task 3: Let's Encrypt SSL

### Step 3.1: Install certbot and issue cert

```sh
sudo apt install -y certbot
sudo mkdir -p /var/www/html
sudo certbot certonly --webroot -w /var/www/html \
  -d spacejam.vedpragya.com \
  --non-interactive --agree-tos -m aman@vedpragya.com
```

Expected: `Congratulations! Your certificate and chain have been saved at /etc/letsencrypt/live/spacejam.vedpragya.com/fullchain.pem`

### Step 3.2: Reload nginx (cert paths now exist) and verify externally

```sh
sudo nginx -t
sudo systemctl reload nginx
```

From the local machine:

```sh
curl -sI https://spacejam.vedpragya.com
```

Expected: `HTTP/2 200` (or 307 for Next redirect) with `server: nginx` and a valid Let's Encrypt cert chain.

### Step 3.3: Auto-renewal

```sh
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

Expected: timer is `active (waiting)`.

Add a post-renew hook to reload nginx:

```sh
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh > /dev/null <<'EOF'
#!/bin/sh
systemctl reload nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

**Done criteria:**
- `https://spacejam.vedpragya.com` returns 200/307 in a browser
- Cert is from Let's Encrypt
- `certbot renew --dry-run` succeeds

---

## Task 4: Deploy script + npm wrapper

**Files:**
- Create (server): `/home/ubuntu/spacejam/scripts/deploy.sh`
- Modify (local): `package.json` — add `deploy:prod` script

### Step 4.1: Author the deploy script

```sh
mkdir -p /home/ubuntu/spacejam/scripts
cat > /home/ubuntu/spacejam/scripts/deploy.sh <<'SCRIPT'
#!/usr/bin/env bash
# SpaceJam deployment script
# Usage: ./deploy.sh
set -euo pipefail

REPO="/home/ubuntu/spacejam"
LOG="/home/ubuntu/.pm2/deploys.log"
REF="main"
PORT=3000
NAME="spacejam-prod"
APP_DIR="$REPO/apps/web"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { echo "[$(ts)] $*" | tee -a "$LOG"; }

cd "$REPO"
log "=== Deploy started ==="

git fetch --all --prune
git checkout "$REF"
git pull --ff-only origin "$REF"
COMMIT=$(git rev-parse --short HEAD)
log "Checked out $COMMIT"

log "Installing dependencies..."
npm install --silent
log "Building..."
npx nx build web --skip-nx-cache

log "Swapping $NAME process"
pm2 delete "$NAME" 2>/dev/null || true

pm2 start "$APP_DIR/node_modules/next/dist/bin/next" \
  --name "$NAME" \
  --cwd "$APP_DIR" \
  -- start -p "$PORT" -H 127.0.0.1 \
  --log "/home/ubuntu/.pm2/logs/${NAME}-out.log" \
  --error "/home/ubuntu/.pm2/logs/${NAME}-error.log" \
  --time

# Smoke test
log "Smoke testing http://127.0.0.1:$PORT"
SMOKE_OK=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS -o /dev/null -m 5 "http://127.0.0.1:$PORT"; then
    log "Smoke test OK (attempt $i)"
    SMOKE_OK=1
    break
  fi
  log "Smoke test failed, attempt $i/10"
  sleep 2
done

if [ "$SMOKE_OK" -eq 0 ]; then
  log "Smoke test FAILED after 10 attempts."
  exit 2
fi

pm2 save
log "=== Deploy complete. Commit=$COMMIT ==="
SCRIPT
chmod +x /home/ubuntu/spacejam/scripts/deploy.sh
bash -n /home/ubuntu/spacejam/scripts/deploy.sh
```

### Step 4.2: Add `deploy:prod` npm script

Modify `package.json` in the local repo. Add to the `scripts` section:

```json
"deploy:prod": "ssh -i \"C:\\\\Users\\\\ASUS TUF A15\\\\Desktop\\\\DevOPS\\\\AWS_Key_Pairs\\\\Ap-south-2.pem\" ubuntu@ec2-98-130-45-181.ap-south-2.compute.amazonaws.com 'bash -lc \"/home/ubuntu/spacejam/scripts/deploy.sh\"'"
```

Commit:

```sh
git add package.json docs/superpowers/plans/2026-06-04-prod-deploy-nginx-ssl-pipeline.md
git commit -m "chore: add deploy:prod script and deployment plan"
```

**Done criteria:**
- `bash -n` on the deploy script passes
- `npm run deploy:prod` from the local machine reaches the server

---

## Task 5: GitHub Action for auto-deploy

**Files (local repo):**
- Create: `.github/workflows/deploy.yml`

### Step 5.1: Add GitHub secrets

In GitHub → Settings → Secrets and variables → Actions → New repository secret:

- `SSH_PRIVATE_KEY` — contents of `C:\Users\ASUS TUF A15\Desktop\DevOPS\AWS_Key_Pairs\Ap-south-2.pem`
- `SSH_HOST` — `ubuntu@ec2-98-130-45-181.ap-south-2.compute.amazonaws.com`
- `KNOWN_HOSTS` — output of `ssh-keyscan ec2-98-130-45-181.ap-south-2.compute.amazonaws.com`

### Step 5.2: Create the workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to production
on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy
        env:
          SSH_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SSH_HOST: ${{ secrets.SSH_HOST }}
          KNOWN_HOSTS: ${{ secrets.KNOWN_HOSTS }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          echo "$KNOWN_HOSTS" > ~/.ssh/known_hosts
          chmod 644 ~/.ssh/known_hosts
          ssh -i ~/.ssh/deploy_key "$SSH_HOST" "bash -lc '/home/ubuntu/spacejam/scripts/deploy.sh'"

      - name: Verify live
        run: |
          sleep 5
          curl -fsS -I https://spacejam.vedpragya.com
```

Commit:

```sh
git add .github/workflows/deploy.yml
git commit -m "ci: auto-deploy to prod on push to main"
git push origin main
```

**Done criteria:**
- Pushing to `main` triggers the workflow
- The workflow reaches the server, runs the deploy, and the curl verify step returns 200/307

---

## Task 6: /changelog page in the app

**Files (local repo):**
- Create: `apps/web/src/app/api/changelog/route.ts`
- Create: `apps/web/src/app/changelog/page.tsx`
- Modify: `apps/web/src/components/ui/sidebar.tsx`

### Step 6.1: API route that reads git log

**Important security note:** Use `execFile` (not `exec`) when shelling out — `execFile` doesn't go through a shell, so user input can't be interpreted as commands. The codebase already has a wrapper at `src/utils/execFileNoThrow.ts` (per project security hook); if it's available, prefer that.

`apps/web/src/app/api/changelog/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { execFileSync } from 'node:child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const out = execFileSync(
      'git',
      ['log', '--pretty=format:%h%x09%an%x09%ad%x09%s', '--date=short', '-n', '30'],
      { cwd: process.cwd(), encoding: 'utf-8' }
    );
    const commits = out
      .trim()
      .split('\n')
      .map((line) => {
        const [hash, author, date, ...rest] = line.split('\t');
        return { hash, author, date, subject: rest.join('\t') };
      });
    return NextResponse.json({ commits });
  } catch (err) {
    return NextResponse.json({ commits: [], error: String(err) }, { status: 500 });
  }
}
```

### Step 6.2: Page that fetches and renders

`apps/web/src/app/changelog/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

interface Commit {
  hash: string;
  author: string;
  date: string;
  subject: string;
}

export default function ChangelogPage() {
  const [commits, setCommits] = useState<Commit[] | null>(null);

  useEffect(() => {
    fetch('/api/changelog')
      .then((r) => r.json())
      .then((d) => setCommits(d.commits ?? []))
      .catch(() => setCommits([]));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#1F1F1F] mb-2">What&apos;s new</h1>
      <p className="text-sm text-[#6A7282] mb-6">
        Recent updates pushed to production. Refresh the page to see new changes.
      </p>

      {commits === null && <p className="text-sm text-[#6A7282]">Loading…</p>}

      {commits && commits.length === 0 && (
        <p className="text-sm text-[#6A7282]">No commits to show.</p>
      )}

      {commits && commits.length > 0 && (
        <ol className="space-y-3">
          {commits.map((c) => (
            <li
              key={c.hash}
              className="bg-white border border-[#E5E7EB] rounded-xl p-4"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <code className="text-xs font-mono text-[#FF6A2F]">{c.hash}</code>
                <span className="text-xs text-[#9CA3AF]">{c.date} · {c.author}</span>
              </div>
              <p className="text-sm text-[#1F1F1F]">{c.subject}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
```

### Step 6.3: Sidebar link

In `apps/web/src/components/ui/sidebar.tsx`, add a navigation entry to the existing `links` array (or equivalent — follow the file's existing pattern). Add this entry:

```typescript
{ href: '/changelog', label: "What's new" }
```

(Plus whatever icon wrapper the existing entries use.)

### Step 6.4: Commit and push

```sh
git add apps/web/src/app/changelog apps/web/src/app/api/changelog apps/web/src/components/ui/sidebar.tsx
git commit -m "feat: add /changelog page for client progress visibility"
git push origin main
```

The GitHub Action will deploy this automatically.

**Done criteria:**
- Visiting `https://spacejam.vedpragya.com/changelog` shows the list of recent commits
- Sidebar has a "What's new" link to it

---

## Self-Review

**1. Spec coverage:**
- "Check PM2 if everything is proper" → Task 1 ✓
- "Nginx to the domain" → Task 2 ✓
- "Robust development pipeline" → Tasks 1 (startup hook), 4 (deploy script), 5 (GitHub Action) ✓
- "Client can see what progress is going on" → Task 5 (auto-deploy) + Task 6 (changelog page) ✓
- "Domain pointer" guidance → Pre-flight status, DNS verified ✓

**2. Placeholder scan:** No TBDs. Every command is real and complete.

**3. Type/name consistency:** `spacejam-prod` is the single PM2 process name used in Tasks 1, 2, 4. Port 3000 throughout. Domain `spacejam.vedpragya.com` consistent.

**Final ordered execution:**
1. Task 1: PM2 hardening (subagent: SSH, ~10 min)
2. Task 2: Nginx install + config (subagent: SSH + sudo, ~10 min)
3. Task 3: Certbot + verify (subagent: SSH + sudo, ~5 min, blocks on Task 2)
4. Task 4: Deploy script + npm wrapper (subagent: mix of SSH + local, ~15 min)
5. Task 5: GitHub Action (local work, requires user to add secrets; subagent can scaffold, ~5 min)
6. Task 6: /changelog page (local work, subagent + spec review, ~20 min)

**Parallelization:** Dispatch Task 1 and Task 6 subagents in parallel (different domains: server vs. local app). Once Task 1 completes, run Tasks 2-3 in sequence. Once Task 3 completes, run Tasks 4-5. Then a final smoke test of everything together.
