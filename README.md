# Finance Dashboard Backend

A RESTful backend API for a finance dashboard system with role-based access control, built with Node.js, Express, and MongoDB.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs

---

## Project Structure

```
finance-backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, me
│   ├── userController.js      # User management (admin)
│   ├── recordController.js    # Financial records CRUD
│   └── dashboardController.js # Aggregated analytics
├── middleware/
│   ├── auth.js                # JWT authentication
│   ├── roleCheck.js           # Role-based access control
│   └── errorHandler.js        # Centralized error handling
├── models/
│   ├── User.js                # User schema
│   └── Record.js              # Financial record schema
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── recordRoutes.js
│   └── dashboardRoutes.js
├── scripts/
│   └── seed.js                # Demo data seeder
├── app.js
├── server.js
├── package.json
├── .env.example
└── README.md
```

---

## Setup & Running

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and a strong JWT secret
```

### 3. (Optional) Seed demo data

```bash
npm run seed
```

This creates 3 demo users and 60 sample financial records.

### 4. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`

---

## Environment Variables

| Variable         | Description                       | Default    |
|------------------|-----------------------------------|------------|
| `PORT`           | Port to run the server on         | `5000`     |
| `MONGO_URI`      | MongoDB connection string         | (required) |
| `JWT_SECRET`     | Secret key for signing JWT tokens | (required) |
| `JWT_EXPIRES_IN` | JWT expiry duration               | `7d`       |

---

## Roles & Permissions

| Action                           | Viewer | Analyst | Admin |
|----------------------------------|--------|---------|-------|
| View financial records           | ✅     | ✅      | ✅    |
| Create / Update / Delete records |        |         | ✅    |
| Access dashboard analytics       |        | ✅      | ✅    |
| Manage users                     |        |         | ✅    |

---

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "message": "Descriptive error message here"
}
```

| Status Code | Meaning                              |
|-------------|--------------------------------------|
| `200`       | Success                              |
| `201`       | Created                              |
| `400`       | Bad Request / Validation Error       |
| `401`       | Unauthorized (missing/invalid token) |
| `403`       | Forbidden (insufficient role)        |
| `404`       | Not Found                            |
| `409`       | Conflict (e.g. duplicate email)      |
| `500`       | Internal Server Error                |

---

## API Usage

All protected routes require this header:

```
Authorization: Bearer <your_jwt_token>
```

---

### Auth

#### `POST /api/auth/register`

Register a new user. The `role` field is optional and defaults to `viewer`.

**Input:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "analyst"
}
```

| Field      | Type   | Required | Notes                              |
|------------|--------|----------|------------------------------------|
| `name`     | string | ✅       |                                    |
| `email`    | string | ✅       | Must be unique                     |
| `password` | string | ✅       | Minimum 6 characters               |
| `role`     | string | ❌       | `viewer` / `analyst` / `admin`, defaults to `viewer` |

**Output (201):**

```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "analyst"
  }
}
```

**Failure cases:**

```json
// 400 — missing required fields
{ "message": "name, email, and password are required" }

// 400 — password too short
{ "message": "Password must be at least 6 characters" }

// 409 — email already in use
{ "message": "email already exists" }
```

---

#### `POST /api/auth/login`

Authenticate a user and receive a JWT token.

**Input:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

| Field      | Type   | Required |
|------------|--------|----------|
| `email`    | string | ✅       |
| `password` | string | ✅       |

**Output (200):**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "analyst"
  }
}
```

**Failure cases:**

```json
// 400 — missing fields
{ "message": "email and password are required" }

// 401 — wrong credentials
{ "message": "Invalid credentials" }

// 403 — account disabled by admin
{ "message": "Account is inactive" }
```

---

#### `GET /api/auth/me`

Returns the currently authenticated user's profile. Requires any valid token.

**Input:** None (token in header only)

**Output (200):**

```json
{
  "id": "665f1a2b3c4d5e6f7a8b9c0d",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "analyst",
  "isActive": true
}
```

**Failure cases:**

```json
// 401 — no token
{ "message": "No token provided" }

// 401 — bad token
{ "message": "Invalid or expired token" }
```

---

### Users *(Admin only)*

#### `GET /api/users`

Returns a list of all users. Password is never included.

**Input:** None

**Output (200):**

```json
[
  {
    "_id": "665f1a2b3c4d5e6f7a8b9c0d",
    "name": "Admin User",
    "email": "admin@finance.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-06-15T10:00:00.000Z",
    "updatedAt": "2024-06-15T10:00:00.000Z"
  },
  {
    "_id": "665f1a2b3c4d5e6f7a8b9c0e",
    "name": "Analyst User",
    "email": "analyst@finance.com",
    "role": "analyst",
    "isActive": true,
    "createdAt": "2024-06-15T10:01:00.000Z",
    "updatedAt": "2024-06-15T10:01:00.000Z"
  }
]
```

**Failure cases:**

```json
// 403 — non-admin token
{ "message": "Access denied. Required role: admin" }
```

---

#### `GET /api/users/:id`

Returns a single user by their MongoDB ID.

**Input:** ID in URL path

**Output (200):**

```json
{
  "_id": "665f1a2b3c4d5e6f7a8b9c0e",
  "name": "Analyst User",
  "email": "analyst@finance.com",
  "role": "analyst",
  "isActive": true,
  "createdAt": "2024-06-15T10:01:00.000Z",
  "updatedAt": "2024-06-15T10:01:00.000Z"
}
```

**Failure cases:**

```json
// 404 — ID not found
{ "message": "User not found" }

// 400 — malformed ID
{ "message": "Invalid ID format" }
```

---

#### `PUT /api/users/:id`

Updates a user's name, role, or active status. All fields are optional — only send what you want to change.

**Input:**

```json
{
  "name": "Updated Name",
  "role": "admin",
  "isActive": false
}
```

| Field      | Type    | Required | Notes                             |
|------------|---------|----------|-----------------------------------|
| `name`     | string  | ❌       |                                   |
| `role`     | string  | ❌       | `viewer` / `analyst` / `admin`    |
| `isActive` | boolean | ❌       | Set to `false` to disable account |

**Output (200):**

```json
{
  "message": "User updated",
  "user": {
    "_id": "665f1a2b3c4d5e6f7a8b9c0e",
    "name": "Updated Name",
    "email": "analyst@finance.com",
    "role": "admin",
    "isActive": false
  }
}
```

**Failure cases:**

```json
// 400 — invalid role value
{ "message": "Invalid role" }

// 404 — user not found
{ "message": "User not found" }
```

---

#### `DELETE /api/users/:id`

Permanently deletes a user. Admins cannot delete their own account.

**Input:** ID in URL path

**Output (200):**

```json
{
  "message": "User deleted"
}
```

**Failure cases:**

```json
// 400 — trying to delete own account
{ "message": "You cannot delete your own account" }

// 404 — user not found
{ "message": "User not found" }
```

---

### Financial Records

#### `POST /api/records` *(Admin only)*

Creates a new financial record.

**Input:**

```json
{
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "date": "2024-06-01",
  "description": "June salary payment"
}
```

| Field         | Type   | Required | Notes                       |
|---------------|--------|----------|-----------------------------|
| `amount`      | number | ✅       | Must be a positive number   |
| `type`        | string | ✅       | `income` or `expense`       |
| `category`    | string | ✅       |                             |
| `date`        | string | ✅       | ISO date format `YYYY-MM-DD`|
| `description` | string | ❌       | Defaults to empty string    |

**Output (201):**

```json
{
  "message": "Record created",
  "record": {
    "_id": "665f1b3c4d5e6f7a8b9c0d1e",
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "date": "2024-06-01T00:00:00.000Z",
    "description": "June salary payment",
    "createdBy": "665f1a2b3c4d5e6f7a8b9c0d",
    "isDeleted": false,
    "createdAt": "2024-06-15T10:30:00.000Z",
    "updatedAt": "2024-06-15T10:30:00.000Z"
  }
}
```

**Failure cases:**

```json
// 400 — missing required fields
{ "message": "amount, type, category, and date are required" }

// 400 — invalid amount
{ "message": "amount must be a positive number" }

// 400 — invalid type
{ "message": "type must be \"income\" or \"expense\"" }

// 400 — invalid date
{ "message": "Invalid date format" }

// 403 — non-admin
{ "message": "Access denied. Required role: admin" }
```

---

#### `GET /api/records` *(All roles)*

Returns a paginated list of records. Supports filtering and search via query parameters.

**Query Parameters:**

| Param       | Type   | Description                                           | Example                   |
|-------------|--------|-------------------------------------------------------|---------------------------|
| `type`      | string | Filter by `income` or `expense`                       | `?type=expense`           |
| `category`  | string | Partial, case-insensitive match on category           | `?category=food`          |
| `startDate` | string | Records on or after this date (`YYYY-MM-DD`)          | `?startDate=2024-01-01`   |
| `endDate`   | string | Records on or before this date (`YYYY-MM-DD`)         | `?endDate=2024-12-31`     |
| `search`    | string | Searches both category and description fields         | `?search=salary`          |
| `page`      | number | Page number (default: `1`)                            | `?page=2`                 |
| `limit`     | number | Results per page (default: `20`, max: `100`)          | `?limit=10`               |

**Input:** Query params only, no body

**Output (200):**

```json
{
  "records": [
    {
      "_id": "665f1b3c4d5e6f7a8b9c0d1e",
      "amount": 5000,
      "type": "income",
      "category": "Salary",
      "date": "2024-06-01T00:00:00.000Z",
      "description": "June salary payment",
      "isDeleted": false,
      "createdBy": {
        "_id": "665f1a2b3c4d5e6f7a8b9c0d",
        "name": "Admin User",
        "email": "admin@finance.com"
      },
      "createdAt": "2024-06-15T10:30:00.000Z",
      "updatedAt": "2024-06-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Failure cases:**

```json
// 400 — invalid type filter
{ "message": "type must be \"income\" or \"expense\"" }

// 401 — no token
{ "message": "No token provided" }
```

---

#### `GET /api/records/:id` *(All roles)*

Returns a single financial record by ID. The `createdBy` field is populated with the user's name and email.

**Input:** ID in URL path

**Output (200):**

```json
{
  "_id": "665f1b3c4d5e6f7a8b9c0d1e",
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "date": "2024-06-01T00:00:00.000Z",
  "description": "June salary payment",
  "isDeleted": false,
  "createdBy": {
    "_id": "665f1a2b3c4d5e6f7a8b9c0d",
    "name": "Admin User",
    "email": "admin@finance.com"
  },
  "createdAt": "2024-06-15T10:30:00.000Z",
  "updatedAt": "2024-06-15T10:30:00.000Z"
}
```

**Failure cases:**

```json
// 404 — not found
{ "message": "Record not found" }

// 400 — malformed ID
{ "message": "Invalid ID format" }
```

---

#### `PUT /api/records/:id` *(Admin only)*

Updates any combination of fields on a record. All fields are optional.

**Input:**

```json
{
  "amount": 5500,
  "type": "income",
  "category": "Salary",
  "date": "2024-06-02",
  "description": "Updated description"
}
```

| Field         | Type   | Required | Notes                       |
|---------------|--------|----------|-----------------------------|
| `amount`      | number | ❌       | Must be positive if provided|
| `type`        | string | ❌       | `income` or `expense`       |
| `category`    | string | ❌       |                             |
| `date`        | string | ❌       | ISO date format             |
| `description` | string | ❌       |                             |

**Output (200):**

```json
{
  "message": "Record updated",
  "record": {
    "_id": "665f1b3c4d5e6f7a8b9c0d1e",
    "amount": 5500,
    "type": "income",
    "category": "Salary",
    "date": "2024-06-02T00:00:00.000Z",
    "description": "Updated description",
    "isDeleted": false,
    "createdBy": "665f1a2b3c4d5e6f7a8b9c0d",
    "createdAt": "2024-06-15T10:30:00.000Z",
    "updatedAt": "2024-06-15T11:00:00.000Z"
  }
}
```

**Failure cases:**

```json
// 400 — invalid amount
{ "message": "amount must be a positive number" }

// 400 — invalid type
{ "message": "type must be \"income\" or \"expense\"" }

// 404 — record not found
{ "message": "Record not found" }

// 403 — non-admin
{ "message": "Access denied. Required role: admin" }
```

---

#### `DELETE /api/records/:id` *(Admin only)*

Soft-deletes a record by setting `isDeleted: true`. The record is hidden from all listing and lookup endpoints but remains in the database.

**Input:** ID in URL path

**Output (200):**

```json
{
  "message": "Record deleted"
}
```

**Failure cases:**

```json
// 404 — record not found
{ "message": "Record not found" }

// 403 — non-admin
{ "message": "Access denied. Required role: admin" }
```

---

### Dashboard *(Analyst and Admin only)*

All dashboard endpoints are blocked for `viewer` role:

```json
// 403
{ "message": "Access denied. Minimum required role: analyst" }
```

---

#### `GET /api/dashboard/summary`

Returns overall financial totals across all records.

**Input:** None

**Output (200):**

```json
{
  "totalIncome": 18500,
  "totalExpense": 6340,
  "netBalance": 12160
}
```

---

#### `GET /api/dashboard/category-totals`

Returns totals grouped by category and type, sorted by total descending. Optionally filter by type.

**Query Parameters:**

| Param  | Type   | Description                      | Example         |
|--------|--------|----------------------------------|-----------------|
| `type` | string | Filter to `income` or `expense`  | `?type=expense` |

**Input:** Query params only, no body

**Output (200):**

```json
[
  {
    "category": "Salary",
    "type": "income",
    "total": 15000,
    "count": 3
  },
  {
    "category": "Rent",
    "type": "expense",
    "total": 3600,
    "count": 3
  },
  {
    "category": "Food",
    "type": "expense",
    "total": 1200,
    "count": 8
  },
  {
    "category": "Freelance",
    "type": "income",
    "total": 3500,
    "count": 5
  }
]
```

---

#### `GET /api/dashboard/recent`

Returns the most recent transactions sorted by date descending.

**Query Parameters:**

| Param   | Type   | Description                             | Example      |
|---------|--------|-----------------------------------------|--------------|
| `limit` | number | Number of records to return (max: `50`) | `?limit=5`   |

**Input:** Query params only, no body

**Output (200):**

```json
[
  {
    "_id": "665f1b3c4d5e6f7a8b9c0d1e",
    "amount": 800,
    "type": "income",
    "category": "Freelance",
    "date": "2024-06-15T00:00:00.000Z",
    "description": "Design project payment",
    "createdBy": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "name": "Admin User",
      "email": "admin@finance.com"
    }
  },
  {
    "_id": "665f1b3c4d5e6f7a8b9c0d1f",
    "amount": 350,
    "type": "expense",
    "category": "Food",
    "date": "2024-06-10T00:00:00.000Z",
    "description": "Grocery shopping",
    "createdBy": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "name": "Admin User",
      "email": "admin@finance.com"
    }
  }
]
```

---

#### `GET /api/dashboard/monthly-summary`

Returns income, expense, and net for each of the 12 months in a given year. Months with no activity are included with zero values.

**Query Parameters:**

| Param  | Type   | Description                              | Example      |
|--------|--------|------------------------------------------|--------------|
| `year` | number | Year to summarize (defaults to current)  | `?year=2024` |

**Input:** Query params only, no body

**Output (200):**

```json
{
  "year": 2024,
  "months": [
    { "month": 1,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 2,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 3,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 4,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 5,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 6,  "income": 18500, "expense": 6340, "net": 12160 },
    { "month": 7,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 8,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 9,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 10, "income": 0,     "expense": 0,    "net": 0     },
    { "month": 11, "income": 0,     "expense": 0,    "net": 0     },
    { "month": 12, "income": 0,     "expense": 0,    "net": 0     }
  ]
}
```

---

#### `GET /api/dashboard/weekly-summary`

Returns income, expense, and net for each of the last 7 calendar days. All 7 days are always present — days with no activity show as zero.

**Input:** None

**Output (200):**

```json
[
  { "day": "2024-06-09", "income": 0,   "expense": 0,   "net": 0   },
  { "day": "2024-06-10", "income": 0,   "expense": 350, "net": -350 },
  { "day": "2024-06-11", "income": 0,   "expense": 0,   "net": 0   },
  { "day": "2024-06-12", "income": 0,   "expense": 0,   "net": 0   },
  { "day": "2024-06-13", "income": 0,   "expense": 0,   "net": 0   },
  { "day": "2024-06-14", "income": 0,   "expense": 0,   "net": 0   },
  { "day": "2024-06-15", "income": 800, "expense": 0,   "net": 800 }
]
```

---

## Demo Accounts (after seeding)

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@finance.com   | admin123   |
| Analyst | analyst@finance.com | analyst123 |
| Viewer  | viewer@finance.com  | viewer123  |

---

## Assumptions & Design Decisions

1. **Role assignment on register:** The `role` field is accepted during registration for convenience in this assessment context. In a production system, only admins would be able to assign elevated roles.

2. **Soft delete for records:** Financial records use `isDeleted: true` instead of hard deletion to preserve data integrity and audit history. A Mongoose pre-query hook automatically excludes deleted records from all queries. Aggregation pipelines manually apply this filter since they bypass Mongoose middleware.

3. **Dashboard access level:** Dashboard endpoints require at least `analyst` role. Viewers are intentionally excluded as they represent read-only access to raw records, not aggregated insights.

4. **No rate limiting:** Not implemented to keep the codebase focused. Can be added easily with the `express-rate-limit` package.

5. **Pagination defaults:** Records default to 20 per page with a max of 100. Dashboard `/recent` defaults to 10 with a max of 50.

6. **Date handling:** All dates are stored as UTC in MongoDB. The `date` field on a record represents the actual transaction date, not the creation timestamp (`createdAt` handles that).

7. **Password security:** Passwords are hashed with bcrypt (cost factor 10) before storage. Plain-text passwords are never stored or returned in any response.

8. **Zero-filled time series:** Monthly and weekly summary endpoints always return a complete set of time slots (12 months or 7 days) with zeroes for periods that have no data. This simplifies frontend chart rendering by guaranteeing a consistent array length.