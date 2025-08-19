# Admin Authentication Setup

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/your-database-name
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# JWT Secret Key (use a strong, random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## API Endpoints

### 1. Admin Signup
- **POST** `/api/auth/signup`
- **Body**: `{ "email": "admin@example.com", "password": "password123" }`
- **Response**: Creates admin account with hashed password

### 2. Admin Login
- **POST** `/api/auth/login`
- **Body**: `{ "email": "admin@example.com", "password": "password123" }`
- **Response**: Returns JWT token as httpOnly cookie

### 3. Admin Logout
- **POST** `/api/auth/logout`
- **Response**: Clears authentication cookie

### 4. Protected Admin Route
- **GET** `/api/admin/dashboard`
- **Headers**: Requires valid JWT token (automatically sent via cookie)
- **Response**: Admin dashboard data

## Testing the Authentication Flow

1. **Create Admin Account**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

2. **Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  -c cookies.txt
```

3. **Access Protected Route**:
```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -b cookies.txt
```

4. **Logout**:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

## Security Features

- **Password Hashing**: Uses bcryptjs with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **HttpOnly Cookies**: Prevents XSS attacks
- **Role-based Access**: Admin-only routes protection
- **Input Validation**: Email format and password length validation
