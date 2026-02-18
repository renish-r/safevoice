# SafeVoice - AWS Deployment Guide

## Prerequisites

1. AWS Account with appropriate permissions
2. Domain name (optional, for SSL)
3. AWS CLI configured locally
4. Docker installed locally (for building images)
5. AWS Certificate Manager (for SSL)

## Architecture on AWS

```
Internet Gateway
    ↓
Application Load Balancer (port 443)
    ↓
EC2 Instance(s) with Docker Compose
    ├── Spring Boot Backend
    ├── FastAPI AI Service
    ├── React Frontend
    ├── PostgreSQL (RDS)
    └── Nginx Reverse Proxy
    ↓
AWS RDS (PostgreSQL)
AWS S3 (Image Storage)
CloudWatch (Monitoring)
```

## Step 1: Set Up RDS PostgreSQL

```bash
# Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier safevoice-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username safevoice_user \
  --master-user-password $(openssl rand -base64 32) \
  --allocated-storage 20 \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxx
```

## Step 2: Create S3 Bucket

```bash
# Create S3 bucket for images
aws s3api create-bucket \
  --bucket safevoice-issues \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket safevoice-issues \
  --versioning-configuration Status=Enabled

# Block public access
aws s3api put-public-access-block \
  --bucket safevoice-issues \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

## Step 3: Create IAM User for Application

```bash
# Create IAM user
aws iam create-user --user-name safevoice-app

# Attach S3 policy
aws iam attach-user-policy \
  --user-name safevoice-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access key
aws iam create-access-key --user-name safevoice-app
```

## Step 4: Launch EC2 Instance

```bash
# Launch t3.medium instance with Docker
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-groups docker-allowed \
  --user-data file://user-data.sh
```

### user-data.sh
```bash
#!/bin/bash
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo systemctl start docker
sudo usermod -a -G docker ec2-user
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Step 5: Deploy Application

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Clone repository
git clone https://github.com/yourusername/safevoice.git
cd safevoice

# Create .env file with AWS credentials
cat > .env << EOF
AWS_ACCESS_KEY=your_iam_user_access_key
AWS_SECRET_KEY=your_iam_user_secret_key
JWT_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
EOF

# Update docker-compose.yml for RDS
# Replace localhost:5432 with RDS endpoint

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

## Step 6: Configure Load Balancer

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name safevoice-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-safevoice \
  --scheme internet-facing

# Create target group
aws elbv2 create-target-group \
  --name safevoice-targets \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-xxxxx

# Register EC2 instance
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=i-xxxxx Port=80
```

## Step 7: SSL/TLS Certificate

```bash
# Request certificate in ACM
aws acm request-certificate \
  --domain-name safevoice.example.com \
  --validation-method DNS

# Add DNS records for validation (check ACM console)

# Attach certificate to ALB listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:...
```

## Step 8: CloudWatch Monitoring

```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name safevoice-cpu-high \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## Step 9: Auto Scaling (Optional)

```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name safevoice-template \
  --version-description "SafeVoice deployment" \
  --launch-template-data file://launch-template.json

# Create auto scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name safevoice-asg \
  --launch-template LaunchTemplateName=safevoice-template \
  --min-size 2 \
  --max-size 4 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:...
```

## Production Security Checklist

- [ ] Enable RDS encryption at rest
- [ ] Enable RDS automated backups
- [ ] Enable S3 bucket encryption
- [ ] Configure security group rules (whitelist IPs)
- [ ] Enable VPC Flow Logs
- [ ] Set up CloudTrail for audit logging
- [ ] Use AWS Systems Manager for secret management
- [ ] Enable ALB access logging
- [ ] Configure WAF for DDoS protection
- [ ] Regular security patches for EC2
- [ ] Database backups to separate region
- [ ] Enable versioning on S3
- [ ] CloudFront distribution for static assets
- [ ] VPN for RDS access (bastion host)

## Cost Optimization

1. **Reserved Instances**: ~40% savings on EC2
2. **RDS Reserved Instances**: ~30% savings
3. **S3 Intelligent Tiering**: Auto-archive old images
4. **CloudFront**: Cache static assets
5. **Spot Instances**: For non-critical components

## Monitoring & Logging

```bash
# View application logs
docker-compose logs -f backend

# CloudWatch logs
aws logs tail /aws/ec2/safevoice --follow

# RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=safevoice-postgres
```

## Disaster Recovery

1. **RDS Backup**: Automated daily backups (30 days retention)
2. **S3 Versioning**: Keep image versions
3. **Cross-Region Replication**: Critical data
4. **Infrastructure as Code**: Use Terraform

## Database Migrations

```bash
# Connect to RDS
psql -h safevoice-rds.xxxxx.rds.amazonaws.com \
     -U safevoice_user \
     -d safevoice_db

# Run Flyway or Liquibase migrations
docker exec safevoice-backend \
  mvn flyway:migrate -Dflyway.url=jdbc:postgresql://rds-endpoint:5432/safevoice_db
```

## Troubleshooting

### Can't connect to RDS
```bash
# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Check RDS endpoint is accessible
nc -zv safevoice-rds.xxxxx.rds.amazonaws.com 5432
```

### S3 access denied
```bash
# Verify IAM permissions
aws iam get-user-policy --user-name safevoice-app --policy-name S3Access

# Test S3 access
aws s3 ls s3://safevoice-issues/
```

### High CPU on EC2
```bash
# Scale up instance
aws ec2 modify-instance-attribute \
  --instance-id i-xxxxx \
  --instance-type t3.large
```

## Cost Estimate (Monthly)

- **EC2** (t3.medium): ~$32
- **RDS** (db.t3.micro): ~$40
- **S3** (1TB images): ~$23
- **Load Balancer**: ~$18
- **Data Transfer**: ~$5-50 (varies)
- **Total**: ~$120-170/month

## Maintenance Schedule

- **Weekly**: Check CloudWatch metrics
- **Monthly**: Review AWS bills, security updates
- **Quarterly**: Database backup testing
- **Annually**: Disaster recovery drill

## References

- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/s3/latest/userguide/BestPractices.html)
- [Docker Compose on EC2](https://docs.docker.com/cloud/ecs-integration/)
