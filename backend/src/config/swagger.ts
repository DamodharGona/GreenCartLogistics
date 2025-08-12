import { Express, Request } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const getServerUrl = (req?: Request): string => {
  // Use Railway's built-in environment variables
  if (process.env["RAILWAY_PUBLIC_DOMAIN"]) {
    return `https://${process.env["RAILWAY_PUBLIC_DOMAIN"]}`;
  }

  if (process.env["RAILWAY_PRIVATE_DOMAIN"]) {
    return `https://${process.env["RAILWAY_PRIVATE_DOMAIN"]}`;
  }

  // Auto-detect from request headers (fallback)
  if (req && req.headers.host) {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    return `${protocol}://${req.headers.host}`;
  }

  // Fallback to localhost for local development
  return `http://localhost:${process.env["PORT"] || 3000}`;
};

const createSwaggerOptions = (req?: Request) => ({
  definition: {
    openapi: "3.0.0",
    info: {
      title: process.env["SWAGGER_TITLE"] || "GreenCart Logistics API",
      version: process.env["SWAGGER_VERSION"] || "1.0.0",
      description:
        process.env["SWAGGER_DESCRIPTION"] ||
        "API for GreenCart Logistics delivery simulation and management",
      contact: {
        name: "GreenCart Logistics API Support",
        email: "support@greencart.com",
      },
    },
    servers: [
      {
        url: getServerUrl(req),
        description:
          process.env["NODE_ENV"] === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/types/*.ts"],
});

const swaggerSetup = (app: Express) => {
  // Serve Swagger UI static files first
  app.use("/api-docs", swaggerUi.serve);

  // Then set up the Swagger UI with dynamic options
  app.get("/api-docs", (req, res, next) => {
    const options = createSwaggerOptions(req);
    const specs = swaggerJsdoc(options);

    swaggerUi.setup(specs, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "GreenCart Logistics API Documentation",
      customfavIcon: "/favicon.ico",
    })(req, res, next);
  });
};

export default swaggerSetup;
