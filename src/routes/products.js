// src/routes/products.js
const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

// Crear producto
router.post('/', authenticateToken, async (req, res) => {
  const { name, description, price, stock, image } = req.body;
  try {
    const product = await prisma.product.create({
      data: { name, description, price, stock, image }
    });
    return res.status(201).json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creando producto' });
  }
});

// Listar productos
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    return res.json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error obteniendo productos' });
  }
});

// Obtener producto
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error obteniendo producto' });
  }
});

// Actualizar
router.put('/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, price, stock, image } = req.body;
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? product.name,
        description: description ?? product.description,
        price: price ?? product.price,
        stock: stock ?? product.stock,
        image: image ?? product.image
      }
    });
    return res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error actualizando producto' });
  }
});

// Eliminar
router.delete('/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    await prisma.product.delete({ where: { id } });
    return res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error eliminando producto' });
  }
});

module.exports = router;
