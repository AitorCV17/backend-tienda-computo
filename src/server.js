// src/server.js
const app = require('./app');
const config = require('./config/config');

app.listen(config.PORT, () => {
  console.log(`Servidor corriendo en puerto ${config.PORT}`);
});
