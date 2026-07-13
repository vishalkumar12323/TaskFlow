#!/bin/bash
set -euxo pipefail

exec >>(tee /var/log/user-data.log)
exec 2>&1

echo "===== TaskFlow EC2 Bootstrap Started ====="

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get upgrade -y


########################################
# Install packages
########################################

apt-get install -y \
    git \
    curl \
    unzip \
    nginx \
    postgresql \
    postgresql-contrib \
    build-essential

########################################
# Install Node.js 22
########################################

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -

apt-get install -y nodejs

########################################
# Install PM2
########################################
npm install -g pm2


########################################
# Enable Services
########################################

systemctl enable nginx
systemctl enable postgresql

########################################
# Create Project directory
########################################

mkdir -p /home/ubuntu/projects
cd /home/ubuntu/projects

########################################
# Clone Repository
########################################
git clone https://github.com/vishalkumar12323/TaskFlow.git

chown -R ubuntu:ubuntu /home/ubuntu/projects

########################################
# install backend dependenies
########################################

cd /home/ubunut/projects/Taskflow/backend

npm install

########################################
# Install frontend dependencies
########################################

cd ../frontend
npm install

echo ""
echo "============================"
echo "Bootstrap completed successfully."
echo "============================"

