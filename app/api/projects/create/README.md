# Project Creation API Documentation

## Endpoint Overview

**POST** `/api/projects/create`

Creates a new research project with optional document attachment.

---

## Authentication

**Required**: Yes

The user must be authenticated via Supabase Auth. The API uses server-side authentication to verify the user's identity.

```typescript
// Authentication is checked automatically
const { data: { user }, error: authError } = await supabase.auth.getUser();
```

---

## Request Format

**Content-Type**: `multipart/form-data`

### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Project title |
| `description` | string | Yes | Project description |
| `file` | File | No | Document file (PDF, DOC, DOCX) |
| `documentUrl` | string | No | External document URL |

### Constraints

- **Mutual Exclusivity**: Only `file` OR `documentUrl` can be provided, not both
- **File Types**: `.pdf`, `.doc`, `.docx`
- **File Size**: Maximum 10MB
- **URL Format**: Must be a valid URL

---

## Request Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Create form data
const formData = new FormData();
formData.append('title', 'AI Research Project');
formData.append('description', 'Exploring machine learning applications');

// Option 1: With file upload
const file = document.getElementById('fileInput').files[0];
formData.append('file', file);

// Option 2: With external URL
formData.append('documentUrl', 'https://example.com/proposal.pdf');

// Make request
const response = await fetch('/api/projects/create', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

### cURL

```bash
# With file upload
curl -X POST http://localhost:3000/api/projects/create \
  -H "Cookie: your-auth-cookie" \
  -F "title=My Research Project" \
  -F "description=This is my project description" \
  -F "file=@/path/to/document.pdf"

# With URL
curl -X POST http://localhost:3000/api/projects/create \
  -H "Cookie: your-auth-cookie" \
  -F "title=My Research Project" \
  -F "description=This is my project description" \
  -F "documentUrl=https://example.com/document.pdf"
```

---

## Response Format

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "projectCode": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "message": "Project created successfully"
}
```

**Fields**:
- `success` (boolean): Always `true` on success
- `projectId` (string): UUID of the created project
- `projectCode` (string): UUID for team invitations
- `message` (string): Success message

### Error Responses

#### 401 Unauthorized

User is not authenticated.

```json
{
  "error": "Unauthorized"
}
```

#### 400 Bad Request

Validation errors.

```json
{
  "error": "Title and description are required"
}
```

```json
{
  "error": "Only one attachment method allowed (file OR URL)"
}
```

```json
{
  "error": "Invalid URL format"
}
```

```json
{
  "error": "Only PDF, DOC, and DOCX files are allowed"
}
```

```json
{
  "error": "File size must be less than 10MB"
}
```

#### 500 Internal Server Error

Server or database errors.

```json
{
  "error": "Failed to upload document"
}
```

```json
{
  "error": "Failed to create project"
}
```

---

## Workflow

### 1. Validation

Server validates:
- User authentication
- Required fields (title, description)
- File or URL (if provided)
- Mutual exclusivity of file and URL

### 2. File Processing (if file uploaded)

```typescript
// Generate unique filename
const fileName = `${uuidv4()}.${fileExtension}`;
const filePath = `${userId}/${fileName}`;

// Upload to Supabase Storage
await supabase.storage
  .from('project_documents')
  .upload(filePath, fileBuffer);

// Get public URL
const { data: urlData } = supabase.storage
  .from('project_documents')
  .getPublicUrl(filePath);
```

### 3. Database Operations

```typescript
// Insert project
const project = await supabase
  .from('projects')
  .insert({
    project_code: uuidv4(),
    title,
    description,
    project_type: 'research',
    status: 'proposal',
    created_by: userId,
    document_reference: documentPath,
    // ... other fields
  });

// Add creator as leader
await supabase
  .from('project_members')
  .insert({
    project_id: project.id,
    user_id: userId,
    role: 'leader',
  });
```

### 4. Response

Return project ID and code for frontend redirection.

---

## Database Impact

### Tables Modified

#### `projects`

**Operation**: INSERT

```sql
INSERT INTO projects (
  id,
  project_code,
  title,
  description,
  project_type,
  status,
  document_reference,
  created_by,
  keywords,
  paper_standard,
  created_at,
  updated_at
) VALUES (...);
```

#### `project_members`

**Operation**: INSERT

```sql
INSERT INTO project_members (
  id,
  project_id,
  user_id,
  role,
  joined_at
) VALUES (...);
```

### Storage Impact

**Bucket**: `project_documents`

**Path Structure**: `{userId}/{fileUuid}.{extension}`

**Example**: `550e8400-e29b-41d4-a716-446655440000/7c9e6679-7425-40de-944b-e07fc1f90ae7.pdf`

---

## Security

### Authentication

- Uses Supabase SSR for server-side auth
- Validates user session before processing
- Returns 401 if not authenticated

### Authorization

- User ID automatically set as `created_by`
- RLS policies ensure users can only access their projects

### File Upload Security

1. **Type Validation**: MIME type checking
2. **Size Limit**: Enforced at 10MB
3. **Unique Filenames**: UUID-based naming prevents collisions
4. **User Folders**: Files isolated by user ID
5. **Public Read**: Files readable but not writable by public

### Input Sanitization

- Supabase SDK handles SQL injection prevention
- React handles XSS prevention
- URL validation prevents malformed URLs

---

## Error Handling

### Client-Side Errors

Catch and display to user:

```typescript
try {
  const response = await fetch('/api/projects/create', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create project');
  }
  
  // Success: redirect to project detail
  router.push(`/student/projects/${data.projectId}`);
} catch (error) {
  // Display error to user
  setErrors({ general: error.message });
}
```

### Server-Side Errors

All errors are logged and returned with appropriate status codes:

```typescript
try {
  // ... operation
} catch (error) {
  console.error('Error creating project:', error);
  return NextResponse.json(
    { error: error.message || 'Internal server error' },
    { status: 500 }
  );
}
```

---

## Rate Limiting

**Not Implemented**: Consider adding rate limiting in production to prevent abuse.

**Recommendation**:
- Limit to 10 projects per user per hour
- Use middleware or API gateway for rate limiting

---

## Testing

### Unit Test Example

```typescript
import { POST } from './route';

describe('POST /api/projects/create', () => {
  it('should create project with valid data', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Project');
    formData.append('description', 'Test Description');
    
    const response = await POST(
      new Request('http://localhost/api/projects/create', {
        method: 'POST',
        body: formData,
      })
    );
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.projectId).toBeDefined();
  });
  
  it('should reject missing title', async () => {
    const formData = new FormData();
    formData.append('description', 'Test Description');
    
    const response = await POST(
      new Request('http://localhost/api/projects/create', {
        method: 'POST',
        body: formData,
      })
    );
    
    expect(response.status).toBe(400);
  });
});
```

### Integration Testing

Use tools like:
- Postman
- Insomnia
- Thunder Client (VS Code)

---

## Performance Considerations

### Optimization Tips

1. **File Upload**:
   - Consider chunked uploads for large files
   - Implement upload progress tracking
   - Add client-side compression

2. **Database**:
   - Indexes already created for common queries
   - Consider caching frequently accessed projects

3. **Storage**:
   - Use CDN for file delivery (Supabase provides this)
   - Implement lazy loading for file previews

---

## Monitoring

### Recommended Metrics

- Request count and success rate
- Average response time
- File upload success rate
- Error rate by type
- User creation patterns

### Logging

Currently logs:
- Authentication errors
- File upload errors
- Database errors
- General exceptions

---

## Changelog

### Version 1.0.0 (2026-01-09)

**Initial Release**
- ✅ Project creation endpoint
- ✅ File upload support
- ✅ URL attachment support
- ✅ Validation and error handling
- ✅ Database integration
- ✅ Authentication and authorization

---

## Support

For issues or questions:
1. Check error messages in response
2. Verify database schema is set up
3. Check Supabase logs
4. Review authentication setup

---

**Maintained by**: Student Research Portal Team  
**Last Updated**: January 9, 2026  
**API Version**: 1.0.0
