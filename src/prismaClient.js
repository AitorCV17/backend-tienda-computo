/**
 * Archivo: src/prismaClient.js
 * Descripción: Instancia del cliente Prisma.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
