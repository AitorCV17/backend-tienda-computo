// src/routes/orders.js
const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

router.post('/checkout', authenticateToken, async (req, res) => {
  const transaction = await prisma.$transaction(async (prismaTx) => {
    const cartItems = await prismaTx.cartItem.findMany({
      where: { userId: req.user.id }
    });
    if (!cartItems.length) {
      throw new Error('El carrito está vacío');
    }
    let total = 0;
    for (const item of cartItems) {
      const product = await prismaTx.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new Error(`Producto ID ${item.productId} no encontrado`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}`);
      }
      total += product.price * item.quantity;
    }
    const order = await prismaTx.order.create({
      data: {
        userId: req.user.id,
        total
      }
    });
    for (const item of cartItems) {
      const product = await prismaTx.product.findUnique({ where: { id: item.productId } });
      await prismaTx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          price: product.price
        }
      });
      await prismaTx.product.update({
        where: { id: product.id },
        data: { stock: product.stock - item.quantity }
      });
      await prismaTx.cartItem.delete({ where: { id: item.id } });
    }
    return order;
  }).catch((error) => {
    throw error;
  });

  try {
    const order = transaction;
    res.status(201).json({ message: 'Orden realizada con éxito', orderId: order.id });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Error en checkout' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo órdenes' });
  }
});

module.exports = router;
