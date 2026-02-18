#!/bin/bash
# SafeVoice Project Initialization Script
# This script helps set up the SafeVoice project locally

set -e

echo "🚀 SafeVoice Project Initialization"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    fi
}

all_ok=true

check_command "docker" || all_ok=false
check_command "docker-compose" || all_ok=false
check_command "git" || all_ok=false
check_command "java" || all_ok=false
check_command "node" || all_ok=false
check_command "python3" || all_ok=false

echo ""

if [ "$all_ok" = false ]; then
    echo -e "${RED}❌ Some prerequisites are missing. Please install them and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites are installed${NC}"
echo ""

# Setup environment
echo "⚙️  Setting up environment..."
echo ""

if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your_super_secret_jwt_key/$JWT_SECRET/" .env
    
    echo -e "${YELLOW}⚠️  Please update .env with your AWS credentials:${NC}"
    echo "   - AWS_ACCESS_KEY"
    echo "   - AWS_SECRET_KEY"
    echo ""
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""

# Build Docker images
echo "🐳 Building Docker images..."
echo ""

docker-compose build

echo ""
echo -e "${GREEN}✓ Docker images built successfully${NC}"
echo ""

# Start services
read -p "Do you want to start the services now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting services..."
    docker-compose up -d
    
    echo ""
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    echo ""
    echo -e "${GREEN}✓ Services started${NC}"
    echo ""
    echo "📍 Access points:"
    echo "   Frontend:  ${YELLOW}http://localhost:3000${NC}"
    echo "   Backend:   ${YELLOW}http://localhost:8080${NC}"
    echo "   AI Service: ${YELLOW}http://localhost:8001${NC}"
    echo "   Database:  ${YELLOW}localhost:5432${NC}"
    echo ""
    
    # Check service health
    echo "Checking service health..."
    echo ""
    
    # Frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend is starting...${NC}"
    fi
    
    # Backend
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend is starting...${NC}"
    fi
    
    # AI Service
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ AI Service is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  AI Service is starting...${NC}"
    fi
    
    echo ""
    echo "🎉 SafeVoice is ready to use!"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Test anonymous issue reporting"
    echo "3. Register as an official and login"
    echo "4. Check the documentation:"
    echo "   - README.md (overview)"
    echo "   - API_DOCUMENTATION.md (API reference)"
    echo "   - DEVELOPMENT.md (development guide)"
    echo ""
else
    echo ""
    echo "To start services later, run:"
    echo -e "${YELLOW}docker-compose up${NC}"
    echo ""
fi

echo "✨ Initialization complete!"
