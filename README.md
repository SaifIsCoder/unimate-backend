# UniMate SaaS - Complete Education Management System

A comprehensive multi-tenant education management system with backend API, student mobile app, and admin/teacher web dashboard.

## 🏗️ System Architecture

UniMate consists of three main components:

1. **Backend API** (`/src`) - Node.js + Express + MongoDB
2. **Student Mobile App** (`/mobileapp`) - React Native + Expo
3. **Web Dashboard** (`/webapp`) - React + Vite

All components share the same backend API and follow strict security and architecture principles.

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [Quick Start](#quick-start)
- [Backend Setup](#backend-setup)
- [Mobile App Setup](#mobile-app-setup)
- [Web Dashboard Setup](#web-dashboard-setup)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Project Structure](#project-structure)

---

## 🎯 System Overview

### Backend API
- **Technology**: Node.js, Express, MongoDB (Mongoose)
- **Authentication**: JWT with access and refresh tokens
- **Multi-tenancy**: Complete data isolation per university
- **Security**: Enrollment-based access control, audit logging, soft delete

### Student Mobile App
- **Technology**: React Native, Expo, React Query
- **Platform**: iOS, Android
- **Features**: View assignments, submit files, view grades, attendance, fees
- **Security**: Secure token storage, never sends tenantId/role

### Web Dashboard
- **Technology**: React, Vite, React Router, React Query
- **Users**: Admins and Teachers
- **Features**: Full university management (admin) or class management (teacher)
- **Security**: Role-based UI, backend permission enforcement

---

## 🏛️ Architecture Principles

### Core Non-Negotiable Rules

1. ✅ **Every collection MUST include `tenantId`**
2. ✅ **`tenantId` comes ONLY from verified JWT**
3. ✅ **Never trust tenantId, role, or scope from client**
4. ✅ **Access to class data ONLY via Enrollment**
5. ✅ **Class is the operational unit**
6. ✅ **Academic structure is data-driven (no hardcoded semesters)**
7. ✅ **AI can only suggest, never modify core data**
8. ✅ **All APIs are tenant-safe by default**

### Security Model

- **Multi-tenancy**: Complete data isolation per university
- **Enrollment Model**: Class access only through enrollment verification
- **Authorization**: Permission + Role + Enrollment + Tenant
- **Audit Logging**: All sensitive operations are logged
- **Soft Delete**: Academic data is never hard deleted

📖 **See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation**

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or remote)
- npm or yarn

### 1. Clone and Setup Backend

```bash
# Install backend dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Seed initial data
npm run seed

# Start backend server
npm run dev
```

Backend runs on: `http://localhost:3000`

### 2. Setup Mobile App

```bash
cd mobileapp

# Install dependencies
npm install

# Create .env file
# EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# Start Expo
npm start
```

Mobile app accessible via Expo Go app or web.

### 3. Setup Web Dashboard

```bash
cd webapp

# Install dependencies
npm install

# Create .env file
# VITE_API_BASE_URL=http://localhost:3000

# Start development server
npm run dev
```

Web dashboard runs on: `http://localhost:3001`

---

## 🔧 Backend Setup

### Environment Variables

Create `.env` file in root:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/unimate
JWT_ACCESS_SECRET=your-super-secret-access-token-key
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Seed Data

After seeding, you can login with:
- **Email**: `admin@sampleuniversity.edu`
- **Password**: `admin123`
- **Tenant Code**: `SU`

### API Documentation

Interactive Swagger documentation available at:
- **URL**: `http://localhost:3000/api-docs`

### Key Features

- ✅ Multi-tenant architecture
- ✅ JWT authentication with refresh tokens
- ✅ Enrollment-based access control
- ✅ Soft delete for all academic data
- ✅ Comprehensive audit logging
- ✅ Pagination on all list endpoints
- ✅ Tenant-aware rate limiting
- ✅ Structured error responses

---

## 📱 Mobile App Setup

### Environment Variables

Create `mobileapp/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Running the App

```bash
cd mobileapp
npm start
```

Then:
- Scan QR code with Expo Go (iOS/Android)
- Press `w` to open in web browser
- Press `a` for Android emulator
- Press `i` for iOS simulator

### Features

- ✅ Secure token storage (expo-secure-store)
- ✅ Automatic token refresh
- ✅ Assignment file upload
- ✅ Profile image upload
- ✅ Offline-friendly with React Query caching
- ✅ Error handling on all screens

### App Screens

1. **Splash** - Token validation
2. **Login** - Authentication
3. **Home** - Dashboard with quick stats
4. **Assignments** - List and submit assignments
5. **Attendance** - View attendance records
6. **Grades** - View grades (read-only)
7. **Fees** - View fees and fines
8. **Events** - View events and announcements
9. **Profile** - View and edit profile

---

## 🖥️ Web Dashboard Setup

### Environment Variables

Create `webapp/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Running the Dashboard

```bash
cd webapp
npm run dev
```

Dashboard runs on: `http://localhost:3001`

### Features

- ✅ Role-based UI (admin/teacher)
- ✅ Automatic token refresh
- ✅ React Query for server state
- ✅ Permission-aware components
- ✅ Error boundaries

### Dashboard Pages

#### Shared (Admin + Teacher)
- **Dashboard** - Overview
- **Classes** - List and manage classes
- **Assignments** - Create and grade assignments
- **Attendance** - View and mark attendance
- **Grades** - View and enter grades

#### Admin Only
- **Departments** - CRUD operations
- **Programs** - CRUD operations
- **Academic Cycles** - CRUD operations
- **Users** - User management
- **Fees & Fines** - Financial management
- **Audit Logs** - System audit trail

---

## 📡 API Documentation

### Base URL

All APIs are under `/api/v1`

### Authentication

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

### Common Endpoints

#### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

#### Classes
- `GET /api/v1/classes` - List classes
- `GET /api/v1/classes/:id` - Get class details
- `POST /api/v1/classes` - Create class (admin)

#### Assignments
- `GET /api/v1/assignments` - List assignments
- `GET /api/v1/assignments/:id` - Get assignment
- `POST /api/v1/assignments` - Create assignment (teacher/admin)

#### Student Endpoints
- `GET /api/v1/students/assignments` - Student's assignments
- `POST /api/v1/students/assignments/:id/submit` - Submit assignment
- `GET /api/v1/students/attendance` - Student's attendance
- `GET /api/v1/students/grades` - Student's grades
- `GET /api/v1/students/fees` - Student's fees

**📖 See Swagger UI at `/api-docs` for complete API documentation**

---

## 🔒 Security

### Backend Security

- ✅ Tenant isolation enforced at middleware level
- ✅ Enrollment verification for class access
- ✅ Role-based access control
- ✅ JWT token validation
- ✅ Rate limiting per tenant
- ✅ Audit logging for all sensitive operations
- ✅ Soft delete (no hard deletes)

### Client Security

- ✅ Never sends `tenantId`, `role`, or `classId`
- ✅ Tokens stored securely (SecureStore on mobile, localStorage on web)
- ✅ Automatic token refresh
- ✅ Backend is single source of truth
- ✅ All permissions enforced by backend

### Security Checklist

- [x] Every collection has `tenantId`
- [x] `tenantId` from verified JWT only
- [x] No API accepts `tenantId` from request
- [x] Class access requires enrollment
- [x] Role alone is never enough
- [x] All sensitive operations audited
- [x] Soft delete for academic data
- [x] Rate limiting per tenant
- [x] Request ID for tracing

---

## 📁 Project Structure

```
unimate-saas/
├── src/                    # Backend API
│   ├── models/            # Mongoose models (18 models)
│   ├── routes/            # API routes
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── middlewares/      # Auth, role, enrollment, etc.
│   ├── utils/             # Utilities
│   ├── config/            # Configuration
│   └── scripts/           # Seed scripts
│
├── mobileapp/             # Student Mobile App
│   ├── app/               # Expo Router screens
│   │   ├── (auth)/       # Authentication
│   │   └── (tabs)/       # Main tabs
│   ├── src/
│   │   ├── api/          # API service layer
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utilities
│   └── package.json
│
├── webapp/                 # Web Dashboard
│   ├── src/
│   │   ├── api/          # API service layer
│   │   ├── contexts/     # Auth context
│   │   ├── layouts/      # Layout components
│   │   ├── pages/        # Page components
│   │   └── utils/        # Utilities
│   └── package.json
│
├── package.json           # Backend dependencies
├── README.md             # This file
└── ARCHITECTURE.md      # Architecture documentation
```

---

## 🧪 Testing the System

### 1. Backend Health Check

```bash
curl http://localhost:3000/health
```

### 2. Login (Backend)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sampleuniversity.edu",
    "password": "admin123",
    "tenantCode": "SU"
  }'
```

### 3. Access Swagger UI

Open browser: `http://localhost:3000/api-docs`

### 4. Test Mobile App

- Install Expo Go on your phone
- Scan QR code from `npm start` in mobileapp
- Login with seeded credentials

### 5. Test Web Dashboard

- Open `http://localhost:3001`
- Login with seeded credentials
- Explore admin features

---

## 🔄 Data Flow

### Authentication Flow

```
1. User logs in → Backend validates
2. Backend returns accessToken + refreshToken
3. Client stores tokens securely
4. Client includes accessToken in all requests
5. On 401 → Client refreshes token automatically
6. On refresh failure → Client logs out
```

### Authorization Flow

```
1. Request arrives at backend
2. Extract tenantId from verified JWT
3. Check user role from verified JWT
4. If class-scoped: Verify enrollment exists
5. Check specific permissions
6. Grant/Deny access
```

### Enrollment Model (Security Core)

```
User wants to access class data:
1. Backend checks Enrollment collection
2. Verifies: tenantId + userId + classId match
3. Verifies: enrollment.status === 'active'
4. Verifies: enrollment.roleInClass matches requirement
5. Grants access only if all checks pass
```

---

## 🛠️ Development

### Backend Development

```bash
# Start with nodemon (auto-reload)
npm run dev

# Run seed script
npm run seed

# Check logs
# Server logs to console
```

### Mobile App Development

```bash
cd mobileapp
npm start

# Open in iOS simulator
npm run ios

# Open in Android emulator
npm run android
```

### Web Dashboard Development

```bash
cd webapp
npm run dev

# Build for production
npm run build
```

---

## 📊 Key Features

### Multi-Tenancy
- Complete data isolation per university
- Tenant-aware rate limiting
- Tenant status checking (active/suspended)

### Enrollment Model
- Class access only through enrollment
- Role in class (student/teacher)
- Enrollment status tracking

### Soft Delete
- All academic data uses soft delete
- `deletedAt` field on all models
- Queries automatically exclude deleted records

### Audit Logging
- All sensitive operations logged
- Track who did what, when
- Filterable audit trail

### Pagination
- All list endpoints paginated
- Default: 20 items per page
- Max: 100 items per page

---

## 🚨 Important Notes

### What the System Does

✅ Enforces tenant isolation  
✅ Verifies enrollment for class access  
✅ Logs all sensitive operations  
✅ Uses soft delete for data integrity  
✅ Handles token refresh automatically  
✅ Respects backend permissions  

### What the System Never Does

❌ Never trusts client-provided tenantId  
❌ Never allows direct class access without enrollment  
❌ Never hard deletes academic data  
❌ Never skips audit logging  
❌ Never relies on role alone for authorization  
❌ Never sends tenantId/role from clients  

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed architecture documentation
- **[Backend README](./README.md)** - Backend-specific documentation
- **[Mobile App README](./mobileapp/README.md)** - Mobile app documentation
- **[Web Dashboard README](./webapp/README.md)** - Web dashboard documentation
- **Swagger UI** - Interactive API documentation at `/api-docs`

---

## 🤝 Contributing

When adding new features:

1. **Backend**: Add model → service → controller → route
2. **Mobile**: Add API call → screen → navigation
3. **Web**: Add API call → page → route
4. **Always**: Verify tenant isolation, add audit logs, handle errors

---

## 📝 License

ISC

---

## 🆘 Troubleshooting

### Backend won't start
- Check MongoDB is running
- Verify `.env` file exists and has correct values
- Check port 3000 is not in use

### Mobile app can't connect
- Verify `EXPO_PUBLIC_API_BASE_URL` in `.env`
- Check backend is running
- Try using IP address instead of localhost

### Web dashboard can't connect
- Verify `VITE_API_BASE_URL` in `.env`
- Check backend is running
- Check browser console for errors

### Token refresh issues
- Verify JWT secrets in backend `.env`
- Check token expiry times
- Clear storage and login again

---

## 🎯 Next Steps

1. **Backend**: Add more endpoints as needed
2. **Mobile**: Add more student features
3. **Web**: Add more admin/teacher features
4. **All**: Add comprehensive tests
5. **All**: Add CI/CD pipeline

---

## 📞 Support

For issues or questions:
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Review API documentation at `/api-docs`
- Check individual component READMEs

---

**Built with ❤️ for education management**
