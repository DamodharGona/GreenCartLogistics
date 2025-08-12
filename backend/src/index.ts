import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerSetup from "./config/swagger";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

      // Add Railway domains if available
      if (process.env["RAILWAY_PUBLIC_DOMAIN"]) {
        allowedOrigins.push(`https://${process.env["RAILWAY_PUBLIC_DOMAIN"]}`);
      }

      if (process.env["RAILWAY_PRIVATE_DOMAIN"]) {
        allowedOrigins.push(`https://${process.env["RAILWAY_PRIVATE_DOMAIN"]}`);
      }

      // Add custom frontend URL if set
      if (process.env["FRONTEND_URL"]) {
        allowedOrigins.push(process.env["FRONTEND_URL"]);
        // Also add without trailing slash
        if (process.env["FRONTEND_URL"].endsWith("/")) {
          allowedOrigins.push(process.env["FRONTEND_URL"].slice(0, -1));
        } else {
          allowedOrigins.push(process.env["FRONTEND_URL"] + "/");
        }
      }

      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(morgan(process.env["LOG_LEVEL"] || "info"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
swaggerSetup(app);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env["NODE_ENV"] || "development",
  });
});

// Import routes
import analyticsRoutes from "./routes/analytics";
import authRoutes from "./routes/auth";
import driverRoutes from "./routes/drivers";
import orderRoutes from "./routes/orders";
import routeRoutes from "./routes/routes";
import simulationRoutes from "./routes/simulations";
import userRoutes from "./routes/users";

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/simulations", simulationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env["PORT"] || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GreenCart Logistics Backend Server running on port ${PORT}`);
  console.log(
    `📚 Swagger documentation available at http://localhost:${PORT}/api-docs`
  );
  console.log(`🌍 Environment: ${process.env["NODE_ENV"] || "development"}`);
});

export default app;
