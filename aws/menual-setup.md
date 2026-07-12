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