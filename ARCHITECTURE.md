# UniMate Architecture Documentation

## Core Architecture Principles

### 1. Multi-Tenancy Model

**Tenant = University**

Every collection in the database includes a `tenantId` field. This ensures complete data isolation between universities.

- **TenantId Source**: Always extracted from verified JWT token, NEVER from client request
- **Data Isolation**: All queries automatically filter by `tenantId`
- **Security**: Tenant mismatch = access denied

### 2. Enrollment Model (Security Core)

**Class access MUST go through Enrollment**

The Enrollment model is the ONLY way users can access class data. This enforces class-scoped access control.

```
Enrollment {
  tenantId      // Tenant isolation
  userId        // User enrolled
  classId       // Class they're enrolled in
  roleInClass   // 'student' or 'teacher'
  status        // 'active', 'dropped', 'completed'
}
```

**Why This Matters:**
- A student can only see assignments for classes they're enrolled in
- A teacher can only grade students in their assigned classes
- No direct class access without enrollment verification

### 3. Authorization Model

**Authorization = Permission + Role + Enrollment + Tenant**

Never rely on role alone. Authorization requires:

1. **Tenant Match**: User's tenantId must match resource's tenantId
2. **Role Check**: User must have required role (student/teacher/admin)
3. **Enrollment Check**: For class-scoped resources, enrollment must exist
4. **Permission Check**: Specific permissions for the operation

**Example Flow:**
```
Student wants to view assignment:
1. Verify tenantId matches (from JWT)
2. Verify role is 'student'
3. Verify enrollment exists for class
4. Verify enrollment.roleInClass is 'student'
5. Grant access
```

### 4. Soft Delete

**Academic data must never be hard deleted**

All models support soft delete via `deletedAt` field:
- Records are marked as deleted, not removed
- Preserves data integrity and audit trails
- Allows data recovery if needed
- Queries automatically exclude deleted records

### 5. Audit Logging

**Every sensitive operation is logged**

The AuditLog collection tracks:
- Who performed the action (userId)
- What action was performed (action)
- What entity was affected (entity, entityId)
- When it happened (timestamp)
- Additional context (metadata)

**Mandatory for:**
- User creation/deletion
- Class enrollment changes
- Grade modifications
- Financial transactions
- Permission changes

## Data Flow

### Request Flow

```
1. Request arrives
   ↓
2. Request ID injected (for tracing)
   ↓
3. Rate limiting check (tenant-aware)
   ↓
4. Authentication middleware (JWT verification)
   ↓
5. Tenant extraction (from verified JWT)
   ↓
6. Role validation (if required)
   ↓
7. Enrollment validation (if class-scoped)
   ↓
8. Authorization service (permission check)
   ↓
9. Controller (HTTP handling)
   ↓
10. Service (business logic)
   ↓
11. Model (data access)
   ↓
12. Response
   ↓
13. Audit logging (async)
```

### Authorization Flow

```
User Request
   ↓
Extract tenantId from JWT (never from request)
   ↓
Check tenant status (active/suspended/archived)
   ↓
Check user role (student/teacher/admin)
   ↓
If class-scoped resource:
   ↓
   Check enrollment exists
   ↓
   Check enrollment.roleInClass matches requirement
   ↓
Check specific permissions
   ↓
Grant/Deny access
```

## Service Layer

**Business logic lives in services, not controllers**

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic and data operations
- **Models**: Define data structure and basic queries

**Benefits:**
- Reusable logic across different endpoints
- Easier testing
- Clear separation of concerns

## Error Handling

**Structured error responses with error codes**

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "NOT_ENROLLED",
    "message": "Not enrolled in this class",
    "requestId": "uuid-for-tracing",
    "metadata": {}
  }
}
```

**Error Codes:**
- `UNAUTHORIZED`: Authentication failed
- `FORBIDDEN`: Authorization failed
- `NOT_ENROLLED`: User not enrolled in class
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- And more...

## AI Integration Rules

**AI can only suggest, never mutate core data**

- AI service is a separate layer
- AI output is NEVER trusted (must be validated)
- AI operations are logged
- AI failures don't break core flows
- AI usage is rate-limited per tenant

## Security Checklist

✅ Every collection has `tenantId`  
✅ `tenantId` comes only from verified JWT  
✅ No API accepts `tenantId` from request  
✅ Class access requires enrollment verification  
✅ Role alone is never enough for authorization  
✅ All sensitive operations are audited  
✅ Soft delete for academic data  
✅ Rate limiting per tenant  
✅ Request ID for tracing  
✅ Structured error responses  

## Non-Negotiable Rules

1. ❌ **NEVER** trust client-provided tenantId
2. ❌ **NEVER** allow direct class access without enrollment
3. ❌ **NEVER** hard delete academic data
4. ❌ **NEVER** skip audit logging for sensitive operations
5. ❌ **NEVER** rely on role alone for authorization
6. ❌ **NEVER** trust AI output without validation
7. ✅ **ALWAYS** verify tenant match
8. ✅ **ALWAYS** check enrollment for class resources
9. ✅ **ALWAYS** use soft delete
10. ✅ **ALWAYS** log sensitive operations

## Extending the System

When adding new features:

1. **Add Model**: Include `tenantId`, add soft delete support
2. **Add Service**: Business logic in service layer
3. **Add Controller**: HTTP handling only
4. **Add Routes**: With proper middleware chain
5. **Add Authorization**: Use authorization service
6. **Add Audit**: Use audit middleware
7. **Add Tests**: Test tenant isolation and authorization

## Performance Considerations

- **Indexes**: All `tenantId` fields are indexed
- **Pagination**: All list endpoints are paginated
- **Rate Limiting**: Tenant-aware rate limiting
- **Query Optimization**: Queries filter by tenantId first

## Monitoring & Debugging

- **Request IDs**: Every request has unique ID for tracing
- **Audit Logs**: Complete audit trail of all operations
- **Error Logging**: Structured error logging with context
- **Performance**: Request duration logging
