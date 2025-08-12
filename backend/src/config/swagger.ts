import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: process.env['SWAGGER_TITLE'] || 'GreenCart Logistics API',
      version: process.env['SWAGGER_VERSION'] || '1.0.0',
      description: process.env['SWAGGER_DESCRIPTION'] || 'API for GreenCart Logistics delivery simulation and management',
      contact: {
        name: 'GreenCart Logistics API Support',
        email: 'support@greencart.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env['PORT'] || 3000}`,
        description: 'Development server',
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/types/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'GreenCart Logistics API Documentation',
    customfavIcon: '/favicon.ico',
  }));
};

export default swaggerSetup;
