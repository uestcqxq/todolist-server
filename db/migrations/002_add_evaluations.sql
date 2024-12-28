-- 创建评估记录表
CREATE TABLE IF NOT EXISTS evaluations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  work_item_id INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  evaluation TEXT,
  delay_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_item_id) REFERENCES work_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 安全地创建索引
SELECT COUNT(1) INTO @exists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'evaluations' AND index_name = 'idx_evaluations_work_item';

SET @query = IF(@exists = 0, 
  'CREATE INDEX idx_evaluations_work_item ON evaluations(work_item_id)', 
  'SELECT 1'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 