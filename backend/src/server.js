require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`TaskFlow API running on port ${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
});
