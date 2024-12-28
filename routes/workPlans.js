const express = require('express');
const router = express.Router();
const db = require('../db');
const { workPlanValidators } = require('../middleware/validator');

// 获取工作计划列表
router.get('/', async (req, res) => {
  try {
    const { period, type } = req.query;
    const userId = req.user.id;

    console.log('查询参数:', { period, type, userId });

    // 检查数据库中的用户
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    console.log('查询到的用户:', user);

    // 检查数据库中的计划
    const allPlans = await db.all('SELECT * FROM work_plans WHERE user_id = ?', [userId]);
    console.log('该用户的所有计划:', allPlans);

    // 查询特定期间的计划
    const plans = await db.all(`
      SELECT wp.*, 
             COUNT(wi.id) as item_count,
             SUM(CASE WHEN wi.status = 'completed' THEN 1 ELSE 0 END) as completed_count
      FROM work_plans wp
      LEFT JOIN work_items wi ON wp.id = wi.plan_id
      WHERE wp.user_id = ? AND wp.period = ? AND wp.type = ?
      GROUP BY wp.id
    `, [userId, period, type]);

    console.log('查询到的计划:', plans);

    if (plans.length === 0) {
      console.log('未找到计划数据');
      return res.json({
        success: true,
        data: []
      });
    }

    // 查询工作项
    const items = await db.all(`
      SELECT 
        id,
        content,
        status,
        start_date,
        due_date,
        evaluation,
        delay_reason,
        created_at
      FROM work_items
      WHERE plan_id = ?
      ORDER BY created_at DESC
    `, [plans[0].id]);

    console.log('查询到的工作项:', items);

    // 返回计划数据
    const responseData = {
      success: true,
      data: [{
        id: plans[0].id,
        period: period,
        type: type,
        items: items || [],
        item_count: plans[0].item_count || 0,
        completed_count: plans[0].completed_count || 0
      }]
    };

    console.log('返回数据:', responseData);
    res.json(responseData);

  } catch (err) {
    console.error('获取工作计划失败:', err);
    res.status(500).json({
      success: false,
      message: '获取工作计划失败'
    });
  }
});

// 创建工作计划
router.post('/', workPlanValidators.create, async (req, res) => {
  try {
    const { period, type, items } = req.body;
    const userId = req.user.id;

    console.log('创建计划请求数据:', {
      period,
      type,
      items,
      userId
    });

    // 验证用户是否存在
    const user = await db.all('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user || user.length === 0) {
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证数据
    if (!period || !type || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的计划数据'
      });
    }

    // 验证工作项
    const validItems = items.filter(item => item.content && item.content.trim());
    if (validItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请至少添加一个有效的工作项'
      });
    }

    // 计算起始日期和完成日期
    const startDate = new Date(period);
    let dueDate;

    if (type === 'month') {
      // 月计划：完成日期为当月最后一天
      dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    } else {
      // 周计划：完成日期为本周日
      const day = startDate.getDay();
      const sundayOffset = day === 0 ? 0 : 7 - day;
      dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + sundayOffset);
    }

    // 格式化日期
    const formatDate = date => date.toISOString().slice(0, 10);
    const formattedStartDate = formatDate(startDate);
    const formattedDueDate = formatDate(dueDate);

    console.log('计算的日期:', {
      formattedStartDate,
      formattedDueDate
    });

    // 开始事务
    await db.run('BEGIN TRANSACTION');

    try {
      // 创建工作计划
      const result = await db.run(
        'INSERT INTO work_plans (user_id, period, type) VALUES (?, ?, ?)',
        [userId, period, type]
      );
      const planId = result.lastID;

      console.log('创建计划成功:', { planId });

      // 批量插入工作项
      for (const item of validItems) {
        console.log('插入工作项:', {
          planId,
          content: item.content.trim(),
          startDate: formattedStartDate,
          dueDate: formattedDueDate
        });

        await db.run(
          `INSERT INTO work_items (
            plan_id, content, status, 
            start_date, due_date
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            planId, 
            item.content.trim(), 
            'pending',
            formattedStartDate,
            formattedDueDate
          ]
        );
      }

      // 提交事务
      await db.run('COMMIT');

      res.json({
        success: true,
        message: '创建成功',
        data: { id: planId }
      });
    } catch (err) {
      // 回滚事务
      await db.run('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('创建工作计划失败:', {
      error: err,
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({
      success: false,
      message: err.message || '创建失败'
    });
  }
});

// 更新工作项状态
router.put('/items/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const updates = {};
  const allowedFields = ['status', 'evaluation', 'delay_reason'];
  
  try {
    // 先检查工作项是否存在
    const item = await db.all('SELECT * FROM work_items WHERE id = ?', [itemId]);
    if (!item || item.length === 0) {
      return res.status(404).json({
        success: false,
        message: '工作项不存在'
      });
    }
    
    // 只更新提供的字段
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段'
      });
    }
    
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), itemId];
    
    await db.run(`
      UPDATE work_items
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, values);
    
    res.json({ 
      success: true,
      message: '更新成功'
    });
  } catch (err) {
    console.error('更新工作项失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '更新失败，请稍后重试'
    });
  }
});

// 获取历史计划
router.get('/history', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    const plans = await db.all(`
      SELECT wp.*, 
             COUNT(wi.id) as item_count,
             SUM(CASE WHEN wi.status = 'completed' THEN 1 ELSE 0 END) as completed_count
      FROM work_plans wp
      LEFT JOIN work_items wi ON wp.id = wi.plan_id
      WHERE wp.user_id = ?
      GROUP BY wp.id
      ORDER BY wp.period DESC
      LIMIT ? OFFSET ?
    `, [userId, pageSize, offset]);

    res.json({
      success: true,
      data: plans
    });
  } catch (err) {
    next(err);
  }
});

// 获取工作计划详情
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取计划基���信息
    const plan = await db.all(`
      SELECT * FROM work_plans 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '计划不存在'
      });
    }

    // 获取工作项
    const items = await db.all(`
      SELECT * FROM work_items 
      WHERE plan_id = ?
      ORDER BY created_at ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...plan,
        items
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 