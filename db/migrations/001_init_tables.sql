-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(100) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  has_initial_data BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 工作计划表
CREATE TABLE IF NOT EXISTS work_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  period DATE NOT NULL,
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 工作项表
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 安全地创建索引
SELECT COUNT(1) INTO @exists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'work_plans' AND index_name = 'idx_work_plans_period';
SET @query = IF(@exists = 0, 'CREATE INDEX idx_work_plans_period ON work_plans(period)', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(1) INTO @exists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'work_plans' AND index_name = 'idx_work_plans_user_period';
SET @query = IF(@exists = 0, 'CREATE INDEX idx_work_plans_user_period ON work_plans(user_id, period)', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(1) INTO @exists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'work_items' AND index_name = 'idx_work_items_plan';
SET @query = IF(@exists = 0, 'CREATE INDEX idx_work_items_plan ON work_items(plan_id)', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(1) INTO @exists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'work_items' AND index_name = 'idx_work_items_status';
SET @query = IF(@exists = 0, 'CREATE INDEX idx_work_items_status ON work_items(status)', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(1) INTO @exists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'work_items' AND index_name = 'idx_work_items_dates';
SET @query = IF(@exists = 0, 'CREATE INDEX idx_work_items_dates ON work_items(start_date, due_date)', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 