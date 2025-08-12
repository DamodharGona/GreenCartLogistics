const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    await prisma.simulation.deleteMany();
    await prisma.order.deleteMany();
    await prisma.route.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@greencart.com',
        passwordHash: '$2a$10$dummy.hash.for.now',
        role: 'ADMIN',
      },
    });

    // Import drivers
    const driversData = fs.readFileSync(path.join(__dirname, '../../drivers.csv'), 'utf-8');
    const drivers = driversData.split('\n').slice(1).filter(line => line.trim()).map(line => {
      const [name, shiftHours, pastWeekHours] = line.split(',');
      if (!name || !shiftHours || !pastWeekHours) return null;
      return {
        name: name.trim(),
        shiftHours: parseInt(shiftHours),
        pastWeekHours: pastWeekHours.split('|').map(h => parseInt(h)),
      };
    }).filter(Boolean);

    for (const driver of drivers) {
      await prisma.driver.create({ data: driver });
    }

    // Import routes
    const routesData = fs.readFileSync(path.join(__dirname, '../../routes.csv'), 'utf-8');
    const routes = routesData.split('\n').slice(1).filter(line => line.trim()).map(line => {
      const [id, distanceKm, trafficLevel, baseTimeMin] = line.split(',');
      if (!distanceKm || !trafficLevel || !baseTimeMin) return null;
      return {
        distanceKm: parseFloat(distanceKm),
        trafficLevel: trafficLevel.trim().toUpperCase(),
        baseTimeMin: parseInt(baseTimeMin),
      };
    }).filter(Boolean);

    for (const route of routes) {
      await prisma.route.create({ data: route });
    }

    // Import orders
    const ordersData = fs.readFileSync(path.join(__dirname, '../../orders.csv'), 'utf-8');
    const orders = ordersData.split('\n').slice(1).filter(line => line.trim()).map(line => {
      const [orderId, valueRs, routeId, deliveryTime] = line.split(',');
      if (!orderId || !valueRs || !routeId || !deliveryTime) return null;
      return {
        orderId: orderId.trim(),
        valueRs: parseFloat(valueRs),
        routeId: parseInt(routeId),
        deliveryTime: deliveryTime.trim(),
      };
    }).filter(Boolean);

    for (const order of orders) {
      await prisma.order.create({ data: order });
    }

    console.log('✅ Database seeding completed!');
    console.log(`📊 Created ${drivers.length} drivers, ${routes.length} routes, ${orders.length} orders`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
