# Moha Weaves Next.js Deployment Guide

## 📋 Overview

This guide will help you deploy the Moha Weaves Next.js e-commerce application on your VPS with PostgreSQL and Redis containers.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL    │    │     Redis       │
│   (Port 3000)   │    │   (Port 5432)   │    │   (Port 6379)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Admin App      │
                    │  (Port 5000)    │
                    └─────────────────┘
```

## 🚀 Quick Deployment

### 1. Prepare VPS Directory Structure

```bash
# Create deployment directory
sudo mkdir -p /opt/moha_weaves/nextjs-app
cd /opt/moha_weaves/nextjs-app

# Copy application files
sudo cp -r /path/to/your/nextjs/app/* .
```

### 2. Configure Environment Variables

The environment variables are already configured in `docker-compose.yml`. **Important variables:**

- `NEXTAUTH_URL`: Set to `http://103.127.146.58:3000`
- `NEXTAUTH_SECRET`: Production secret key
- `JWT_SECRET`: Production JWT secret
- `DATABASE_URL`: `postgresql://postgres:Mohaweaves%40123@postgres:5432/moha_weaves`
- `REDIS_URL`: `redis://redis:6379`
- `ADMIN_API_URL`: `http://103.127.146.58:5000/api`

**Only update needed:**
- `ADMIN_API_KEY`: Replace with your actual admin API key

### 3. Deploy Application

```bash
# Build and start all services
docker-compose up -d --build

# Check logs
docker-compose logs -f nextjs
```

### 4. Verify Deployment

```bash
# Check service status
docker-compose ps

# Test the application
curl http://localhost:3000

# Access in browser
http://103.127.146.58:3000
```

## 🔧 Configuration Files

### Dockerfile
- Multi-stage build for optimized production image
- Uses Node.js 18 Alpine for smaller size
- Non-root user (nodejs) for security
- Standalone output mode for Docker compatibility

### docker-compose.yml
- **Next.js App**: Port 3000, connects to PostgreSQL and Redis
- **PostgreSQL**: Port 5432, database `moha_weaves` with credentials
- **Redis**: Port 6379, for caching and sessions
- **Network**: `moha_weaves_network` for service communication
- **Volumes**: Persistent data storage for database and cache

### Environment Configuration
- Database: `postgresql://postgres:Mohaweaves%40123@postgres:5432/moha_weaves`
- Server IP: `103.127.146.58`
- Admin API: `http://103.127.146.58:5000/api`
- Cloudinary: Configured with your credentials
- Razorpay: Test keys configured

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Check application health
docker-compose exec nextjs wget --spider http://localhost:3000

# Check database connection
docker-compose exec postgres pg_isready -U postgres

# Check Redis connection
docker-compose exec redis redis-cli ping
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f nextjs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.production` to version control
2. **Database Passwords**: Use strong, unique passwords (already configured)
3. **Firewall**: Configure UFW to allow only necessary ports (3000, 5432, 6379)
4. **Regular Updates**: Keep Docker images and dependencies updated

## 🚨 Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs for errors
docker-compose logs nextjs

# Verify environment variables
docker-compose exec nextjs env
```

**Database connection failed:**
```bash
# Check database status
docker-compose ps postgres

# Test connection from app container
docker-compose exec nextjs ping postgres

# Check database logs
docker-compose logs postgres
```

**Port conflicts:**
```bash
# Check what's using ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5432
sudo netstat -tulpn | grep :6379
```

**Build issues:**
```bash
# Clean build
docker-compose down
docker system prune -f
docker-compose up -d --build
```

## 📱 Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Redis Caching**: Utilize Redis for session storage and caching
3. **Image Optimization**: Leverage Next.js Image component and Cloudinary
4. **Monitor Resources**: Use `docker stats` to monitor resource usage

## 🔄 Backup Strategy

```bash
# Database backup
docker-compose exec postgres pg_dump -U postgres moha_weaves > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres moha_weaves < backup.sql

# Automated backup (add to crontab)
0 2 * * * /opt/moha_weaves/backup.sh
```

## � Support

For deployment issues:
1. Check logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all services are running
4. Test database and Redis connections
5. Check network connectivity between containers

---

**Note**: This deployment assumes you have Docker and Docker Compose installed on your VPS. If not, install them first:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Common Issues

**Application won't start:**
```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs nextjs-app

# Verify environment variables
docker-compose -f docker-compose.prod.yml exec nextjs-app env
```

**Database connection failed:**
```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection from app container
docker-compose -f docker-compose.prod.yml exec nextjs-app ping postgres
```

**Port conflicts:**
```bash
# Check what's using ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5432
```

## 📱 Performance Optimization

1. **Enable CDN**: Use Cloudflare or similar for static assets
2. **Database Indexing**: Ensure proper indexes on frequently queried columns
3. **Redis Caching**: Utilize Redis for session storage and caching
4. **Image Optimization**: Leverage Next.js Image component and Cloudinary
5. **Monitor Resources**: Use `docker stats` to monitor resource usage

## 🔄 Backup Strategy

```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres mohaweaves > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres mohaweaves < backup.sql

# Automated backup (add to crontab)
0 2 * * * /opt/moha_weaves/backup.sh
```

## 📞 Support

For deployment issues:
1. Check logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all services are running
4. Test database and Redis connections
5. Check network connectivity between containers

---

**Note**: This deployment assumes you have Docker and Docker Compose installed on your VPS. If not, install them first:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```
