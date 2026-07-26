#!/bin/bash
set -euo pipefail

exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "===== TaskFlow EC2 Bootstrap Started ====="
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

export DEBIAN_FRONTEND=noninteractive

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root." >&2
  exit 1
fi

# ─── System Updates ──────────────────────────────────────────────────────────
echo "[1/9] Updating system packages..."
apt-get update -y
apt-get upgrade -y

# ─── Install Required Packages ──────────────────────────────────────────────
echo "[2/9] Installing packages..."
apt-get install -y \
  git \
  curl \
  unzip \
  nginx \
  postgresql \
  postgresql-contrib \
  build-essential \
  jq

# AWS-CLI v2 Install
cd ~
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
# Unzip and run the aws-cli installer
unzip -q awscliv2.zip
./aws/install
# Cleanup the installtion files
rm -rf awscliv2.zip ./aws


# Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

npm install -g pm2

# ─── Enable Services ────────────────────────────────────────────────────────
echo "[3/9] Enabling services..."
systemctl enable --now nginx
systemctl enable --now postgresql

# ─── Fetch Configuration from SSM Parameter Store ───────────────────────────
echo "[4/9] Fetching configuration from SSM Parameter Store..."

# Get instance region from metadata (IMDSv2)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/placement/region)

# Use the Elastic IP injected by CDK user data (exported before this script runs)
# Falls back to instance metadata if TASKFLOW_EIP is not set
PUBLIC_IP="${TASKFLOW_EIP:-$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/public-ipv4)}"

echo "  Region:    $REGION"
echo "  Public IP: $PUBLIC_IP"

DB_NAME=$(aws ssm get-parameter --name "/taskflow/db/name" \
  --region "$REGION" --query "Parameter.Value" --output text)

DB_USER=$(aws ssm get-parameter --name "/taskflow/db/user" \
  --region "$REGION" --query "Parameter.Value" --output text)

DB_PASSWORD=$(aws ssm get-parameter --name "/taskflow/db/password" \
  --region "$REGION" --query "Parameter.Value" --output text)

JWT_SECRET=$(aws ssm get-parameter --name "/taskflow/jwt/secret" \
  --region "$REGION" --query "Parameter.Value" --output text)

echo "  SSM parameters fetched successfully."

# ─── PostgreSQL Setup ────────────────────────────────────────────────────────
echo "[5/9] Configuring PostgreSQL..."
sudo -u postgres psql <<EOSQL
-- Create database (ignore error if already exists)
SELECT 'CREATE DATABASE ${DB_NAME}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Create user (ignore error if already exists)
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOSQL

# Grant schema permissions (must connect to the target database)
sudo -u postgres psql -d "${DB_NAME}" <<EOSQL
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT CREATE ON SCHEMA public TO ${DB_USER};
GRANT USAGE ON SCHEMA public TO ${DB_USER};
ALTER SCHEMA public OWNER TO ${DB_USER};
EOSQL

echo "  PostgreSQL configured: database='${DB_NAME}' user='${DB_USER}'"

# ─── Clone Repository ───────────────────────────────────────────────────────
echo "[6/9] Cloning repository..."
PROJECT_DIR="/home/ubuntu/projects/TaskFlow"
REPO_URL="https://github.com/vishalkumar12323/TaskFlow.git"

mkdir -p /home/ubuntu/projects
chown -R ubuntu:ubuntu /home/ubuntu/projects

if [ ! -d "$PROJECT_DIR/.git" ]; then
  sudo -u ubuntu git clone "$REPO_URL" "$PROJECT_DIR"
else
  echo "  Repository already cloned, pulling latest..."
  cd "$PROJECT_DIR"
  sudo -u ubuntu git pull --ff-only || true
fi

chown -R ubuntu:ubuntu "$PROJECT_DIR"

# ─── Backend Setup ───────────────────────────────────────────────────────────
echo "[7/9] Setting up backend..."
cd "$PROJECT_DIR/backend"

# Write .env file with SSM-sourced credentials
cat > .env <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CLIENT_URL=http://${PUBLIC_IP}
EOF
chown ubuntu:ubuntu .env

# Install dependencies and build
sudo -u ubuntu npm install
sudo -u ubuntu npm run build

# Push database schema (drizzle-kit push creates tables from schema)
sudo -u ubuntu npx drizzle-kit push --force 2>/dev/null \
  || echo "y" | sudo -u ubuntu npx drizzle-kit push \
  || echo "  ⚠ drizzle-kit push failed — run manually: cd $PROJECT_DIR/backend && npm run db:push"

# Start backend with PM2
sudo -u ubuntu bash -c "cd $PROJECT_DIR/backend && pm2 start npm --name taskflow-api -- start"
sudo -u ubuntu pm2 save

echo "  Backend deployed and running on port 3001."

# ─── Frontend Setup ─────────────────────────────────────────────────────────
echo "[8/9] Setting up frontend..."
cd "$PROJECT_DIR/frontend"

# Use relative API URL — works regardless of IP since Nginx proxies /api/v1/
cat > .env <<EOF
VITE_API_BASE_URL=/api/v1
EOF
chown ubuntu:ubuntu .env

# Install dependencies and build
sudo -u ubuntu npm install
sudo -u ubuntu npm run build

# Deploy built files to Nginx web root
mkdir -p /var/www/taskflow
cp -r "$PROJECT_DIR/frontend/dist/"* /var/www/taskflow/

chown -R www-data:www-data /var/www/taskflow
find /var/www/taskflow -type d -exec chmod 755 {} \;
find /var/www/taskflow -type f -exec chmod 644 {} \;

echo "  Frontend built and deployed to /var/www/taskflow."

# ─── Nginx Configuration ────────────────────────────────────────────────────
echo "[9/9] Configuring Nginx..."
cat > /etc/nginx/sites-available/taskflow <<'NGINX_CONF'
server {
    listen 80;
    server_name _;

    root /var/www/taskflow;
    index index.html;

    # Frontend — serve React SPA (handles client-side routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend — reverse proxy API requests to Node.js
    location /api/v1/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONF

# Enable the site and remove default
ln -sf /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

echo "  Nginx configured as reverse proxy."

# ─── Firewall ────────────────────────────────────────────────────────────────
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "  UFW firewall enabled."

# ─── PM2 Startup on Boot ────────────────────────────────────────────────────
env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo -u ubuntu pm2 save

echo ""
echo "============================================"
echo "  ✅ TaskFlow Bootstrap Complete!"
echo "============================================"
echo "  Frontend: http://${PUBLIC_IP}"
echo "  Backend:  http://${PUBLIC_IP}/api/v1/health"
echo "  SSH:      ssh -i SSH-LOOKUP.pem ubuntu@${PUBLIC_IP}"
echo "============================================"
