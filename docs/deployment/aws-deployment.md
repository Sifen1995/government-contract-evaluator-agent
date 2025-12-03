# AWS Deployment Guide

Complete guide for deploying GovAI to Amazon Web Services (AWS).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐         ┌────────────────┐                 │
│  │  CloudFront    │────────▶│     S3         │                 │
│  │   (CDN)        │         │  (Static)      │                 │
│  └────────────────┘         └────────────────┘                 │
│         │                                                        │
│         ▼                                                        │
│  ┌────────────────┐                                             │
│  │  Route 53      │         ┌────────────────┐                 │
│  │   (DNS)        │────────▶│  ALB           │                 │
│  └────────────────┘         │  (Load Balance)│                 │
│                              └────────────────┘                 │
│                                      │                           │
│                   ┌──────────────────┼──────────────────┐       │
│                   ▼                  ▼                  ▼       │
│           ┌───────────────┐  ┌───────────────┐  ┌───────────┐ │
│           │   ECS Task    │  │   ECS Task    │  │  ECS Task │ │
│           │  (Backend)    │  │   (Worker)    │  │  (Beat)   │ │
│           └───────────────┘  └───────────────┘  └───────────┘ │
│                   │                  │                  │       │
│                   └──────────────────┼──────────────────┘       │
│                                      │                           │
│           ┌──────────────────────────┼────────────────────┐     │
│           ▼                          ▼                    ▼     │
│     ┌──────────┐             ┌──────────────┐     ┌──────────┐│
│     │ RDS      │             │ ElastiCache  │     │   S3     ││
│     │(Postgres)│             │  (Redis)     │     │(Documents│││
│     └──────────┘             └──────────────┘     └──────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS Account** with administrative access
2. **AWS CLI** installed and configured
3. **Docker** installed locally
4. **Terraform** (optional, for infrastructure as code)
5. **Domain name** registered (optional but recommended)

## Step-by-Step Deployment

### Step 1: Create VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=govai-vpc}]'

# Note the VPC ID from output
export VPC_ID=vpc-xxxxxxxxx

# Create public subnets (2 for high availability)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=govai-public-1a}]'

aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=govai-public-1b}]'

# Create private subnets (for database)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.3.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=govai-private-1a}]'

aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.4.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=govai-private-1b}]'

# Create Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=govai-igw}]'

# Attach to VPC
aws ec2 attach-internet-gateway \
  --vpc-id $VPC_ID \
  --internet-gateway-id igw-xxxxxxxxx
```

### Step 2: Create RDS PostgreSQL Database

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name govai-db-subnet \
  --db-subnet-group-description "GovAI Database Subnet Group" \
  --subnet-ids subnet-xxx subnet-yyy

# Create security group for RDS
aws ec2 create-security-group \
  --group-name govai-db-sg \
  --description "Security group for GovAI database" \
  --vpc-id $VPC_ID

# Allow PostgreSQL traffic from backend
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-backend-sg-id

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier govai-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username govai \
  --master-user-password 'YOUR-SECURE-PASSWORD' \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --db-name govai \
  --db-subnet-group-name govai-db-subnet \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --tags Key=Name,Value=govai-db

# Wait for database to be available (takes 10-15 minutes)
aws rds wait db-instance-available --db-instance-identifier govai-db

# Get database endpoint
aws rds describe-db-instances \
  --db-instance-identifier govai-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Step 3: Create ElastiCache Redis

```bash
# Create cache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name govai-redis-subnet \
  --cache-subnet-group-description "GovAI Redis Subnet Group" \
  --subnet-ids subnet-xxx subnet-yyy

# Create security group for Redis
aws ec2 create-security-group \
  --group-name govai-redis-sg \
  --description "Security group for GovAI Redis" \
  --vpc-id $VPC_ID

# Allow Redis traffic from backend
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 6379 \
  --source-group sg-backend-sg-id

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id govai-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name govai-redis-subnet \
  --security-group-ids sg-xxxxxxxxx \
  --tags Key=Name,Value=govai-redis

# Get Redis endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id govai-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text
```

### Step 4: Create ECR Repositories

```bash
# Create repository for backend
aws ecr create-repository \
  --repository-name govai/backend \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Create repository for worker
aws ecr create-repository \
  --repository-name govai/worker \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Get registry URL
aws ecr describe-repositories \
  --repository-names govai/backend \
  --query 'repositories[0].repositoryUri' \
  --output text
```

### Step 5: Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build backend image
cd backend
docker build -t govai/backend:latest .
docker tag govai/backend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/govai/backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/govai/backend:latest

# Build worker image (same Dockerfile, different CMD)
docker build -t govai/worker:latest -f Dockerfile.worker .
docker tag govai/worker:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/govai/worker:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/govai/worker:latest
```

### Step 6: Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name govai-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1 \
    capacityProvider=FARGATE_SPOT,weight=4 \
  --tags key=Name,value=govai-cluster
```

### Step 7: Create Task Definitions

**Backend Task Definition:**

Create `backend-task-def.json`:

```json
{
  "family": "govai-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/govaiTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/govai/backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "DATABASE_URL", "value": "postgresql://govai:PASSWORD@DB_ENDPOINT:5432/govai"},
        {"name": "REDIS_URL", "value": "redis://REDIS_ENDPOINT:6379"},
        {"name": "JWT_SECRET", "value": "YOUR_JWT_SECRET"},
        {"name": "SAM_API_KEY", "value": "YOUR_SAM_API_KEY"},
        {"name": "OPENAI_API_KEY", "value": "YOUR_OPENAI_API_KEY"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/govai-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task:
```bash
aws ecs register-task-definition --cli-input-json file://backend-task-def.json
```

**Worker Task Definition:**

Create `worker-task-def.json` (similar structure, different CMD):

```json
{
  "family": "govai-worker",
  "containerDefinitions": [
    {
      "name": "worker",
      "command": ["celery", "-A", "app.celery_app", "worker", "--loglevel=info"],
      ...
    }
  ]
}
```

Register:
```bash
aws ecs register-task-definition --cli-input-json file://worker-task-def.json
```

### Step 8: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name govai-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxxxxxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Name,Value=govai-alb

# Create target group
aws elbv2 create-target-group \
  --name govai-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Step 9: Create ECS Services

```bash
# Create backend service
aws ecs create-service \
  --cluster govai-cluster \
  --service-name govai-backend \
  --task-definition govai-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=8000 \
  --health-check-grace-period-seconds 60 \
  --enable-execute-command

# Create worker service
aws ecs create-service \
  --cluster govai-cluster \
  --service-name govai-worker \
  --task-definition govai-worker:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx]}"

# Create beat scheduler service (single task)
aws ecs create-service \
  --cluster govai-cluster \
  --service-name govai-beat \
  --task-definition govai-beat:1 \
  --desired-count 1 \
  --launch-type FARGATE
```

### Step 10: Run Database Migrations

```bash
# Connect to running backend task
aws ecs execute-command \
  --cluster govai-cluster \
  --task TASK_ID \
  --container backend \
  --interactive \
  --command "/bin/bash"

# Inside container:
alembic upgrade head
exit
```

### Step 11: Deploy Frontend to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from frontend directory
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard
NEXT_PUBLIC_API_URL=https://api.govai.com
```

**Alternative: Deploy Frontend to S3 + CloudFront**

```bash
# Build frontend
cd frontend
npm run build
npm run export

# Upload to S3
aws s3 sync out/ s3://govai-frontend-bucket/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123456789ABCD \
  --paths "/*"
```

### Step 12: Configure Route 53 DNS

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone \
  --name govai.com \
  --caller-reference $(date +%s)

# Create A record for API
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789ABCD \
  --change-batch file://api-record.json

# api-record.json
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.govai.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z35SXDOTRQ7X7K",
        "DNSName": "govai-alb-123456789.us-east-1.elb.amazonaws.com",
        "EvaluateTargetHealth": true
      }
    }
  }]
}
```

## Cost Estimation

### Monthly AWS Costs (Estimated)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **ECS Fargate** | 3 tasks × 1vCPU/2GB × 730hrs | $130 |
| **RDS PostgreSQL** | db.t3.medium Multi-AZ | $120 |
| **ElastiCache Redis** | cache.t3.medium | $60 |
| **Application Load Balancer** | 1 ALB + data transfer | $20 |
| **CloudWatch Logs** | 10 GB ingestion | $5 |
| **S3** | 50 GB storage + requests | $2 |
| **Data Transfer** | 500 GB out | $45 |
| **Route 53** | 1 hosted zone + queries | $1 |
| **Total (Estimated)** | | **~$383/month** |

**Note:** Does not include:
- OpenAI API costs (~$100-300/month depending on usage)
- SendGrid email costs (~$15-50/month)
- SAM.gov API (free tier: 1000 req/day)

## Monitoring and Logging

### CloudWatch Setup

```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/govai-backend
aws logs create-log-group --log-group-name /ecs/govai-worker
aws logs create-log-group --log-group-name /ecs/govai-beat

# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name GovAI \
  --dashboard-body file://dashboard.json
```

### Create Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name govai-backend-high-cpu \
  --alarm-description "Backend CPU utilization is too high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=govai-backend Name=ClusterName,Value=govai-cluster

# Database connections alarm
aws cloudwatch put-metric-alarm \
  --alarm-name govai-db-connections-high \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=govai-db
```

## Auto-Scaling Configuration

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/govai-cluster/govai-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/govai-cluster/govai-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json

# scaling-policy.json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

## Backup and Disaster Recovery

### Database Backups

```bash
# RDS automated backups (already enabled)
# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier govai-db \
  --db-snapshot-identifier govai-db-snapshot-$(date +%Y%m%d)

# Point-in-time recovery is enabled by default
```

### Application Backups

```bash
# Backup task definitions
aws ecs describe-task-definition \
  --task-definition govai-backend:1 \
  > backend-task-def-backup.json

# Backup ECS service configuration
aws ecs describe-services \
  --cluster govai-cluster \
  --services govai-backend \
  > backend-service-backup.json
```

## Security Hardening

1. **Enable GuardDuty**: Threat detection
2. **Enable Security Hub**: Compliance checking
3. **Enable Config**: Resource compliance
4. **Use Secrets Manager**: For sensitive data
5. **Enable VPC Flow Logs**: Network monitoring
6. **Enable CloudTrail**: API auditing
7. **Implement WAF**: Web application firewall

## Deployment Checklist

- [ ] VPC and subnets created
- [ ] Security groups configured
- [ ] RDS database created and accessible
- [ ] ElastiCache Redis created and accessible
- [ ] ECR repositories created
- [ ] Docker images built and pushed
- [ ] ECS cluster created
- [ ] Task definitions registered
- [ ] ALB created with HTTPS listener
- [ ] ECS services created and running
- [ ] Database migrations completed
- [ ] Frontend deployed (Vercel or S3/CloudFront)
- [ ] DNS configured in Route 53
- [ ] CloudWatch alarms set up
- [ ] Auto-scaling configured
- [ ] Backups enabled
- [ ] Security hardening complete
- [ ] Load testing performed
- [ ] Documentation updated

## Troubleshooting

### Task Won't Start

```bash
# Check task logs
aws logs tail /ecs/govai-backend --follow

# Check task status
aws ecs describe-tasks \
  --cluster govai-cluster \
  --tasks TASK_ID
```

### Database Connection Issues

```bash
# Test from backend container
aws ecs execute-command \
  --cluster govai-cluster \
  --task TASK_ID \
  --container backend \
  --interactive \
  --command "/bin/bash"

# Inside container:
psql -h DB_ENDPOINT -U govai -d govai
```

### High API Latency

1. Check ECS task CPU/memory utilization
2. Check RDS performance insights
3. Review CloudWatch logs for errors
4. Check Redis cache hit rate
5. Enable X-Ray tracing for detailed analysis

## Maintenance

### Rolling Updates

```bash
# Update task definition with new image tag
aws ecs register-task-definition --cli-input-json file://backend-task-def-v2.json

# Update service to use new task definition
aws ecs update-service \
  --cluster govai-cluster \
  --service govai-backend \
  --task-definition govai-backend:2 \
  --force-new-deployment
```

### Scaling

```bash
# Scale backend service
aws ecs update-service \
  --cluster govai-cluster \
  --service govai-backend \
  --desired-count 5

# Scale worker service
aws ecs update-service \
  --cluster govai-cluster \
  --service govai-worker \
  --desired-count 4
```

## Support

For AWS-specific issues:
- AWS Support Console
- AWS Documentation: https://docs.aws.amazon.com/
- AWS Forums: https://forums.aws.amazon.com/

For GovAI application issues:
- GitHub Issues: https://github.com/govai/platform/issues
- Email: support@govai.com
