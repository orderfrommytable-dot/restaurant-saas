const { PrismaClient } = require("@prisma/client");

// This creates one single connection to your database
const prisma = new PrismaClient();

module.exports = prisma;