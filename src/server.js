/**
 * Archivo: src/server.js
 * Descripción: Inicializa el servidor Express.
 */
const app = require('./app');
const config = require('./config/config');

app.listen(config.PORT, () => {
  console.log(`Servidor corriendo en el puerto ${config.PORT}`);
});
