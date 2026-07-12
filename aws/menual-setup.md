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

    CREATE USER taskdbuser WITH PASSWORD 'StrongPassword';

    GRANT ALL PRIVILEGES
    ON DATABASE taskdb
    TO taskdbuser;

    # Grant Permissions
    GRANT ALL ON SCHEMA public TO taskflowuser;

    GRANT CREATE ON SCHEMA public TO taskflowuser;

    GRANT USAGE ON SCHEMA public TO taskflowuser;
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

