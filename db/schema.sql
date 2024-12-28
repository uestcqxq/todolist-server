-- 工作计划表
CREATE TABLE IF NOT EXISTS work_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  period DATE NOT NULL,         -- 期间日期
  type TEXT NOT NULL,          -- 'month' 或 'week'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 工作项表
CREATE TABLE IF NOT EXISTS work_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  start_date DATE NOT NULL,    -- 起始日期
  due_date DATE NOT NULL,      -- 计划完成日期
  evaluation TEXT,
  delay_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES work_plans(id) ON DELETE CASCADE
);

-- 添加索引
CREATE INDEX idx_work_plans_period ON work_plans(period);
CREATE INDEX idx_work_plans_user_period ON work_plans(user_id, period);
CREATE INDEX idx_work_items_plan ON work_items(plan_id);
CREATE INDEX idx_work_items_status ON work_items(status);
CREATE INDEX idx_work_items_dates ON work_items(start_date, due_date);