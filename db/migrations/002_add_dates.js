const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const db = new sqlite3.Database(path.join(__dirname, '..', 'database.sqlite'), (err) => {
  if (err) {
    console.error('连接数据库失败:', err);
    process.exit(1);
  }
});

async function runMigration() {
  try {
    // 开始事务
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 1. 检查是否需要迁移
    const tableInfo = await new Promise((resolve, reject) => {
      db.get(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='work_items'
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // 如果表结构中已经包含 start_date 和 due_date，说明已经迁移过
    if (tableInfo && tableInfo.sql.includes('start_date')) {
      console.log('数据库已经是最新版本');
      return;
    }

    // 2. 备份现有表
    await db.run(`
      CREATE TABLE IF NOT EXISTS work_items_backup AS 
      SELECT * FROM work_items
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS work_plans_backup AS 
      SELECT * FROM work_plans
    `);

    // 3. 删除现有表和索引
    await db.run('DROP INDEX IF EXISTS idx_work_plans_period');
    await db.run('DROP INDEX IF EXISTS idx_work_plans_user_period');
    await db.run('DROP TABLE IF EXISTS work_items');
    await db.run('DROP TABLE IF EXISTS work_plans');

    // 4. 创建新表结构
    await db.run(`
      CREATE TABLE work_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        period DATE NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.run(`
      CREATE TABLE work_items (
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
    `);

    // 5. 创建新索引
    await db.run('CREATE INDEX idx_work_plans_period ON work_plans(period)');
    await db.run('CREATE INDEX idx_work_plans_user_period ON work_plans(user_id, period)');
    await db.run('CREATE INDEX idx_work_items_plan ON work_items(plan_id)');
    await db.run('CREATE INDEX idx_work_items_status ON work_items(status)');
    await db.run('CREATE INDEX idx_work_items_dates ON work_items(start_date, due_date)');

    // 6. 迁移工作计划数据
    await db.run(`
      INSERT INTO work_plans (id, user_id, period, type, created_at, updated_at)
      SELECT id, user_id, period, type, created_at, updated_at
      FROM work_plans_backup
    `);

    // 7. 迁移工作项数据，计算起始日期和完成日期
    await db.run(`
      INSERT INTO work_items (
        id, plan_id, content, status, 
        start_date, due_date,
        evaluation, delay_reason, 
        created_at, updated_at
      )
      SELECT 
        wi.id, wi.plan_id, wi.content, wi.status,
        wp.period as start_date,
        CASE wp.type
          WHEN 'month' THEN date(wp.period, '+1 month', '-1 day')
          ELSE date(wp.period, 'weekday 0')
        END as due_date,
        wi.evaluation, wi.delay_reason,
        wi.created_at, wi.updated_at
      FROM work_items_backup wi
      JOIN work_plans_backup wp ON wi.plan_id = wp.id
    `);

    // 8. 删除备份表
    await db.run('DROP TABLE IF EXISTS work_items_backup');
    await db.run('DROP TABLE IF EXISTS work_plans_backup');

    // 提交事务
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('数据库迁移成功');
  } catch (err) {
    // 发生错误时回滚
    await new Promise((resolve) => {
      db.run('ROLLBACK', resolve);
    });
    console.error('数据库迁移失败:', err);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    db.close();
  }
}

// 运行迁移
runMigration(); 