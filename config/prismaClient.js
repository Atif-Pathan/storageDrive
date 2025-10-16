// config/prismaClient.js
const { PrismaClient } = require('@prisma/client');

const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = prismaClient;