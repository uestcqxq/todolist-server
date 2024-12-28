const express = require('express');
const router = express.Router();
const db = require('../db');

// 提交评估
router.post('/', async (req, res) => {
  const { workItemId, status, evaluation, delay_reason } = req.body;

  try {
    await db.run('BEGIN TRANSACTION');

    // 记录评估
    await db.run(`
      INSERT INTO evaluations (work_item_id, status, evaluation, delay_reason)
      VALUES (?, ?, ?, ?)
    `, [workItemId, status, evaluation, delay_reason]);

    // 更新工作项状态
    await db.run(`
      UPDATE work_items
      SET status = ?, evaluation = ?, delay_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, evaluation, delay_reason, workItemId]);

    await db.run('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取评估历史
router.get('/history/:workItemId', async (req, res) => {
  const { workItemId } = req.params;

  try {
    const evaluations = await db.all(`
      SELECT *
      FROM evaluations
      WHERE work_item_id = ?
      ORDER BY created_at DESC
    `, [workItemId]);

    res.json({ success: true, data: evaluations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 