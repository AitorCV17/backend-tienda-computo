// src/routes/cart.js
const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    if (product.stock < quantity) {
      return res.status(409).json({ message: `Stock insuficiente para ${product.name}` });
    }
    const existingItem = await prisma.cartItem.findFirst({
      where: { userId: req.user.id, productId }
    });
    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: req.user.id,
          productId,
          quantity
        }
      });
    }
    return res.status(201).json(cartItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error agregando ítem al carrito' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true }
    });
    return res.json(cartItems);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error obteniendo carrito' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (!cartItem || cartItem.userId !== req.user.id) {
      return res.status(404).json({ message: 'Ítem no encontrado en el carrito' });
    }
    await prisma.cartItem.delete({ where: { id } });
    return res.json({ message: 'Ítem eliminado del carrito' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error eliminando ítem del carrito' });
  }
});

module.exports = router;
