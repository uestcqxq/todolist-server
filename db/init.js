const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('连接数据库失败:', err);
    process.exit(1);
  }
});

async function initDatabase() {
  try {
    // 开启事务
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 创建用户表
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          openid TEXT UNIQUE NOT NULL,
          nickname TEXT,
          has_initial_data INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 创建工作计划表
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS work_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          period DATE NOT NULL,
          type TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 创建工作项表
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS work_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plan_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          start_date DATE NOT NULL,
          due_date DATE NOT NULL,
          evaluation TEXT,
          delay_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (plan_id) REFERENCES work_plans(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 创建索引
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_work_plans_period ON work_plans(period);
        CREATE INDEX IF NOT EXISTS idx_work_plans_user_period ON work_plans(user_id, period);
        CREATE INDEX IF NOT EXISTS idx_work_items_plan ON work_items(plan_id);
        CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);
        CREATE INDEX IF NOT EXISTS idx_work_items_dates ON work_items(start_date, due_date);
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 创建测试用户
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR IGNORE INTO users (openid, nickname)
        VALUES ('test_openid', 'Test User')
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 提交事务
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('数据库初始化成功');
  } catch (err) {
    // 回滚事���
    await new Promise(resolve => {
      db.run('ROLLBACK', resolve);
    });
    console.error('数据库初始化失败:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 运行初始化
initDatabase(); 