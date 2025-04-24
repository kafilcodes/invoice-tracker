const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/invoice-tracker',
  JWT_SECRET: process.env.JWT_SECRET || 'l6a4iQm2qKvX9pRbZh8wFc3jNs7tDe5y',
  NODE_ENV: process.env.NODE_ENV || 'development'
}; 