const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config({ path: '/home/ritish/project/Valora/server/.env' });

async function testSpeed() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ include: { contact: true } });
  if (!user) {
    console.log("No user found");
    process.exit(1);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, contact_id: user.contact_id, contact_type: user.contact?.type },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  await prisma.$disconnect();

  const endpoints = ['/vendor-bills', '/contacts', '/products', '/analytic-accounts', '/budgets'];

  async function fetchEndpoint(url) {
    return new Promise(resolve => {
      const start = Date.now();
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: url,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          console.log(url + ':', Date.now() - start, 'ms (status ' + res.statusCode + ')');
          resolve(Date.now() - start);
        });
      });
      req.end();
    });
  }

  console.log("Sequential Fetch:");
  for (const ep of endpoints) {
    await fetchEndpoint(ep);
  }

  console.log("\nParallel Fetch:");
  const startAll = Date.now();
  await Promise.all(endpoints.map(ep => fetchEndpoint(ep)));
  console.log('Total parallel time: ' + (Date.now() - startAll) + 'ms');
}

testSpeed();
