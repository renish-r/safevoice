# SafeVoice - Quick Reference Guide

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd SafeVoice

# Initialize project
chmod +x init.sh
./init.sh

# Or manually start
docker-compose up -d

# Access
Frontend:   http://localhost:3000
Backend:    http://localhost:8080
AI Service: http://localhost:8001
```

## 📱 API Quick Reference

### Anonymous User Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/problems` | Report issue | ❌ |
| GET | `/api/problems` | List issues | ❌ |
| GET | `/api/problems/{id}` | Get issue details | ❌ |

### Authentication Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register official | ❌ |
| POST | `/api/auth/login` | Login official | ❌ |

### Official Endpoints (JWT Required)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PUT | `/api/problems/{id}/status` | Update issue status | ✅ |
| POST | `/api/official/resolutions` | Upload resolution | ✅ |

### Health/Info Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | ❌ |

## 🧪 Test Examples

### Report an Issue
```bash
curl -X POST http://localhost:8080/api/problems \
  -F "imageFile=@image.jpg" \
  -F "description=Road damage on Main Street" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"
```

### Get Issues
```bash
curl "http://localhost:8080/api/problems?page=0&size=10"
```

### Login
```bash
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"official@city.gov","password":"Pass123"}' \
  | jq -r '.accessToken')

echo $TOKEN
```

### Update Status
```bash
curl -X PUT http://localhost:8080/api/problems/{ISSUE_ID}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "UNDER_REVIEW"}'
```

### Upload Resolution
```bash
curl -X POST http://localhost:8080/api/official/resolutions \
  -H "Authorization: Bearer $TOKEN" \
  -F "problemId={ISSUE_ID}" \
  -F "resolvedImageFile=@resolved.jpg"
```

## 📂 Project Structure Summary

```
SafeVoice/
├── backend/                 # Spring Boot (8080)
│   ├── Domain Layer         # JPA Entities
│   ├── Service Layer        # Business Logic
│   ├── API Layer            # REST Controllers
│   └── Infrastructure       # Security, Storage, etc.
│
├── ai-service/              # FastAPI (8001)
│   ├── Content Moderation   # NSFW, Violence, OCR
│   └── Verification         # SSIM, Deepfake
│
├── frontend/                # React (3000)
│   ├── Pages                # 5 main pages
│   ├── Components           # Header & utilities
│   ├── Services             # API clients
│   └── Styles               # CSS files
│
├── docker-compose.yml       # Orchestration
├── nginx.conf               # Reverse proxy
├── README.md                # Full documentation
├── API_DOCUMENTATION.md     # API reference
├── DEVELOPMENT.md           # Dev guide
└── AWS_DEPLOYMENT.md        # Cloud deployment
```

## 🔐 Security Features

- ✅ JWT Authentication (24h expiration)
- ✅ BCrypt Password Hashing
- ✅ Rate Limiting (30 req/min)
- ✅ CORS Protection
- ✅ SQL Injection Prevention
- ✅ EXIF Metadata Removal
- ✅ AI Content Moderation (80% threshold)
- ✅ Deepfake Detection
- ✅ HTTPS/TLS Ready

## 📊 Database Schema

### Problems Table
- id (UUID)
- image_url
- latitude, longitude
- description
- status (ENUM)
- ai_moderation_score
- created_at, updated_at

### Officials Table
- id (UUID)
- email (unique)
- password_hash
- full_name
- official_id_number (unique)
- department
- role (ADMIN/OFFICIAL)

### Resolutions Table
- id (UUID)
- problem_id (FK)
- official_id (FK)
- resolved_image_url
- ai_similarity_score
- deepfake_detected
- verification_status

## 🛠️ Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f ai-service
docker-compose logs -f frontend

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild images
docker-compose up --build

# Remove volumes (clean start)
docker-compose down -v
```

## 🧑‍💻 Development Commands

### Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
mvn test
mvn clean package
```

### Frontend
```bash
cd frontend
npm install
npm start        # Development server
npm run build    # Production build
npm test         # Run tests
```

### AI Service
```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
# Or: uvicorn main:app --reload --port 8001
```

## 🌐 Environment Variables

```bash
# .env file
AWS_ACCESS_KEY=your_aws_key
AWS_SECRET_KEY=your_aws_secret
JWT_SECRET=generated_secret
POSTGRES_PASSWORD=secure_password
```

## 📈 Scaling Information

- **Users**: Designed for 10,000+ concurrent users
- **Storage**: Unlimited with AWS S3
- **Database**: PostgreSQL with auto-scaling RDS
- **Load Balancing**: Nginx with AWS ALB
- **Rate Limiting**: Per-IP based on 30 req/min

## 📚 Documentation Files

| File | Description | Size |
|------|-------------|------|
| README.md | Complete overview | 500 lines |
| API_DOCUMENTATION.md | Full API reference | 600 lines |
| DEVELOPMENT.md | Development guide | 400 lines |
| AWS_DEPLOYMENT.md | Cloud deployment | 400 lines |
| BUILD_SUMMARY.md | Project summary | 300 lines |

## 🎯 Status Codes Reference

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET request worked |
| 201 | Created | Issue reported successfully |
| 400 | Bad Request | Invalid image format |
| 401 | Unauthorized | Missing JWT token |
| 403 | Forbidden | Not an official |
| 404 | Not Found | Issue doesn't exist |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Unexpected error |

## 🔍 Issue Status Values

| Status | Meaning | Next Action |
|--------|---------|------------|
| OPEN | Newly reported | Official reviews |
| UNDER_REVIEW | Official investigating | Upload resolution |
| RESOLVED | Fixed & verified | Archive |
| REJECTED | Invalid/duplicate | Don't pursue |

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080
# Kill it
kill -9 <PID>
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Connect manually
psql -h localhost -U safevoice_user -d safevoice_db
```

### Image Upload Fails
```bash
# Check S3 credentials in .env
# Ensure bucket exists
# Verify IAM permissions
```

### JWT Token Expired
```bash
# Login again to get new token
curl -X POST http://localhost:8080/api/auth/login \
  -d '{"email":"...","password":"..."}'
```

## 📞 Support Resources

- GitHub Issues: Report bugs
- Documentation: Check README.md first
- Email: support@safevoice.local
- Discord: Community channel

## 🎓 Learning Path

1. **Start**: Read README.md
2. **Setup**: Run `init.sh`
3. **Test**: Use API examples
4. **Develop**: Check DEVELOPMENT.md
5. **Deploy**: Follow AWS_DEPLOYMENT.md

## 🏆 Key Features Checklist

- ✅ Anonymous issue reporting
- ✅ AI content moderation
- ✅ Official authentication
- ✅ Issue resolution workflow
- ✅ AI verification
- ✅ Deepfake detection
- ✅ Rate limiting
- ✅ JWT security
- ✅ S3 storage
- ✅ Docker deployment
- ✅ Nginx reverse proxy
- ✅ PostgreSQL database

## 🚀 Next Steps

1. **Local Testing**: `docker-compose up`
2. **API Testing**: Use cURL/Postman examples
3. **Frontend Testing**: Open http://localhost:3000
4. **Customization**: Modify code as needed
5. **Deployment**: Follow AWS_DEPLOYMENT.md

## 📊 Performance Metrics

- **Image Upload**: < 500ms
- **Moderation Check**: < 2s
- **Verification**: < 3s
- **Database Query**: < 100ms
- **API Response**: < 200ms (avg)

## 🔄 Data Flow

```
User → Frontend → Nginx → Backend → PostgreSQL
                              ↓
                           S3 Storage
                              ↓
                         AI Service
```

## 📝 Version Info

- **SafeVoice**: v1.0.0
- **Spring Boot**: 3.2.0
- **React**: 18.2.0
- **FastAPI**: 0.104.1
- **PostgreSQL**: 15
- **Docker**: Latest

---

**Need help?** Check the documentation files or visit our support center.

**Ready to deploy?** Follow AWS_DEPLOYMENT.md for cloud setup.

**Happy coding!** 🎉
