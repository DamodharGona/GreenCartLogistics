# GreenCart Logistics Backend

Backend API for GreenCart Logistics delivery simulation and management system.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with bcrypt
- **Documentation:** Swagger/OpenAPI
- **Environment:** Direct .env file usage

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   - Copy `env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL connection string
   - Set `JWT_SECRET` for authentication
   - Configure other environment variables as needed

3. **Database setup:**
   ```bash
   npm run db:generate    # Generate Prisma client
   npm run db:push        # Push schema to database
   npm run db:seed        # Seed initial data
   ```

4. **Development:**
   ```bash
   npm run dev            # Start development server
   ```

5. **Build:**
   ```bash
   npm run build          # Build for production
   npm start              # Start production server
   ```

## API Documentation

Once the server is running, visit:
- **Swagger UI:** `http://localhost:3000/api-docs`
- **Health Check:** `http://localhost:3000/health`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
