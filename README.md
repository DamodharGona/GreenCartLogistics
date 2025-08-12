# 🚚 GreenCart Logistics

A comprehensive delivery simulation and management platform for logistics companies. This full-stack application provides internal simulation tools and KPI dashboards to optimize delivery operations.

## 🌟 Features

### 🎯 Core Functionality
- **Delivery Simulation Engine**: Run realistic delivery scenarios with configurable parameters
- **KPI Dashboard**: Comprehensive metrics and performance indicators
- **Driver Management**: Track driver performance and assignments
- **Route Optimization**: Manage delivery routes with traffic considerations
- **Order Management**: Complete order lifecycle management
- **Analytics & Reporting**: Detailed insights and trend analysis

### 🚀 Business Logic
- **Staffing Optimization**: Calculate optimal driver count for routes
- **Schedule Management**: Plan delivery schedules with time constraints
- **Traffic Impact**: Factor in traffic levels (LOW/MEDIUM/HIGH) on delivery times
- **Penalty System**: Late delivery penalties and on-time bonuses
- **Fuel Cost Calculation**: Realistic fuel consumption based on distance and traffic
- **Profit Analysis**: Comprehensive profitability calculations
- **Efficiency Scoring**: Performance metrics and driver efficiency tracking

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with NeonDB (cloud-hosted)
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt
- **Documentation**: Swagger/OpenAPI
- **Validation**: Zod
- **Security**: Helmet, CORS, Morgan

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Heroicons
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **State Management**: React Context API

## 📁 Project Structure

```
GreenCartLogistics/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── config/         # Configuration files
│   │   └── types/          # TypeScript interfaces
│   ├── prisma/             # Database schema and migrations
│   └── package.json        # Backend dependencies
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── contexts/       # React contexts
│   │   └── config/         # Configuration files
│   └── package.json        # Frontend dependencies
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (or NeonDB account)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed initial data
npm run db:seed

# Start development server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Database Studio**: `npm run db:studio` (from backend directory)

## 🔐 Authentication

The system supports two user roles:

- **Admin**: Full access to all features
- **Manager**: Access to simulations and analytics

### Default Users (after seeding)
- **Admin**: `admin` / `admin123`
- **Manager**: `manager` / `manager123`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Simulations
- `POST /api/simulations/run` - Run new simulation
- `GET /api/simulations` - List simulations
- `GET /api/simulations/:id` - Get simulation details
- `DELETE /api/simulations/:id` - Delete simulation
- `GET /api/simulations/compare/:id1/:id2` - Compare simulations

### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/profit-trends` - Profit trends
- `GET /api/analytics/efficiency-metrics` - Efficiency analysis
- `GET /api/analytics/driver-performance` - Driver metrics
- `GET /api/analytics/route-efficiency` - Route analysis

### Management (CRUD operations)
- **Drivers**: `/api/drivers/*`
- **Routes**: `/api/routes/*`
- **Orders**: `/api/orders/*`

## 🎮 Simulation Engine

The core simulation engine calculates:

1. **Delivery Time**: Based on route distance, traffic, and driver efficiency
2. **Fuel Costs**: Calculated per kilometer with traffic multipliers
3. **Penalties**: Late delivery penalties based on company rules
4. **Bonuses**: On-time delivery bonuses
5. **Efficiency Score**: Overall performance metric
6. **Profit Calculation**: Revenue minus costs and penalties

### Simulation Parameters
- Driver count (1-10)
- Route start time
- Maximum working hours
- Traffic conditions
- Route complexity

## 📱 Frontend Features

### Dashboard
- **KPI Cards**: Real-time metrics display
- **Charts**: Profit trends and order distribution
- **Quick Actions**: Easy access to key functions

### Simulation Management
- **Run Simulations**: Intuitive form interface
- **Results View**: Detailed simulation outcomes
- **Comparison Tool**: Side-by-side analysis

### Responsive Design
- Mobile-first approach
- Collapsible navigation
- Optimized for all screen sizes

## 🗄️ Database Schema

### Core Tables
- **Users**: Authentication and role management
- **Drivers**: Driver information and performance
- **Routes**: Delivery routes with traffic data
- **Orders**: Order details and delivery status
- **Simulations**: Simulation results and metadata

### Key Relationships
- Users can create multiple simulations
- Routes contain multiple orders
- Drivers are assigned to routes
- Simulations track all delivery metrics

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="development"
```

#### Frontend (.env.local)
```env
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_APP_NAME="GreenCart Logistics"
```

## 🚀 Deployment

### Backend
- **Platform**: Render, Railway, or Heroku
- **Database**: NeonDB (PostgreSQL)
- **Environment**: Set production environment variables

### Frontend
- **Platform**: Vercel, Netlify, or AWS S3
- **Build**: `npm run build`
- **Environment**: Configure API endpoint for production

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📈 Performance

- **Backend**: Optimized database queries with Prisma
- **Frontend**: Lazy loading and efficient state management
- **Database**: Indexed queries and optimized schema
- **API**: Rate limiting and request validation

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- CORS configuration
- Helmet security headers
- Input validation with Zod
- SQL injection protection via Prisma

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Add tests for new features
5. Submit a pull request

### Development Guidelines
- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful commit messages
- Update documentation
- Test on multiple devices

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**
   - Verify DATABASE_URL in .env
   - Check NeonDB connection status
   - Run `npm run db:generate`

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript compilation
   - Verify all dependencies

3. **API Errors**
   - Check backend server status
   - Verify CORS configuration
   - Check authentication tokens

## 📚 Documentation

- **API Docs**: Available at `/api-docs` when backend is running
- **Database Schema**: See `backend/prisma/schema.prisma`
- **Frontend Components**: See `frontend/src/components/`

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review API documentation
- Check backend logs for errors
- Verify environment configuration

---

**GreenCart Logistics** - Optimizing delivery operations through intelligent simulation and analytics.
