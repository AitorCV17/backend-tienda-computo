/**
 * Archivo: src/routes/productos.js
 * Descripción: Rutas para manejo de productos.
 */
const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { autenticarToken } = require('../middleware/auth');

// Crear producto (requiere autenticación, por ejemplo de administrador)
router.post('/', autenticarToken, async (req, res) => {
  const { nombre, descripcion, precio, stock, imagen, categoriaId } = req.body;
  try {
    const producto = await prisma.producto.create({
      data: { nombre, descripcion, precio, stock, imagen, categoriaId }
    });
    return res.status(201).json(producto);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creando producto' });
  }
});

// Listar todos los productos
router.get('/', async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      include: { categoria: true }
    });
    return res.json(productos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error obteniendo productos' });
  }
});

// Rutas estáticas para productos destacados se definen antes de la ruta dinámica

// Obtener productos más vendidos (top 10)
router.get('/destacados/mas-vendidos', async (req, res) => {
  try {
    const productosVendidos = await prisma.producto.findMany({
      orderBy: { ventas: 'desc' },
      take: 10
    });
    return res.json(productosVendidos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error obteniendo productos más vendidos' });
  }
});

// Obtener productos recientes (top 10)
router.get('/destacados/recientes', async (req, res) => {
  try {
    const productosRecientes = await prisma.producto.findMany({
      orderBy: { creadoEn: 'desc' },
      take: 10
    });
    return res.json(productosRecientes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error obteniendo productos recientes' });
  }
});

// Rutas dinámicas (por ID) se definen después de las rutas estáticas

// Obtener producto por ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: { categoria: true }
    });
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    return res.json(producto);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error obteniendo producto' });
  }
});

// Actualizar producto
router.put('/:id', autenticarToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, descripcion, precio, stock, imagen, categoriaId } = req.body;
  try {
    const productoExistente = await prisma.producto.findUnique({ where: { id } });
    if (!productoExistente) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: {
        nombre: nombre ?? productoExistente.nombre,
        descripcion: descripcion ?? productoExistente.descripcion,
        precio: precio ?? productoExistente.precio,
        stock: stock ?? productoExistente.stock,
        imagen: imagen ?? productoExistente.imagen,
        categoriaId: categoriaId ?? productoExistente.categoriaId
      }
    });
    return res.json(productoActualizado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error actualizando producto' });
  }
});

// Eliminar producto
router.delete('/:id', autenticarToken, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const productoExistente = await prisma.producto.findUnique({ where: { id } });
    if (!productoExistente) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    await prisma.producto.delete({ where: { id } });
    return res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error eliminando producto' });
  }
});

module.exports = router;
