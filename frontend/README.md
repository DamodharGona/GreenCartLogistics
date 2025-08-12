# GreenCart Logistics Frontend

A modern React-based frontend application for GreenCart Logistics delivery simulation and management platform.

## 🚀 Features

- **Modern UI/UX**: Built with React 18, TypeScript, and Tailwind CSS
- **Authentication**: Secure login/registration with JWT tokens
- **Dashboard**: Comprehensive KPI dashboard with charts and metrics
- **Simulation Engine**: Run and manage delivery simulations
- **Responsive Design**: Mobile-first responsive design
- **Real-time Data**: Live data from backend API
- **Role-based Access**: Admin and Manager role support

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Heroicons
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **State Management**: React Context API

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main layout with navigation
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Registration page
│   ├── Simulations.tsx # Simulation management
│   └── ...            # Other pages
├── services/           # API services
│   ├── api.ts         # Base API configuration
│   ├── authService.ts # Authentication service
│   ├── simulationService.ts # Simulation service
│   └── analyticsService.ts  # Analytics service
├── config/             # Configuration files
│   └── environment.ts  # Environment variables
└── App.tsx            # Main app component
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running (see backend README)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GreenCartLogistics/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the frontend directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_APP_NAME=GreenCart Logistics
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 📱 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Authentication

The application uses JWT-based authentication:

1. **Register**: Create a new account
2. **Login**: Sign in with credentials
3. **Protected Routes**: Access to dashboard requires authentication
4. **Role-based Access**: Different features for Admin/Manager roles

## 📊 Dashboard Features

- **KPI Cards**: Total drivers, routes, orders, simulations
- **Performance Metrics**: On-time delivery rate, efficiency, revenue
- **Charts**: Profit trends, order value distribution
- **Quick Actions**: Run simulation, view analytics, manage orders

## 🎮 Simulation Management

- **Run Simulations**: Configure driver count, start time, max hours
- **View Results**: Track profit, efficiency, delivery metrics
- **Compare Results**: Analyze different simulation scenarios
- **Delete Simulations**: Remove old simulation data

## 🎨 UI Components

### Custom CSS Classes
- `.btn-primary` - Primary button styling
- `.btn-secondary` - Secondary button styling
- `.card` - Card container styling
- `.input-field` - Form input styling

### Color Scheme
- **Primary**: Blue tones (#3B82F6)
- **Success**: Green tones (#10B981)
- **Warning**: Orange tones (#F59E0B)
- **Error**: Red tones (#EF4444)

## 🔧 Configuration

### Tailwind CSS
Custom color palette and component styles defined in `tailwind.config.js`

### API Configuration
Base URL and interceptors configured in `src/services/api.ts`

### Environment Variables
- `VITE_API_BASE_URL`: Backend API endpoint
- `VITE_APP_NAME`: Application display name

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Navigation**: Collapsible sidebar for mobile
- **Tables**: Horizontal scroll for small screens

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Build the project
2. Deploy the `dist` folder
3. Set environment variables in deployment platform

## 🔍 Development

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/components/Layout.tsx`

### Adding New Services
1. Create service file in `src/services/`
2. Define TypeScript interfaces
3. Implement API methods using base `api` instance

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and typography
- Use custom CSS classes for complex components

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error**
   - Check backend server is running
   - Verify `VITE_API_BASE_URL` in environment
   - Check CORS configuration in backend

2. **Build Errors**
   - Clear `node_modules` and reinstall
   - Check TypeScript compilation errors
   - Verify all imports are correct

3. **Authentication Issues**
   - Clear localStorage
   - Check JWT token expiration
   - Verify backend authentication endpoints

## 📚 API Integration

The frontend integrates with the following backend endpoints:

- **Authentication**: `/api/auth/*`
- **Simulations**: `/api/simulations/*`
- **Analytics**: `/api/analytics/*`
- **Drivers**: `/api/drivers/*`
- **Routes**: `/api/routes/*`
- **Orders**: `/api/orders/*`

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use consistent code formatting
3. Add proper error handling
4. Include loading states
5. Test responsive design
6. Update documentation

## 📄 License

This project is licensed under the MIT License.
