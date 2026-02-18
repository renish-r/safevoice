# SafeVoice API Documentation

## Base URL
```
Local: http://localhost:8080
Production: https://api.safevoice.example.com
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer {token}
```

---

## Public Endpoints (No Authentication Required)

### 1. Report Civic Issue
**POST** `/api/problems`

Anonymous submission of a civic issue.

**Request** (multipart/form-data):
```json
{
  "imageFile": "<binary image data>",
  "description": "String (10-1000 chars)",
  "latitude": "Number (-90 to 90)",
  "longitude": "Number (-180 to 180)"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "imageUrl": "https://s3.amazonaws.com/safevoice-issues/problems/...",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "description": "Broken pothole on Main Street",
  "status": "OPEN",
  "aiModerationScore": 0.15,
  "createdAt": "2024-02-17T10:30:00Z",
  "updatedAt": "2024-02-17T10:30:00Z",
  "resolutionCount": 0
}
```

**Error Responses**:
- 400 Bad Request: Invalid image format or missing fields
- 413 Payload Too Large: Image > 5MB
- 429 Too Many Requests: Rate limit exceeded
- 422 Unprocessable Entity: Content rejected by moderation

**Rate Limit**: 30 requests/minute per IP

---

### 2. List All Issues
**GET** `/api/problems`

Retrieve paginated list of civic issues.

**Query Parameters**:
- `page`: Integer (0-based, default: 0)
- `size`: Integer (default: 10, max: 100)

**Response** (200 OK):
```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "imageUrl": "https://s3.amazonaws.com/...",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "description": "Issue description",
      "status": "OPEN",
      "aiModerationScore": 0.15,
      "createdAt": "2024-02-17T10:30:00Z",
      "updatedAt": "2024-02-17T10:30:00Z",
      "resolutionCount": 0
    }
  ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 42,
  "totalPages": 5,
  "isLast": false
}
```

**Example**:
```bash
curl http://localhost:8080/api/problems?page=0&size=20
```

---

### 3. Get Issue Details
**GET** `/api/problems/{id}`

Retrieve detailed information about a specific issue.

**Path Parameters**:
- `id`: UUID of the problem

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "imageUrl": "https://s3.amazonaws.com/...",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "description": "Broken pothole on Main Street",
  "status": "RESOLVED",
  "aiModerationScore": 0.15,
  "createdAt": "2024-02-17T10:30:00Z",
  "updatedAt": "2024-02-17T15:45:00Z",
  "resolutionCount": 1
}
```

**Error Responses**:
- 404 Not Found: Issue does not exist

**Example**:
```bash
curl http://localhost:8080/api/problems/550e8400-e29b-41d4-a716-446655440000
```

---

## Authentication Endpoints

### 4. Register Official
**POST** `/api/auth/register`

Register a new government official.

**Request** (application/json):
```json
{
  "email": "john.doe@city.gov",
  "password": "SecurePassword123!",
  "fullName": "John Doe",
  "officialIdNumber": "OFF-12345",
  "department": "Public Works"
}
```

**Response** (201 Created):
```json
"Official registered successfully. Awaiting admin verification."
```

**Error Responses**:
- 400 Bad Request: Validation failed
- 409 Conflict: Email or ID already registered

**Validation Rules**:
- Email: Valid email format
- Password: Minimum 8 characters
- Official ID: Must be unique
- Department: Required field

---

### 5. Official Login
**POST** `/api/auth/login`

Authenticate an official and receive JWT token.

**Request** (application/json):
```json
{
  "email": "john.doe@city.gov",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400000,
  "email": "john.doe@city.gov"
}
```

**Error Responses**:
- 401 Unauthorized: Invalid credentials
- 403 Forbidden: Account not verified or inactive

**Token Details**:
- Type: JWT with HS512 signature
- Expiration: 24 hours
- Contains: email, role, official ID

**Example**:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@city.gov",
    "password": "SecurePassword123!"
  }'
```

---

## Protected Endpoints (Requires JWT Authentication)

### 6. Update Problem Status
**PUT** `/api/problems/{id}/status`

Update the status of a civic issue (OFFICIAL role required).

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters**:
- `id`: UUID of the problem

**Request**:
```json
{
  "status": "UNDER_REVIEW"
}
```

**Valid Status Values**:
- `OPEN`: Issue newly reported
- `UNDER_REVIEW`: Official is investigating
- `RESOLVED`: Issue fixed and verified
- `REJECTED`: Issue not valid or duplicate

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "imageUrl": "https://s3.amazonaws.com/...",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "description": "Broken pothole on Main Street",
  "status": "UNDER_REVIEW",
  "aiModerationScore": 0.15,
  "createdAt": "2024-02-17T10:30:00Z",
  "updatedAt": "2024-02-17T11:00:00Z",
  "resolutionCount": 0
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid token
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Issue does not exist
- 400 Bad Request: Invalid status value

**Example**:
```bash
curl -X PUT http://localhost:8080/api/problems/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "UNDER_REVIEW"}'
```

---

### 7. Upload Resolution
**POST** `/api/official/resolutions`

Upload a resolution image for a civic issue (OFFICIAL role required).

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
```

**Request** (multipart/form-data):
```json
{
  "problemId": "550e8400-e29b-41d4-a716-446655440000",
  "resolvedImageFile": "<binary image data>"
}
```

**Response** (201 Created):
```json
{
  "id": "660f8500-f30c-51e5-b827-557766551111",
  "problemId": "550e8400-e29b-41d4-a716-446655440000",
  "officialId": "770g8600-g41d-62f6-c938-668877662222",
  "resolvedImageUrl": "https://s3.amazonaws.com/safevoice-issues/resolutions/...",
  "aiSimilarityScore": 0.85,
  "deepfakeDetected": false,
  "verificationStatus": "VERIFIED",
  "createdAt": "2024-02-17T12:00:00Z"
}
```

**Verification Process**:
1. Extract features from original and resolved images
2. Compute SSIM similarity score
3. Detect deepfakes using AI model
4. Determine verification status:
   - Deepfake detected → REJECTED
   - Similarity > 0.7 → VERIFIED
   - Similarity ≤ 0.7 → REJECTED

**Error Responses**:
- 401 Unauthorized: Missing or invalid token
- 403 Forbidden: Not an official
- 404 Not Found: Problem does not exist
- 400 Bad Request: Invalid image

**Example**:
```bash
curl -X POST http://localhost:8080/api/official/resolutions \
  -H "Authorization: Bearer $TOKEN" \
  -F "problemId=550e8400-e29b-41d4-a716-446655440000" \
  -F "resolvedImageFile=@resolved.jpg"
```

---

## AI Service Endpoints (Internal)

### 8. Content Moderation
**POST** `/api/ai/moderate`

Analyze image for inappropriate content (called internally).

**Request** (multipart/form-data):
```
file: <binary image data>
```

**Response** (200 OK):
```json
{
  "nsfw_score": 0.05,
  "violence_score": 0.10,
  "ocr_flag": false,
  "final_confidence": 0.075
}
```

**Score Interpretation**:
- 0.0 - 0.2: Very safe
- 0.2 - 0.5: Low risk
- 0.5 - 0.8: Moderate risk
- 0.8 - 1.0: High risk (rejection threshold: 0.8)

---

### 9. Resolution Verification
**POST** `/api/ai/verify`

Compare original and resolved images (called internally).

**Request** (multipart/form-data):
```
original: <binary image data>
resolved: <binary image data>
```

**Response** (200 OK):
```json
{
  "similarity_score": 0.85,
  "deepfake_detected": false,
  "verification_status": "VERIFIED",
  "confidence_score": 0.85
}
```

---

### 10. Health Check
**GET** `/health`

Check service health status.

**Response** (200 OK):
```json
{
  "status": "UP"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "timestamp": "2024-02-17T10:30:00Z",
  "path": "/api/problems"
}
```

### HTTP Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created
- **204 No Content**: Successful, no content
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: Missing/invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **413 Payload Too Large**: File exceeds size limit
- **422 Unprocessable Entity**: Business logic validation failed
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: External service unavailable

---

## Rate Limiting

All endpoints are rate limited per IP address:
- **General endpoints**: 30 requests/minute
- **Upload endpoints**: 10 requests/minute
- **Response header**: `Retry-After` (seconds until next request allowed)

**Rate Limit Exceeded Response**:
```
HTTP 429 Too Many Requests
Retry-After: 45
```

---

## Authentication Flow

1. **Register** → POST `/api/auth/register`
2. **Login** → POST `/api/auth/login` → Receive JWT token
3. **Use token** → Add `Authorization: Bearer {token}` header
4. **Token expires** → Get new token via login
5. **Logout** → Clear token from client storage

---

## Example Usage Scenarios

### Scenario 1: Anonymous User Reports Issue
```bash
# 1. Upload issue
curl -X POST http://localhost:8080/api/problems \
  -F "imageFile=@pothole.jpg" \
  -F "description=Large pothole blocking traffic" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"

# Response: Issue created with ID

# 2. Browse all issues
curl http://localhost:8080/api/problems?page=0&size=10

# 3. View specific issue
curl http://localhost:8080/api/problems/550e8400-e29b-41d4-a716-446655440000
```

### Scenario 2: Official Verifies Issue
```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"official@city.gov","password":"Pass123"}' | jq -r '.accessToken')

# 2. Update status
curl -X PUT http://localhost:8080/api/problems/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "UNDER_REVIEW"}'

# 3. Upload resolution
curl -X POST http://localhost:8080/api/official/resolutions \
  -H "Authorization: Bearer $TOKEN" \
  -F "problemId=550e8400-e29b-41d4-a716-446655440000" \
  -F "resolvedImageFile=@resolved.jpg"

# Response: Resolution verified or rejected
```

---

## API Testing Tools

- **cURL**: Command-line tool
- **Postman**: Desktop/web client
- **Insomnia**: REST client
- **Thunder Client**: VS Code extension
- **REST Client**: VS Code extension

---

## WebSocket Support (Future)

Real-time updates for status changes:
```
WS ws://localhost:8080/ws/problems/{id}
```

---

## Versioning

Current API Version: **v1**
- Format: `/api/v1/problems` (future)
- Backward compatibility: 2 versions maintained
- Deprecation notice: 3 months warning

---

## Rate Limit Headers

All responses include rate limit information:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1708142400
```

---

## Support

For API issues:
- Email: api-support@safevoice.local
- Docs: https://docs.safevoice.local
- Issues: https://github.com/safevoice/backend/issues
