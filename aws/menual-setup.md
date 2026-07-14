## Architecture
 
                    Internet
                        │
                Route53 (Optional)
                        │
                 Elastic IP (EC2)
                        │
                Ubuntu EC2 Instance
                        │
         ┌──────────────┴──────────────┐
         │                             │
     Nginx Reverse Proxy               │
         │                             │
 ┌───────┴────────┐                    │
 │                │                    │
 │                │                    │
Frontend          Backend              PostgreSQL
React Build       Node.js              PostgreSQL
Port 80           Port 5000            Port 5432          


## AWS Services
    EC2            ------------------ Host frontend and backend
    Security Group ------------------ Open ports
    Elastic IP     ------------------ Static IP
    IAM roles      ------------------ Secure AWS permissions
    CloudWatch     ------------------ For logs
    Route53        ------------------ Domain (Optional)

## EC2 Configuration
    | Image        |   Ubuntu 24.04 LTS |
    | InstanceType |   t3.small 2GB Ram, 64Bit (x86) |
    | Storage      |   20GB gp3 SSD     |


## Security Groups
    | Port         |   Protocole        |
    -------------------------------------
    | 22           |   SSH              |
    | 80           |   HTTP             |
    | 443          |   HTTPS            |


## Machine Configs and Required Software installation

```bash
    sudo apt update

    sudo apt install nginx

    sudo apt install git

    sudo apt install nodejs npm

    sudo apt install postgresql postgresql-contrib

    sudo npm install -g pm2
```

## Clone Respository
```bash
    cd ~
    git clone https://github.com/vishalkumar12323/TaskFlow.git
    cd TaskFlow
```


## PostgreSQL Setup
```bash
    # connect to psql cmd
    sudo -u postgres psql

    # Create Database and User
    CREATE DATABASE taskdb;

    CREATE USER taskdbuser WITH PASSWORD 'password';

    GRANT ALL PRIVILEGES
    ON DATABASE taskdb
    TO taskdbuser;

    # Grant Permissions
    GRANT ALL ON SCHEMA public TO taskdbuser;

    GRANT CREATE ON SCHEMA public TO taskdbuser;

    GRANT USAGE ON SCHEMA public TO taskdbuser;

    ALTER SCHEMA public OWNER TO taskdbuser;
```

## Backend Setup
```bash
    cd backend

    npm install # install all required deps

    touch .env # create .env file

    PORT=5000
    DATABASE_URL=postgresql://taskdbuser:password@localhost:5432/taskdb
    JWT_SECRET=xxxxxxxx
    JWT_EXPIRES_IN=7d
    NODE_ENV=production


    # Run migrations
    npm run db:migrate
```

## Start Backend
```bash

    # build the project
    npm run build

    pm2 start npm --name taskflow-api -- start
    pm2 save
    pm2 startup

    # checking pm2 status and logs
    pm2 status
    pm2 -n taskflow-api logs
```

## Frontend Setup
```bash
    cd frontend
    npm install

    # create .env file
    touch .env

    # edit with nano
    sudo nano .env
    VITE_API_URL=http://YOUR_EC2_IP/api/v1

    # build
    npm run build
```

## Nginx Config As Reverse-Proxy
```bash
    sudo nano /etc/nginx/sites-available/taskflow
```

## Content
```bash
    server {
        listen 80;

        server_name EC2_PUBLIC_IP

        root /home/ubuntu/projects/TaskFlow/frontend/dist;

        index index.html

        location / {
            try_files $uri index.html
        }

        location /api/v1/ {
            proxy_pass http://localhost:3001
            proxy_http_version 1.1

            proxy_set_header Upgrade $http_upgrade
            proxy_set_header Connection 'upgrade'
            proxy_set_header Host $host

            proxy_cache_bypass $http_upgrade
        }
    }
```

## Enable
```bash
    sudo ln -s \
    /etc/nginx/sites-available/taskflow \
    /etc/nginx/sites-enabled/

    # Test
    sudo nginx -t

    # Restart nginx
    sudo systemctl restart nginx
```

## Firewall (ubuntu)
```bash
    sudo ufw allow OpenSSH

    sudo ufw allow 'Nginx Full'

    sudo ufw enable
```