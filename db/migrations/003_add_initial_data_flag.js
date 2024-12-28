const db = require('../index');

async function migrate() {
  try {
    // 开始事务
    await db.run('BEGIN TRANSACTION');

    // 添加 has_initial_data 列
    await db.run(`
      ALTER TABLE users 
      ADD COLUMN has_initial_data INTEGER DEFAULT 0
    `);

    // 提交事务
    await db.run('COMMIT');
    console.log('迁移成功: 添加 has_initial_data 字段');
  } catch (err) {
    // 回滚事务
    await db.run('ROLLBACK');
    console.error('迁移失败:', err);
    throw err;
  }
}

// 运行迁移
migrate().catch(err => {
  console.error('迁移失败:', err);
  process.exit(1);
}); 