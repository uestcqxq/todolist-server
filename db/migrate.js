const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

async function migrate() {
  let connection;
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      multipleStatements: true // 允许执行多条SQL语句
    });

    console.log('数据库连接成功');

    // 读取并执行迁移文件
    const migrationFiles = [
      '001_init_tables.sql',
      '002_add_evaluations.sql',
      '003_add_initial_data_flag.sql'
    ];

    for (const file of migrationFiles) {
      console.log(`执行迁移文件: ${file}`);
      const sql = await fs.readFile(
        path.join(__dirname, 'migrations', file),
        'utf8'
      );

      await connection.query(sql);
      console.log(`${file} 迁移完成`);
    }

    console.log('所有迁移执行完成');

  } catch (err) {
    console.error('迁移失败:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate(); 