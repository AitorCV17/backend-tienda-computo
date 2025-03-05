/**
 * Archivo: src/routes/ordenes.js
 * Descripción: Rutas para manejo de órdenes y proceso de checkout.
 */
const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { autenticarToken } = require('../middleware/auth');

// Realizar checkout: crear orden a partir del carrito
router.post('/checkout', autenticarToken, async (req, res) => {
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const itemsCarrito = await tx.carritoItem.findMany({
        where: { usuarioId: req.usuario.id }
      });
      if (itemsCarrito.length === 0) {
        throw new Error('El carrito está vacío');
      }
      let total = 0;
      for (const item of itemsCarrito) {
        const producto = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (!producto) {
          throw new Error(`Producto ID ${item.productoId} no encontrado`);
        }
        if (producto.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${producto.nombre}`);
        }
        total += producto.precio * item.cantidad;
      }
      const nuevaOrden = await tx.orden.create({
        data: {
          usuarioId: req.usuario.id,
          total
        }
      });
      for (const item of itemsCarrito) {
        const producto = await tx.producto.findUnique({ where: { id: item.productoId } });
        // Crear ítem de orden
        await tx.ordenItem.create({
          data: {
            ordenId: nuevaOrden.id,
            productoId: producto.id,
            cantidad: item.cantidad,
            precio: producto.precio
          }
        });
        // Actualizar stock y sumar ventas
        await tx.producto.update({
          where: { id: producto.id },
          data: {
            stock: producto.stock - item.cantidad,
            ventas: producto.ventas + item.cantidad
          }
        });
        // Eliminar ítem del carrito
        await tx.carritoItem.delete({ where: { id: item.id } });
      }
      return nuevaOrden;
    });
    res.status(201).json({ message: 'Orden realizada con éxito', ordenId: resultado.id });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Error en checkout' });
  }
});

// Listar órdenes del usuario
router.get('/', autenticarToken, async (req, res) => {
  try {
    const ordenes = await prisma.orden.findMany({
      where: { usuarioId: req.usuario.id },
      include: {
        ordenItems: {
          include: { producto: true }
        }
      }
    });
    res.json(ordenes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo órdenes' });
  }
});

module.exports = router;
