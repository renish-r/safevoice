# SafeVoice - Anonymous Civic Issue Reporting Platform

A production-ready microservices-based platform for citizens to report civic issues anonymously while officials verify and resolve them.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (3000)                    │
│              (UploadProblem, ProblemFeed, Dashboard)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               Nginx Reverse Proxy (80, 443)                 │
│         (SSL, Rate Limiting, Load Balancing)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼────────┐ ┌──▼──────────┐ ┌─▼────────────┐
│ Backend API    │ │ AI Service  │ │  Database    │
│ (Spring Boot)  │ │ (FastAPI)   │ │ (PostgreSQL) │
│    (8080)      │ │   (8001)    │ │   (5432)     │
└────────────────┘ └─────────────┘ └──────────────┘
        │
    ┌───▴───┐
    │       │
┌───▼──┐ ┌─▼────┐
│  S3  │ │ JWT  │
│      │ │Auth  │
└──────┘ └──────┘
```

## Features

### Anonymous Problem Reporting
- Upload images with description and GPS coordinates
- Automatic EXIF metadata removal
- AI-based content moderation
- Rate limiting to prevent spam
- Anonymous reporting (IP anonymization optional)

### Official Dashboard
- JWT-based authentication
- Review pending civic issues
- Upload resolution images
- AI-powered verification using SSIM similarity and deepfake detection
- Role-based access control (ADMIN/OFFICIAL)

### AI Services
- **Content Moderation**: NSFW detection, violence detection, OCR-based text scanning
- **Resolution Verification**: Feature extraction, SSIM similarity scoring, deepfake detection
- Configurable confidence thresholds
- Async processing support

### Security
- JWT token-based authentication
- BCrypt password hashing
- CORS protection
- Rate limiting (30 req/min per IP)
- SQL injection prevention with JPA
- HTTPS/TLS support via Nginx

## Tech Stack

### Backend
- **Framework**: Spring Boot 3.2
- **Database**: PostgreSQL
- **Authentication**: JWT + BCrypt
- **Storage**: AWS S3
- **Logging**: SLF4J
- **Build**: Maven
- **Java**: 17

### AI Service
- **Framework**: FastAPI (Python 3.11)
- **Models**: NSFW detection, violence detection, deepfake detection
- **Image Processing**: Pillow, NumPy, scikit-image

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Maps**: Leaflet + React-Leaflet
- **Styling**: CSS3 + Tailwind CSS

### Deployment
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Certbot ready
- **Cloud**: AWS EC2, RDS, S3

## Project Structure

```
SafeVoice/
├── backend/
│   ├── src/main/java/com/safevoice/backend/
│   │   ├── api/controller/          # REST endpoints
│   │   ├── api/dto/                 # Data Transfer Objects
│   │   ├── application/service/     # Business logic
│   │   ├── domain/entity/           # JPA entities
│   │   ├── domain/repository/       # Data access
│   │   └── infrastructure/          # Cross-cutting concerns
│   │       ├── exception/           # Global exception handler
│   │       ├── security/            # JWT, auth, rate limiting
│   │       ├── http/                # External API clients
│   │       ├── storage/             # S3 integration
│   │       └── image/               # Image processing
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/resources/application.yml
│
├── ai-service/
│   ├── main.py                      # FastAPI application
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── pages/                   # Page components
│   │   ├── services/                # API clients
│   │   ├── styles/                  # CSS files
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml               # Multi-container orchestration
├── nginx.conf                       # Reverse proxy configuration
├── .env.example                     # Environment variables template
└── README.md
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- AWS S3 bucket (for image storage)
- AWS credentials

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# AWS_ACCESS_KEY=your_key
# AWS_SECRET_KEY=your_secret
# JWT_SECRET=your_secret
```

### 2. Build & Run

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f ai-service
docker-compose logs -f frontend
```

### 3. Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **AI Service**: http://localhost:8001
- **Database**: localhost:5432 (safevoice_user)

## API Endpoints

### Anonymous User
```
POST   /api/problems              # Report issue
GET    /api/problems              # List issues (paginated)
GET    /api/problems/{id}         # Get issue details
```

### Official Authentication
```
POST   /api/auth/register         # Register official
POST   /api/auth/login            # Login & get JWT
```

### Official
```
PUT    /api/problems/{id}/status  # Update issue status
POST   /api/official/resolutions  # Upload resolution image
```

### Admin
```
GET    /api/admin/officials       # List officials
PUT    /api/admin/officials/{id}  # Verify official
```

## AI Service Endpoints

```
POST   /api/ai/moderate           # Content moderation
POST   /api/ai/verify             # Resolution verification
GET    /health                    # Health check
```

## Database Schema

### Problems Table
```sql
- id (UUID, PK)
- image_url (VARCHAR, S3 URL)
- latitude (DECIMAL)
- longitude (DECIMAL)
- description (TEXT)
- status (ENUM: OPEN, UNDER_REVIEW, RESOLVED, REJECTED)
- ai_moderation_score (FLOAT)
- moderation_passed (BOOLEAN)
- reporter_ip_address (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Officials Table
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- full_name (VARCHAR)
- official_id_number (VARCHAR, UNIQUE)
- department (VARCHAR)
- role (ENUM: ADMIN, OFFICIAL)
- is_verified (BOOLEAN)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

### Resolutions Table
```sql
- id (UUID, PK)
- problem_id (FK)
- official_id (FK)
- resolved_image_url (VARCHAR)
- ai_similarity_score (FLOAT)
- deepfake_detected (BOOLEAN)
- verification_status (ENUM: VERIFIED, REJECTED, PENDING)
- created_at (TIMESTAMP)
```

## Security Features

1. **Authentication**: JWT tokens with 24-hour expiration
2. **Password Security**: BCrypt with salt rounds
3. **Rate Limiting**: 30 requests/minute per IP
4. **CORS Protection**: Configurable allowed origins
5. **SQL Injection Prevention**: JPA parameterized queries
6. **Image Security**: EXIF metadata removal
7. **Content Moderation**: AI-powered filtering (80% confidence threshold)
8. **Deepfake Detection**: AI verification before resolution approval
9. **HTTPS/TLS**: Nginx reverse proxy with SSL support
10. **Logging**: Comprehensive request/response logging

## Configuration

### Backend (application.yml)
```yaml
spring.datasource.url: jdbc:postgresql://localhost:5432/safevoice_db
jwt.expiration: 86400000  # 24 hours
ai.service.moderation-threshold: 0.8
rate-limiting.requests-per-minute: 30
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8080
```

### Docker Compose
```yaml
SPRING_DATASOURCE_PASSWORD: secure_password_123
AWS_ACCESS_KEY: ${AWS_ACCESS_KEY}
AWS_SECRET_KEY: ${AWS_SECRET_KEY}
```

## Development

### Backend Development
```bash
cd backend
mvn spring-boot:run
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### AI Service Development
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

## Testing

### Backend
```bash
cd backend
mvn test
```

### Frontend
```bash
cd frontend
npm test
```

## Deployment

### AWS Deployment
1. Create EC2 instance (t3.medium minimum)
2. Install Docker & Docker Compose
3. Configure RDS PostgreSQL database
4. Create S3 bucket for images
5. Set environment variables
6. Run `docker-compose up -d`

### Nginx Configuration
- SSL certificates: `/etc/nginx/ssl/cert.pem` and `key.pem`
- Enable HTTPS: uncomment SSL section in nginx.conf
- Rate limiting: 30 req/min general, 10 req/min uploads

## Performance Optimization

- Database query indexes on status, created_at, problem_id
- Nginx gzip compression enabled
- Image caching (1 year for static assets)
- Connection pooling via HikariCP
- Async AI service calls with timeouts
- S3 presigned URLs for image downloads

## Monitoring

- Docker health checks on all services
- Nginx access logs in `/var/log/nginx/access.log`
- Backend logs via Spring Boot logging
- AI service request/response logging
- Database connection monitoring

## Future Enhancements

- [ ] Admin panel for official verification
- [ ] Email notifications for status updates
- [ ] Mobile app (iOS/Android)
- [ ] Real-time updates using WebSockets
- [ ] Advanced analytics dashboard
- [ ] Machine learning for issue categorization
- [ ] Multi-language support
- [ ] Blockchain for audit trail
- [ ] Integration with government APIs
- [ ] Mobile OCR for offline reporting

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, contact: support@safevoice.local

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request
