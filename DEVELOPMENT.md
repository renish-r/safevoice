# SafeVoice - Development Guide

## Local Development Setup

### Prerequisites
- Java 17+
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)
- Git

## Backend Development

### 1. Set Up PostgreSQL

```bash
# Using Docker
docker run --name safevoice-postgres \
  -e POSTGRES_USER=safevoice_user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=safevoice_db \
  -p 5432:5432 \
  postgres:15-alpine
```

### 2. Configure Backend

```bash
cd backend

# Create application-dev.yml
cat > src/main/resources/application-dev.yml << EOF
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/safevoice_db
    username: safevoice_user
    password: password

  jpa:
    hibernate:
      ddl-auto: create-drop
    properties:
      hibernate:
        format_sql: true

jwt:
  secret: dev_secret_key_only
  expiration: 86400000

logging:
  level:
    root: INFO
    com.safevoice: DEBUG
EOF

# Run application
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

### 3. Build and Package

```bash
# Build JAR
mvn clean package

# Run tests
mvn test

# Run with coverage
mvn clean test jacoco:report
```

## Frontend Development

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Setup

```bash
# Create .env.local
cat > .env.local << EOF
REACT_APP_API_URL=http://localhost:8080
REACT_APP_AI_URL=http://localhost:8001
EOF
```

### 3. Start Development Server

```bash
# Hot reload development
npm start

# Building for production
npm run build

# Run tests
npm test

# Code coverage
npm test -- --coverage
```

## AI Service Development

### 1. Python Environment

```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run Service

```bash
# Development mode with auto-reload
python main.py

# Or using Uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 3. Test AI Endpoints

```bash
# Moderation
curl -X POST http://localhost:8001/api/ai/moderate \
  -F "file=@image.jpg"

# Verification
curl -X POST http://localhost:8001/api/ai/verify \
  -F "original=@original.jpg" \
  -F "resolved=@resolved.jpg"
```

## Docker Local Development

### 1. Start All Services

```bash
# From project root
docker-compose up

# With build
docker-compose up --build

# In background
docker-compose up -d
```

### 2. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ai-service
docker-compose logs -f frontend
```

### 3. Connect to PostgreSQL

```bash
# From host
psql -h localhost -U safevoice_user -d safevoice_db

# From container
docker-compose exec postgres psql -U safevoice_user -d safevoice_db
```

## Code Organization

### Backend Package Structure
```
com.safevoice.backend
├── api/
│   ├── controller/          # REST endpoints
│   └── dto/                 # Request/Response DTOs
├── application/
│   └── service/             # Business logic (stateless)
├── domain/
│   ├── entity/              # JPA entities
│   └── repository/          # Data access interfaces
└── infrastructure/
    ├── config/              # Configuration classes
    ├── exception/           # Exception handling
    ├── security/            # JWT, auth, rate limiting
    ├── http/                # External API clients
    ├── storage/             # S3 integration
    └── image/               # Image processing
```

### Frontend Component Structure
```
src/
├── components/              # Reusable components
│   └── Header.jsx
├── pages/                   # Page components
│   ├── UploadProblem.jsx
│   ├── ProblemFeed.jsx
│   ├── OfficialLogin.jsx
│   ├── OfficialRegister.jsx
│   └── OfficialDashboard.jsx
├── services/                # API clients
│   ├── apiClient.js
│   └── api.js
├── styles/                  # CSS files
├── App.jsx
└── index.js
```

## Testing

### Backend Unit Tests
```bash
cd backend

# Run all tests
mvn test

# Run specific test
mvn test -Dtest=ProblemServiceTest

# Run with coverage
mvn clean test jacoco:report
```

### Backend Integration Tests
```bash
# Using test containers
mvn verify -Dgroups=integration
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# E2E tests (optional)
npm install cypress
npx cypress open
```

### AI Service Tests
```bash
cd ai-service

# Run pytest
pytest -v

# With coverage
pytest --cov=.
```

## Debugging

### Backend Debug Mode
```bash
# With remote debugging
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=5005"

# In IDE: Run > Debug Configurations > Remote > localhost:5005
```

### Frontend Debug
```bash
# Chrome DevTools
npm start
# Open http://localhost:3000 in Chrome
# Press F12 for DevTools

# VS Code Debugger
# Add launch.json configuration
```

### Database Debug
```bash
# Connect with pgAdmin
docker run -p 5050:80 dpage/pgadmin4

# Or use psql
psql -h localhost -U safevoice_user -d safevoice_db -c "SELECT * FROM problems;"
```

## API Testing

### Using cURL

```bash
# Create problem
curl -X POST http://localhost:8080/api/problems \
  -H "Content-Type: multipart/form-data" \
  -F "imageFile=@problem.jpg" \
  -F "description=Broken pothole" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"

# Get problems
curl http://localhost:8080/api/problems?page=0&size=10

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "official@example.com",
    "password": "password123"
  }'
```

### Using Postman

1. Import collection: `postman-collection.json`
2. Set environment variables
3. Run requests

### Using Swagger/OpenAPI

```
http://localhost:8080/swagger-ui.html
```

## Common Development Tasks

### Add New Endpoint

```java
// 1. Create DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewRequest {
    @NotBlank
    private String field;
}

// 2. Create Service Method
@Service
public class MyService {
    public MyResponse process(NewRequest request) {
        // Business logic
        return response;
    }
}

// 3. Create Controller
@RestController
@RequestMapping("/api/endpoint")
public class MyController {
    @PostMapping
    public ResponseEntity<MyResponse> create(@RequestBody NewRequest request) {
        return ResponseEntity.ok(service.process(request));
    }
}
```

### Add Database Migration

```sql
-- Create migration file: V2__add_new_column.sql
ALTER TABLE problems ADD COLUMN new_field VARCHAR(255);

-- Flyway will auto-execute on startup
```

### Add React Component

```jsx
import React, { useState } from 'react';

function NewComponent() {
  const [data, setData] = useState(null);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}

export default NewComponent;
```

## Performance Profiling

### Backend Profiling
```bash
# Using JProfiler or YourKit
# Add JVM arguments: -agentpath=/path/to/profiler

# Or use Java Flight Recorder
jcmd PID JFR.start
jcmd PID JFR.dump
```

### Frontend Performance
```bash
# Chrome DevTools > Performance
# Record, run scenario, analyze

# Lighthouse
npm install -g lighthouse
lighthouse http://localhost:3000
```

## Database Queries

### Common Queries
```sql
-- Count problems by status
SELECT status, COUNT(*) FROM problems GROUP BY status;

-- Get issues in date range
SELECT * FROM problems 
WHERE created_at >= '2024-01-01' 
AND created_at < '2024-02-01';

-- Find duplicates
SELECT description, COUNT(*) 
FROM problems 
GROUP BY description 
HAVING COUNT(*) > 1;
```

## CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v2
        with:
          java-version: '17'
      - run: cd backend && mvn clean test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm ci && npm test
```

## Useful Commands

```bash
# View Docker logs
docker logs container_name

# Enter container bash
docker exec -it container_name /bin/bash

# Rebuild specific service
docker-compose up --build backend

# Remove all containers
docker-compose down

# Remove volumes too
docker-compose down -v

# Check port availability
lsof -i :8080

# Kill process on port
kill -9 $(lsof -t -i:8080)
```

## Resources

- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [React Docs](https://react.dev)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Docker Docs](https://docs.docker.com/)
