require('dotenv').config({ path: '.env.development' });

module.exports = {
  mysql: {
    host: process.env.DB_HOST || 'mrseven.site',
    port: parseInt(process.env.DB_PORT || '7330'),
    user: process.env.DB_USER || 'todolist',
    password: process.env.DB_PASSWORD || 'qxqlm110400',
    database: process.env.DB_NAME || 'todolist',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }
}; 