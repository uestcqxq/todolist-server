const mysql = require('mysql2/promise');
const config = require('./db/config');

async function testConnection() {
  let connection;
  try {
    console.log('尝试连接到数据库...');
    console.log('配置信息:', {
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      database: config.mysql.database
    });

    connection = await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database
    });

    console.log('数据库连接成功！');

    // 测试查询
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log('测试查询结果:', rows);

    // 测试数据库版本
    const [version] = await connection.execute('SELECT VERSION() as version');
    console.log('MySQL版本:', version[0].version);

  } catch (err) {
    console.error('数据库连接失败:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

testConnection(); 