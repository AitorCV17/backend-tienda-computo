/**
 * Archivo: src/routes/carrito.js
 * Descripción: Rutas para manejo del carrito de compras.
 */
const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { autenticarToken } = require('../middleware/auth');

// Agregar ítem al carrito
router.post('/', autenticarToken, async (req, res) => {
  const { productoId, cantidad } = req.body;
  try {
    const producto = await prisma.producto.findUnique({ where: { id: productoId } });
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    if (producto.stock < cantidad) {
      return res.status(409).json({ message: `Stock insuficiente para ${producto.nombre}` });
    }
    const itemExistente = await prisma.carritoItem.findFirst({
      where: { usuarioId: req.usuario.id, productoId }
    });
    let carritoItem;
    if (itemExistente) {
      carritoItem = await prisma.carritoItem.update({
        where: { id: itemExistente.id },
        data: { cantidad: itemExistente.cantidad + cantidad }
      });
    } else {
      carritoItem = await prisma.carritoItem.create({
        data: {
          usuarioId: req.usuario.id,
          productoId,
          cantidad
        }
      });
    }
    return res.status(201).json(carritoItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error agregando ítem al carrito' });
  }
});

// Listar ítems del carrito
router.get('/', autenticarToken, async (req, res) => {
  try {
    const items = await prisma.carritoItem.findMany({
      where: { usuarioId: req.usuario.id },
      include: { producto: true }
    });
    return res.json(items);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error obteniendo carrito' });
  }
});

// Eliminar ítem del carrito
router.delete('/:id', autenticarToken, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const item = await prisma.carritoItem.findUnique({ where: { id } });
    if (!item || item.usuarioId !== req.usuario.id) {
      return res.status(404).json({ message: 'Ítem no encontrado en el carrito' });
    }
    await prisma.carritoItem.delete({ where: { id } });
    return res.json({ message: 'Ítem eliminado del carrito' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error eliminando ítem del carrito' });
  }
});

module.exports = router;
