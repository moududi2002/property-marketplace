#!/usr/bin/env bash
# 📍 /infrastructure/scripts/setup-server.sh
#
# One-time setup for a fresh Ubuntu 22.04 VPS.
# Run as:  sudo bash infrastructure/scripts/setup-server.sh
#
# Installs: Node 22, pnpm, PM2, PostgreSQL 16, Redis 7, Nginx, Certbot,
#           Docker (for MinIO if used), fail2ban, UFW firewall.

set -euo pipefail

echo "🔄 Updating system packages…"
apt-get update && apt-get upgrade -y

echo "📦 Installing base dependencies…"
apt-get install -y \
  curl wget git build-essential unzip gnupg ca-certificates lsb-release \
  software-properties-common ufw fail2ban htop

# ─── Node.js 22 LTS ────────────────────────────────────────
echo "🟢 Installing Node.js 22 LTS…"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# ─── pnpm ─────────────────────────────────────────────────
echo "📦 Installing pnpm…"
corepack enable
corepack prepare pnpm@9.12.0 --activate

# ─── PM2 ──────────────────────────────────────────────────
echo "⚙️  Installing PM2…"
npm install -g pm2

# ─── PostgreSQL 16 ────────────────────────────────────────
echo "🐘 Installing PostgreSQL 16…"
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt-get update
apt-get install -y postgresql-16 postgresql-client-16

# ─── Redis 7 ──────────────────────────────────────────────
echo "🔴 Installing Redis…"
apt-get install -y redis-server

# ─── Nginx + Certbot ──────────────────────────────────────
echo "🌐 Installing Nginx + Certbot…"
apt-get install -y nginx certbot python3-certbot-nginx

# ─── Docker (for MinIO only; optional) ────────────────────
echo "🐳 Installing Docker (for MinIO)…"
curl -fsSL https://get.docker.com | sh
usermod -aG docker "${SUDO_USER:-$USER}" || true

# ─── UFW Firewall ─────────────────────────────────────────
echo "🛡️  Configuring UFW…"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ─── Fail2Ban ─────────────────────────────────────────────
echo "🛡️  Configuring Fail2Ban…"
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
EOF
systemctl restart fail2ban

# ─── System tuning ────────────────────────────────────────
echo "⚡ Applying kernel tuning…"
cat >> /etc/sysctl.conf <<'EOF'
# Networking — better throughput for Node.js
net.core.somaxconn = 4096
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65000
vm.swappiness = 10
EOF
sysctl -p

echo ""
echo "✅ Server base setup complete."
echo ""
echo "Next:"
echo "  1. Create the app user:        adduser deploy"
echo "  2. Add to sudo:                usermod -aG sudo deploy"
echo "  3. Switch:                     su - deploy"
echo "  4. Clone project & continue with DEPLOYMENT.md"