const mysql = require('mysql2/promise');
const config = require('./config');

async function resetDatabase() {
  let connection;
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database
    });

    // 开始事务
    await connection.beginTransaction();

    // 删除所有表
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const tables = [
      'evaluations',
      'work_items',
      'work_plans',
      'users'
    ];

    for (const table of tables) {
      await connection.query(`DROP TABLE IF EXISTS ${table}`);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 提交事务
    await connection.commit();
    console.log('数据库重置成功');

    // 运行迁移
    require('./migrate');

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error('数据库重置失败:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetDatabase(); 