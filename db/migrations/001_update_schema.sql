-- 删除现有表和索引
DROP INDEX IF EXISTS idx_work_plans_period;
DROP INDEX IF EXISTS idx_work_plans_user_period;
DROP TABLE IF EXISTS work_items;
DROP TABLE IF EXISTS work_plans;

-- 重新创建工作计划表
CREATE TABLE work_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  period DATE NOT NULL,         -- 使用 DATE 类型存储具体日期
  type TEXT NOT NULL,          -- 'month' 或 'week'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 重新创建工作项表
CREATE TABLE work_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  evaluation TEXT,
  delay_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES work_plans(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_work_plans_period ON work_plans(period);
CREATE INDEX idx_work_plans_user_period ON work_plans(user_id, period);
CREATE INDEX idx_work_items_plan ON work_items(plan_id);
CREATE INDEX idx_work_items_status ON work_items(status); 