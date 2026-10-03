#!/bin/bash
# =============================================================================
# SpaceJam deploy v2 for the SHARED server (145.223.22.72). Run as root:
#     bash -l /root/spacejam-deploy2.sh <stage> </dev/null
#
# Touches ONLY: /home/ubuntu/spacejam, the database "spacejam" (rebuilt aside as
# spacejam_new, then swapped in by RENAME), pm2 apps spacejam-api / spacejam-web
# (always by NAME) and our own nginx site file /etc/nginx/sites-available/spacejam.
# Never used: pm2 <anything> all, pm2 save/flush, systemctl restart, edits to
# nginx.conf / other sites, other databases or roles, the repo's legacy deploy.sh.
#
# Stages (run in this order; each is safe to re-run unless noted)
#   prepare   preflight, backups (code+builds+env+nginx, fresh DB dump), extract
#             new code (dev .env files excluded + restored), harden env files
#             (NODE_ENV=production, CORS/WEB_APP_URL, fresh JWT secrets, dev login
#             off), build the API. Running apps keep serving the OLD code.
#   db-build  create spacejam_new, restore the schema artifact as the app role,
#             copy the kept rows (users centers floors locations seats), verify
#             ownership / counts / FK integrity. Running apps are untouched.
#   web       stop spacejam-web, build it (old .next restored if the build fails).
#   switch    stop spacejam-api, swap DB names, start API then web, wait for both.
#   nginx     add client_max_body_size to OUR site file; nginx -t; reload.
#   verify    pm2 state, logs, schema/auth probes, pages, DB facts, neighbours.
#   finish    drop spacejam_old (the wiped data). Backups stay in /root/backups.
#   update    LATER code-only deploys: backup, extract, build API + web, restart by name.
#   rollback  swap the DBs back, restore code/builds/env from the backup.
# =============================================================================
set -uo pipefail

APP=/home/ubuntu/spacejam
ARCHIVE=${ARCHIVE:-/root/spacejam-deploy.tar.gz}
SCHEMA=${SCHEMA:-/root/final-schema.sql}
NGINX_SITE=/etc/nginx/sites-available/spacejam
STATE=/root/.spacejam-deploy-backup-dir
SITE_URL=https://admin.spacejam.in
KEEP_TABLES=(users centers floors locations seats)
STAGE=${1:-}

say() { printf '\n== %s ==\n' "$*"; }
ok()  { printf '  ok: %s\n' "$*"; }
die() { printf '\nABORT: %s\n' "$*" >&2; exit 1; }

# postgres superuser over the local socket — used ONLY against our own databases
PGSU()  { (cd /tmp && runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 "$@"); }
PGSUq() { PGSU -At "$@"; }

pm2_has() {
  pm2 jlist 2>/dev/null | NAME="$1" node -e '
    const l = JSON.parse(require("fs").readFileSync(0, "utf8"));
    process.exit(l.some((p) => p.name === process.env.NAME) ? 0 : 1);'
}

neighbours() {
  echo "pm2 apps that are not spacejam-* (name|status|pid|restarts):"
  pm2 jlist 2>/dev/null | node -e '
    const l = JSON.parse(require("fs").readFileSync(0, "utf8"));
    for (const p of l) if (!p.name.startsWith("spacejam-"))
      console.log([p.name, p.pm2_env.status, "pid=" + p.pid, "restarts=" + p.pm2_env.restart_time].join("|"));' | sort
  curl -sk -o /dev/null -w 'arbitary / -> %{http_code}\n' --resolve arbitary.vedpragya.com:443:127.0.0.1 https://arbitary.vedpragya.com/
}

wait_for_port() { # port seconds
  local port=$1 tries=$(( $2 / 2 )) code i
  for i in $(seq 1 "$tries"); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/" || true)
    [ "$code" != "000" ] && return 0
    sleep 2
  done
  return 1
}

port_free() { # port seconds
  local port=$1 tries=$(( $2 / 2 )) i
  for i in $(seq 1 "$tries"); do
    [ -z "$(ss -tlnH "sport = :$port" 2>/dev/null)" ] && return 0
    sleep 2
  done
  return 1
}

# set KEY=VALUE in a dotenv file (replace or append). The value is never printed.
setenv() { # file key value
  local f=$1 k=$2 v=$3
  [ -f "$f" ] || { : > "$f"; chmod 600 "$f"; }
  if grep -q -E "^${k}=" "$f"; then
    K="$k" V="$v" awk 'BEGIN { FS = OFS = "="; k = ENVIRON["K"]; v = ENVIRON["V"] } $1 == k { print k "=" v; next } { print }' "$f" > "$f.tmp.$$" \
      && cat "$f.tmp.$$" > "$f" && rm -f "$f.tmp.$$"
  else
    printf '%s=%s\n' "$k" "$v" >> "$f"
  fi
}
getenv() { grep -E "^$2=" "$1" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r'; }
db_exists() { [ "$(PGSUq -d postgres -c "select count(*) from pg_database where datname='$1'")" != 0 ]; }
current_bk() { cat "$STATE" 2>/dev/null; }

# ─────────────────────────────────────────────────────────────────────────────
stage_prepare() {
  say "preflight"
  [ "$(id -u)" = 0 ]                       || die "run as root"
  [ -f "$ARCHIVE" ] && [ -f "$SCHEMA" ]    || die "missing $ARCHIVE or $SCHEMA"
  pm2_has spacejam-api && pm2_has spacejam-web || die "pm2 apps spacejam-api / spacejam-web not found"
  [ "$(df --output=avail / | tail -1)" -gt 8000000 ] || die "less than 8 GB free on /"
  [ "$(PGSUq -d spacejam -c 'select 1')" = 1 ] || die "cannot reach database spacejam as postgres"
  for n in spacejam_new spacejam_old; do db_exists "$n" && die "database $n already exists — resolve that first"; done
  [ -s "$APP/.env" ] && [ -s "$APP/apps/api/.env" ] || die "expected env files missing under $APP"
  ok "preflight passed (PostgreSQL $(PGSUq -d postgres -c "select current_setting('server_version')"))"

  local TS BK f
  TS=$(date -u +%Y%m%dT%H%M%SZ); BK=/root/backups/spacejam-deploy-$TS
  mkdir -p "$BK/env" && chmod 700 /root/backups "$BK" "$BK/env"
  echo "$BK" > "$STATE"
  neighbours > "$BK/neighbours-before.txt"; cat "$BK/neighbours-before.txt"

  say "backup -> $BK"
  tar --exclude='spacejam/node_modules' --exclude='spacejam/apps/*/node_modules' -czf "$BK/app-before.tar.gz" -C /home/ubuntu spacejam || die "code backup failed"
  chmod 600 "$BK/app-before.tar.gz"
  for f in .env apps/api/.env apps/web/.env apps/web/.env.local; do
    [ -f "$APP/$f" ] && { mkdir -p "$BK/env/$(dirname "$f")"; cp -p "$APP/$f" "$BK/env/$f"; }
  done
  cp -p "$NGINX_SITE" "$BK/nginx-spacejam.before"
  (cd "$APP" && sha256sum package.json package-lock.json apps/api/package.json apps/web/package.json 2>/dev/null) > "$BK/pkg-hashes.txt"
  (cd /tmp && runuser -u postgres -- pg_dump -Fc -d spacejam) > "$BK/spacejam-db-before.dump" || die "pg_dump failed"
  chmod 600 "$BK/spacejam-db-before.dump"
  pg_restore -l "$BK/spacejam-db-before.dump" > "$BK/dump-toc.txt" 2>&1 || die "DB backup is not readable"
  ls -la "$BK" | sed 's/^/  /'
  ok "backup complete (code+builds+env, nginx file, verified DB dump)"

  say "extract new code (the archive ships dev .env files: excluded, then restored byte-for-byte)"
  tar -xzf "$ARCHIVE" -C "$APP" --no-same-owner \
      --exclude='.env' --exclude='.env.*' --exclude='*/.env' --exclude='*/.env.*' || die "extract failed (backup: $BK/app-before.tar.gz)"
  for f in .env apps/api/.env apps/web/.env apps/web/.env.local; do
    [ -f "$BK/env/$f" ] && cp -p "$BK/env/$f" "$APP/$f"
  done
  ok "env files restored"
  if (cd "$APP" && sha256sum -c --quiet "$BK/pkg-hashes.txt" >/dev/null 2>&1); then
    ok "dependency manifests unchanged — skipping npm install"
  else
    say "dependency manifests changed — npm install"
    (cd "$APP" && nice -n 19 npm install --no-audit --no-fund) || die "npm install failed"
  fi

  say "harden env (values are never printed)"
  local JWT RT
  if [ ! -f "$BK/.secrets-rotated" ]; then
    JWT=$(openssl rand -hex 48); RT=$(openssl rand -hex 48)
    for f in "$APP/.env" "$APP/apps/api/.env"; do
      setenv "$f" NODE_ENV production
      setenv "$f" CORS_ORIGIN "$SITE_URL"
      setenv "$f" FRONTEND_URL "$SITE_URL"
      setenv "$f" WEB_APP_URL "$SITE_URL"
      setenv "$f" JWT_SECRET "$JWT"
      setenv "$f" REFRESH_TOKEN_SECRET "$RT"
      chmod 600 "$f"
    done
    unset JWT RT
    touch "$BK/.secrets-rotated"
    ok "API env: NODE_ENV=production, CORS_ORIGIN/FRONTEND_URL/WEB_APP_URL set, JWT_SECRET + REFRESH_TOKEN_SECRET rotated (both $APP/.env and apps/api/.env)"
  else
    ok "env already hardened in this run"
  fi
  for f in "$APP/apps/web/.env" "$APP/apps/web/.env.local"; do [ -f "$f" ] && setenv "$f" NEXT_PUBLIC_ENABLE_DEV_LOGIN false; done
  ok "web env: NEXT_PUBLIC_ENABLE_DEV_LOGIN=false"
  grep -q -E '^OTP_DEV_BYPASS=true' "$APP/.env" "$APP/apps/api/.env" && die "OTP_DEV_BYPASS=true present — remove it"
  [ "$(getenv "$APP/.env" NODE_ENV)" = production ] || die "NODE_ENV not production in $APP/.env"
  # The API now refuses to start in production with a missing/short/placeholder JWT secret — fail HERE, not at the DB swap.
  for f in "$APP/.env" "$APP/apps/api/.env"; do
    [ "$(getenv "$f" JWT_SECRET | wc -c)" -gt 64 ] || die "JWT_SECRET missing or too short in $f after hardening"
  done

  say "build API (in place; the running process keeps its old bundle until restart)"
  (cd "$APP" && NX_DAEMON=false NX_NO_CLOUD=true NODE_OPTIONS=--max-old-space-size=2048 nice -n 19 npx nx build api) > "$BK/build-api.log" 2>&1 \
    || { tail -40 "$BK/build-api.log"; die "API build failed — old app still serving"; }
  [ -s "$APP/apps/api/dist/main.js" ] || die "apps/api/dist/main.js missing after build"
  ls -la "$APP/apps/api/dist/main.js" | sed 's/^/  /'
  ok "prepare finished. Next: db-build"
}

# ─────────────────────────────────────────────────────────────────────────────
stage_db_build() {
  local BK; BK=$(current_bk) || die "run prepare first"
  say "build spacejam_new aside (the live database is not touched)"
  db_exists spacejam_new && die "spacejam_new already exists — drop it first: runuser -u postgres -- psql -d postgres -c 'DROP DATABASE spacejam_new'"
  local ENC COL CTY
  ENC=$(PGSUq -d postgres -c "select pg_encoding_to_char(encoding) from pg_database where datname='spacejam'")
  COL=$(PGSUq -d postgres -c "select datcollate from pg_database where datname='spacejam'")
  CTY=$(PGSUq -d postgres -c "select datctype from pg_database where datname='spacejam'")
  PGSU -d postgres -c "CREATE DATABASE spacejam_new OWNER spacejam TEMPLATE template0 ENCODING '$ENC' LC_COLLATE '$COL' LC_CTYPE '$CTY'" || die "CREATE DATABASE failed"
  PGSU -d spacejam_new -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"' || die "extension failed"
  ok "created spacejam_new ($ENC, $COL), owner spacejam"

  say "restore the schema artifact AS THE APP ROLE (so everything is owned by it)"
  PGSU -d spacejam_new -q -c "SET ROLE spacejam" -f "$SCHEMA" > "$BK/schema-restore.log" 2>&1 \
    || { tail -15 "$BK/schema-restore.log"; die "schema restore failed — live DB untouched; drop spacejam_new and retry"; }
  local want got
  want=$(grep -c '^CREATE TABLE' "$SCHEMA"); got=$(PGSUq -d spacejam_new -c "select count(*) from pg_tables where schemaname='public'")
  [ "$want" = "$got" ] || die "table count mismatch: schema has $want, database has $got"
  ok "schema restored: $got tables"

  say "copy the kept rows (${KEEP_TABLES[*]}) from the live DB"
  local targs=() t
  for t in "${KEEP_TABLES[@]}"; do targs+=(-t "public.$t"); done
  { echo "SET session_replication_role = replica;"; (cd /tmp && runuser -u postgres -- pg_dump -d spacejam --data-only --column-inserts --no-owner --no-acl "${targs[@]}"); } \
    | PGSU -d spacejam_new -q > "$BK/data-restore.log" 2>&1 || { tail -15 "$BK/data-restore.log"; die "data copy failed — live DB untouched"; }
  for t in "${KEEP_TABLES[@]}"; do
    local a b
    a=$(PGSUq -d spacejam -c "select count(*) from $t"); b=$(PGSUq -d spacejam_new -c "select count(*) from $t")
    printf '  %-10s old=%s new=%s\n' "$t" "$a" "$b"
    [ "$a" = "$b" ] || die "row count mismatch in $t"
  done

  say "integrity: FK orphans among the kept rows, ownership, app-role access"
  PGSU -d spacejam_new -q -c "
    DO \$\$
    DECLARE r record; n bigint;
    BEGIN
      FOR r IN
        SELECT c.conrelid::regclass AS child, a.attname AS ccol, c.confrelid::regclass AS parent, pa.attname AS pcol, c.conname
          FROM pg_constraint c
          JOIN pg_attribute a  ON a.attrelid  = c.conrelid  AND a.attnum  = c.conkey[1]
          JOIN pg_attribute pa ON pa.attrelid = c.confrelid AND pa.attnum = c.confkey[1]
         WHERE c.contype = 'f' AND array_length(c.conkey, 1) = 1
           AND c.conrelid::regclass::text IN ('users','centers','floors','locations','seats')
      LOOP
        EXECUTE format('SELECT count(*) FROM %s ch WHERE ch.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %s p WHERE p.%I = ch.%I)', r.child, r.ccol, r.parent, r.pcol, r.ccol) INTO n;
        IF n > 0 THEN RAISE EXCEPTION 'orphan rows: %.% -> % (% rows, constraint %)', r.child, r.ccol, r.parent, n, r.conname; END IF;
      END LOOP;
    END \$\$;" || die "FK orphan check failed — live DB untouched"
  ok "no orphan rows"
  [ "$(PGSUq -d spacejam_new -c "select count(*) from pg_tables where schemaname='public' and tableowner <> 'spacejam'")" = 0 ] || die "tables not owned by spacejam"
  [ "$(PGSUq -d spacejam_new -c "select count(*) from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typtype='e' and pg_get_userbyid(t.typowner) <> 'spacejam'")" = 0 ] || die "enum types not owned by spacejam"
  ok "every table and enum is owned by the app role"
  PGSU -d spacejam_new -q -At -c "SET ROLE spacejam; select 'app role can read users='||count(*) from users; select 'app role can read app_settings='||count(*) from app_settings; select 'app role can read otp_requests='||count(*) from otp_requests;" || die "app role cannot read its tables"
  ok "db-build finished. Next: web"
}

# ─────────────────────────────────────────────────────────────────────────────
stage_web() {
  local BK; BK=$(current_bk) || die "run prepare first"
  say "web: stop (by name) so users never hit a half-written .next, then build"
  pm2 stop spacejam-web >/dev/null 2>&1 || true
  if ! port_free 3000 20; then
    local pid cwd; pid=$(ss -tlnpH "sport = :3000" | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2)
    cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null || true)
    case "$cwd" in
      /home/ubuntu/spacejam*) echo "  orphan next-server pid $pid (cwd $cwd) still holds :3000 — it is ours; stopping it"; kill "$pid"; sleep 3 ;;
      *) pm2 restart spacejam-web >/dev/null 2>&1; die "something not ours holds :3000 (pid ${pid:-?}, cwd ${cwd:-?}) — not touching it" ;;
    esac
    port_free 3000 10 || { pm2 restart spacejam-web >/dev/null 2>&1; die "port 3000 still busy"; }
  fi
  if (cd "$APP/apps/web" && NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=3072 nice -n 19 npx next build --webpack) > "$BK/build-web.log" 2>&1; then
    ok "web build succeeded"
  else
    tail -60 "$BK/build-web.log"
    echo "restoring the previous .next from the backup..."
    rm -rf "$APP/apps/web/.next"
    tar -xzf "$BK/app-before.tar.gz" -C /home/ubuntu spacejam/apps/web/.next
    pm2 restart spacejam-web >/dev/null 2>&1
    die "web build failed — previous web restored and restarted"
  fi
  ok "web is built but still STOPPED. Next: switch"
}

# ─────────────────────────────────────────────────────────────────────────────
stage_switch() {
  local BK; BK=$(current_bk) || die "run prepare first"
  db_exists spacejam_new || die "spacejam_new missing — run db-build first"
  db_exists spacejam_old && die "spacejam_old already exists — a previous switch happened; run verify/finish or rollback"
  say "stop the API (by name) and swap the databases"
  pm2 stop spacejam-api >/dev/null 2>&1 || true
  port_free 4000 20 || die "port 4000 still held after stopping spacejam-api — not swapping"
  PGSU -d postgres -q -At -c "SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE datname IN ('spacejam','spacejam_new') AND pid <> pg_backend_pid()" >/dev/null
  PGSU -d postgres -c "ALTER DATABASE spacejam RENAME TO spacejam_old" || { pm2 restart spacejam-api >/dev/null 2>&1; die "rename of the live DB failed — API restarted on the old DB"; }
  if ! PGSU -d postgres -c "ALTER DATABASE spacejam_new RENAME TO spacejam"; then
    PGSU -d postgres -c "ALTER DATABASE spacejam_old RENAME TO spacejam"; pm2 restart spacejam-api >/dev/null 2>&1
    die "rename of the new DB failed — swapped back, API restarted on the old DB"
  fi
  ok "databases swapped (old data kept as spacejam_old until finish)"

  say "start API, then web (by name)"
  pm2 restart spacejam-api >/dev/null 2>&1 || die "pm2 restart spacejam-api failed — run: rollback"
  if ! wait_for_port 4000 90; then
    pm2 logs spacejam-api --lines 60 --nostream 2>&1 | tail -60
    die "API did not answer on :4000 within 90s — run: rollback"
  fi
  ok "API answering on :4000"
  pm2 restart spacejam-web >/dev/null 2>&1 || die "pm2 restart spacejam-web failed — run: rollback"
  if ! wait_for_port 3000 90; then
    pm2 logs spacejam-web --lines 60 --nostream 2>&1 | tail -60
    die "web did not answer on :3000 within 90s — run: rollback"
  fi
  ok "web answering on :3000. Next: nginx, then verify"
}

# ─────────────────────────────────────────────────────────────────────────────
stage_nginx() {
  local BK; BK=$(current_bk) || die "run prepare first"
  if grep -q 'client_max_body_size' "$NGINX_SITE"; then ok "client_max_body_size already set in $NGINX_SITE"; return 0; fi
  say "nginx: raise the upload limit on OUR site only"
  neighbours > "$BK/neighbours-before-nginx.txt"
  cp -p "$NGINX_SITE" "$BK/nginx-spacejam.before-edit"
  awk '{ print } /^[[:space:]]*server_name[[:space:]]+admin\.spacejam\.in;/ { n++; if (n == 2) print "    client_max_body_size 20m;   # KYC / agreement uploads (nginx default is 1m)" }' "$NGINX_SITE" > "$NGINX_SITE.new" \
    && [ "$(grep -c client_max_body_size "$NGINX_SITE.new")" = 1 ] || { rm -f "$NGINX_SITE.new"; die "could not place the directive"; }
  mv "$NGINX_SITE.new" "$NGINX_SITE"
  if ! nginx -t > "$BK/nginx-test.log" 2>&1; then
    cat "$BK/nginx-test.log"; cp -p "$BK/nginx-spacejam.before-edit" "$NGINX_SITE"
    die "nginx -t failed — our site file was restored, nothing reloaded"
  fi
  systemctl reload nginx || { cp -p "$BK/nginx-spacejam.before-edit" "$NGINX_SITE"; nginx -t >/dev/null 2>&1 && systemctl reload nginx; die "reload failed — site file restored"; }
  sleep 2
  neighbours > "$BK/neighbours-after-nginx.txt"
  if diff "$BK/neighbours-before-nginx.txt" "$BK/neighbours-after-nginx.txt" >/dev/null; then ok "nginx reloaded; neighbours unchanged"; else diff "$BK/neighbours-before-nginx.txt" "$BK/neighbours-after-nginx.txt"; echo "  NEIGHBOUR DIFFERENCE ABOVE"; fi
}

# ─────────────────────────────────────────────────────────────────────────────
stage_verify() {
  local BK; BK=$(current_bk) || die "no backup recorded"
  local fail=0 out p
  say "pm2 (spacejam apps)"
  pm2 jlist 2>/dev/null | node -e '
    const l = JSON.parse(require("fs").readFileSync(0, "utf8"));
    for (const p of l) if (p.name.startsWith("spacejam-"))
      console.log([p.name, p.pm2_env.status, "pid=" + p.pid, "restarts=" + p.pm2_env.restart_time, "mem=" + Math.round(p.monit.memory / 1048576) + "MB"].join(" | "));'

  say "API log tail"
  pm2 logs spacejam-api --lines 25 --nostream --out 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -22 | cut -c1-190
  echo "-- error log lines since the restart (should be none) --"
  pm2 logs spacejam-api --lines 15 --nostream --err 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -8 | cut -c1-190

  say "GraphQL probes (unauthenticated)"
  probe() { # label body expect-regex
    out=$(curl -s -X POST http://127.0.0.1:4000/graphql -H 'content-type: application/json' --data "$2" | head -c 260)
    if echo "$out" | grep -q -i -E "$3"; then echo "  ok    $1 -> $(echo "$out" | cut -c1-110)"; else echo "  FAIL  $1: $out"; fail=1; fi
  }
  probe "introspection is OFF in production" '{"query":"{ __schema { queryType { name } } }"}' 'introspection|not allowed|forbidden|GRAPHQL_VALIDATION'
  probe "paymentConfig requires auth (field exists)" '{"query":"{ paymentConfig { configured bankConfigured chequeConfigured } }"}' 'unauthor|unauthenticated|forbidden'
  probe "submitOnboarding requires auth (field exists)" '{"query":"mutation { submitOnboarding(input: { idempotencyKey: \"probe-0000000000\", centerId: \"00000000-0000-0000-0000-000000000000\", contactName: \"Probe\", contactEmail: \"probe@example.com\", contactPhone: \"9999999999\", companyName: \"Probe Co\", planType: \"Hot Desk\", billingCycle: \"Monthly\", depositAmount: 0 }) { outcome } }"}' 'unauthor|unauthenticated|forbidden'

  say "pages through nginx (expected: / 307, /signin 200)"
  for p in / /signin /dashboard/crm/onboarding/pending /dashboard/settings/integrations; do
    curl -sk -o /dev/null -w "  $p -> %{http_code}\n" --resolve admin.spacejam.in:443:127.0.0.1 "$SITE_URL$p"
  done
  echo "-- upload endpoint accepts a >1MB body (limit raised)? expect 401 (auth), NOT 413 --"
  head -c 2500000 /dev/zero > /tmp/_probe_2_5mb.bin
  curl -sk -o /dev/null -w "  POST /api/print/upload 2.5MB -> %{http_code}\n" --resolve admin.spacejam.in:443:127.0.0.1 -F "file=@/tmp/_probe_2_5mb.bin;filename=probe.pdf" "$SITE_URL/api/print/upload"
  rm -f /tmp/_probe_2_5mb.bin

  say "database"
  echo "  current DB owner: $(PGSUq -d postgres -c "select pg_get_userbyid(datdba) from pg_database where datname='spacejam'")   tables: $(PGSUq -d spacejam -c "select count(*) from pg_tables where schemaname='public'")   non-owned: $(PGSUq -d spacejam -c "select count(*) from pg_tables where schemaname='public' and tableowner <> 'spacejam'")"
  echo "  kept rows: $(for t in "${KEEP_TABLES[@]}"; do printf '%s=%s ' "$t" "$(PGSUq -d spacejam -c "select count(*) from $t")"; done)"
  echo "  databases present: $(PGSUq -d postgres -c "select string_agg(datname, ', ' order by datname) from pg_database where not datistemplate")"

  say "env sanity (names/flags only)"
  echo "  NODE_ENV=$(getenv "$APP/.env" NODE_ENV)  CORS_ORIGIN=$(getenv "$APP/.env" CORS_ORIGIN)  WEB_APP_URL=$(getenv "$APP/.env" WEB_APP_URL)  JWT_SECRET length=$(getenv "$APP/.env" JWT_SECRET | wc -c)  OTP_DEV_BYPASS=$(getenv "$APP/.env" OTP_DEV_BYPASS)"
  echo "  web NEXT_PUBLIC_ENABLE_DEV_LOGIN: .env=$(getenv "$APP/apps/web/.env" NEXT_PUBLIC_ENABLE_DEV_LOGIN) .env.local=$(getenv "$APP/apps/web/.env.local" NEXT_PUBLIC_ENABLE_DEV_LOGIN)"

  say "neighbours vs the pre-deploy baseline (must be identical)"
  neighbours > "$BK/neighbours-after.txt"
  if diff "$BK/neighbours-before.txt" "$BK/neighbours-after.txt"; then ok "neighbours unchanged"; else echo "  DIFFERENCE ABOVE — investigate first"; fail=1; fi

  [ "$fail" = 0 ] && { echo; echo "VERIFY: all checks passed"; } || { echo; echo "VERIFY: problems found (see above)"; return 1; }
}

# ─────────────────────────────────────────────────────────────────────────────
stage_finish() {
  db_exists spacejam_old || { ok "spacejam_old is already gone"; return 0; }
  say "drop spacejam_old (the wiped data; a verified dump stays in $(current_bk))"
  PGSU -d postgres -c "DROP DATABASE spacejam_old" || die "drop failed"
  ok "dropped. databases now: $(PGSUq -d postgres -c "select string_agg(datname, ', ' order by datname) from pg_database where not datistemplate")"
}

# Later, CODE-ONLY deploys (no DB swap, no env rotation, no nginx): backup → extract → build API → build web →
# restart both by name. Use this after the first full deploy. Rollback restores the code backup this stage takes.
stage_update() {
  say "preflight"
  [ "$(id -u)" = 0 ]                       || die "run as root"
  [ -f "$ARCHIVE" ]                        || die "missing $ARCHIVE"
  pm2_has spacejam-api && pm2_has spacejam-web || die "pm2 apps spacejam-api / spacejam-web not found"
  [ "$(df --output=avail / | tail -1)" -gt 8000000 ] || die "less than 8 GB free on /"
  [ "$(getenv "$APP/.env" NODE_ENV)" = production ] || die "NODE_ENV is not production in $APP/.env — run the full deploy (prepare ... verify) first"
  local TS BK f
  TS=$(date -u +%Y%m%dT%H%M%SZ); BK=/root/backups/spacejam-update-$TS
  mkdir -p "$BK/env" && chmod 700 /root/backups "$BK" "$BK/env"
  echo "$BK" > "$STATE"
  neighbours > "$BK/neighbours-before.txt"; cat "$BK/neighbours-before.txt"

  say "backup -> $BK (code + builds + env)"
  tar --exclude='spacejam/node_modules' --exclude='spacejam/apps/*/node_modules' -czf "$BK/app-before.tar.gz" -C /home/ubuntu spacejam || die "code backup failed"
  chmod 600 "$BK/app-before.tar.gz"
  for f in .env apps/api/.env apps/web/.env apps/web/.env.local; do
    [ -f "$APP/$f" ] && { mkdir -p "$BK/env/$(dirname "$f")"; cp -p "$APP/$f" "$BK/env/$f"; }
  done
  (cd "$APP" && sha256sum package.json package-lock.json apps/api/package.json apps/web/package.json 2>/dev/null) > "$BK/pkg-hashes.txt"

  say "extract (env files excluded, then restored byte-for-byte)"
  tar -xzf "$ARCHIVE" -C "$APP" --no-same-owner \
      --exclude='.env' --exclude='.env.*' --exclude='*/.env' --exclude='*/.env.*' || die "extract failed (backup: $BK/app-before.tar.gz)"
  for f in .env apps/api/.env apps/web/.env apps/web/.env.local; do
    [ -f "$BK/env/$f" ] && cp -p "$BK/env/$f" "$APP/$f"
  done
  if ! (cd "$APP" && sha256sum -c --quiet "$BK/pkg-hashes.txt" >/dev/null 2>&1); then
    say "dependency manifests changed — npm install"
    (cd "$APP" && nice -n 19 npm install --no-audit --no-fund) || die "npm install failed"
  fi

  say "build API (the running process keeps its old bundle until restart)"
  (cd "$APP" && NX_DAEMON=false NX_NO_CLOUD=true NODE_OPTIONS=--max-old-space-size=2048 nice -n 19 npx nx build api) > "$BK/build-api.log" 2>&1 \
    || { tail -40 "$BK/build-api.log"; die "API build failed — old app still serving"; }
  [ -s "$APP/apps/api/dist/main.js" ] || die "apps/api/dist/main.js missing after build"
  ok "API built"

  stage_web            # stops spacejam-web, builds it (restores the old .next if the build fails)

  say "restart by name: API, then web"
  pm2 restart spacejam-api >/dev/null 2>&1 || die "pm2 restart spacejam-api failed — run: rollback"
  wait_for_port 4000 90 || { pm2 logs spacejam-api --lines 60 --nostream 2>&1 | tail -60; die "API did not answer on :4000 — run: rollback"; }
  ok "API answering"
  pm2 restart spacejam-web >/dev/null 2>&1 || die "pm2 restart spacejam-web failed — run: rollback"
  wait_for_port 3000 90 || { pm2 logs spacejam-web --lines 60 --nostream 2>&1 | tail -60; die "web did not answer on :3000 — run: rollback"; }
  ok "web answering. Next: verify"
}

stage_rollback() {
  local BK; BK=$(current_bk) || die "no backup recorded"
  [ -f "$BK/app-before.tar.gz" ] || die "backup archive missing in $BK"
  say "ROLLBACK to the pre-deploy state ($BK)"
  pm2 stop spacejam-api >/dev/null 2>&1 || true
  pm2 stop spacejam-web >/dev/null 2>&1 || true
  if db_exists spacejam_old; then
    PGSU -d postgres -q -At -c "SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE datname IN ('spacejam','spacejam_old') AND pid <> pg_backend_pid()" >/dev/null
    PGSU -d postgres -c "ALTER DATABASE spacejam RENAME TO spacejam_failed" -c "ALTER DATABASE spacejam_old RENAME TO spacejam" || die "DB swap-back failed — fix by hand (databases: spacejam, spacejam_old)"
    ok "old database restored as spacejam; the new one is kept as spacejam_failed for inspection"
  fi
  tar -xzf "$BK/app-before.tar.gz" -C /home/ubuntu
  [ -f "$BK/nginx-spacejam.before" ] && ! cmp -s "$BK/nginx-spacejam.before" "$NGINX_SITE" && { cp -p "$BK/nginx-spacejam.before" "$NGINX_SITE"; nginx -t >/dev/null 2>&1 && systemctl reload nginx && ok "nginx site file restored"; }
  pm2 restart spacejam-api >/dev/null 2>&1 || die "restart spacejam-api failed"
  pm2 restart spacejam-web >/dev/null 2>&1 || die "restart spacejam-web failed"
  wait_for_port 4000 90 && ok "API answering" || echo "  API NOT answering — check pm2 logs spacejam-api"
  wait_for_port 3000 90 && ok "web answering" || echo "  web NOT answering — check pm2 logs spacejam-web"
}

case "$STAGE" in
  prepare)   stage_prepare ;;
  db-build)  stage_db_build ;;
  web)       stage_web ;;
  switch)    stage_switch ;;
  nginx)     stage_nginx ;;
  verify)    stage_verify ;;
  finish)    stage_finish ;;
  update)    stage_update ;;
  rollback)  stage_rollback ;;
  *) echo "usage: bash -l $0 <prepare|db-build|web|switch|nginx|verify|finish|update|rollback>" >&2; exit 2 ;;
esac
