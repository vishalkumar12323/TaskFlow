#!/bin/bash
set -euo pipefail

exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "===== TaskFlow EC2 Bootstrap Started ====="

export DEBIAN_FRONTEND=noninteractive

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root." >&2
  exit 1
fi

apt-get update -y
apt-get upgrade -y

apt-get install -y \
  git \
  curl \
  unzip \
  nginx \
  postgresql \
  postgresql-contrib \
  build-essential

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

npm install -g pm2

systemctl enable --now nginx
systemctl enable --now postgresql

PROJECT_DIR="/home/ubuntu/projects/TaskFlow"
REPO_URL="https://github.com/vishalkumar12323/TaskFlow.git"

mkdir -p /home/ubuntu/projects
chown -R ubuntu:ubuntu /home/ubuntu/projects

if [ ! -d "$PROJECT_DIR/.git" ]; then
  git clone "$REPO_URL" "$PROJECT_DIR"
fi

chown -R ubuntu:ubuntu "$PROJECT_DIR"

cd "$PROJECT_DIR/backend"
npm install

cd "$PROJECT_DIR/frontend"
npm install

echo ""
echo "============================"
echo "Bootstrap completed successfully."
echo "============================"