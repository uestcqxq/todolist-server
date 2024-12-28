const mysql = require('mysql2/promise');
const config = require('./config');

// 创建连接池
const pool = mysql.createPool(config.mysql);

// 包装数据库操作
const db = {
  // 执行查询
  async query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // 获取单条记录
  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0];
  },

  // 执行插入/更新/删除
  async run(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return {
      lastID: result.insertId,
      changes: result.affectedRows
    };
  },

  // 执行多条查询
  async all(sql, params = []) {
    return await this.query(sql, params);
  }
};

// 初始化数据库表
async function initTables() {
  try {
    // 创建用户表
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        openid VARCHAR(100) UNIQUE NOT NULL,
        nickname VARCHAR(100),
        has_initial_data BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建工作计划表
    await db.run(`
      CREATE TABLE IF NOT EXISTS work_plans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        period DATE NOT NULL,
        type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 创建工作项表
    await db.run(`
      CREATE TABLE IF NOT EXISTS work_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        plan_id INT NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        start_date DATE NOT NULL,
        due_date DATE NOT NULL,
        evaluation TEXT,
        delay_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (plan_id) REFERENCES work_plans(id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    await db.run('CREATE INDEX IF NOT EXISTS idx_work_plans_period ON work_plans(period)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_work_plans_user_period ON work_plans(user_id, period)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_work_items_plan ON work_items(plan_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status)');

    console.log('数据库表初始化完成');
  } catch (err) {
    console.error('初始化数据库表失败:', err);
    throw err;
  }
}

// 导出模块
module.exports = {
  ...db,
  initTables
}; 