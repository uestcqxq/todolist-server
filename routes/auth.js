const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 微信登录接口
router.post('/login', async (req, res) => {
  try {
    const { code, userInfo } = req.body;
    console.log('微信登录请求:', { code, userInfo });

    // 使用环境变量中的小程序配置
    const wxConfig = {
      appid: process.env.WX_APPID,
      secret: process.env.WX_APP_SECRET,
      js_code: code,
      grant_type: 'authorization_code'
    };
    
    // 查找或创建用户
    let user = await db.get(
      'SELECT * FROM users WHERE openid = ?',
      [code]
    );

    console.log('查找到的用户:', user);

    if (!user) {
      // 创建新用户
      const result = await db.run(
        'INSERT INTO users (openid, nickname) VALUES (?, ?)',
        [code, userInfo?.nickName || '微信用户']
      );
      
      if (!result || !result.lastID) {
        throw new Error('创建用户失败');
      }

      // 查询新创建的用户
      user = await db.get(
        'SELECT * FROM users WHERE id = ?',
        [result.lastID]
      );

      if (!user) {
        throw new Error('用户创建后查询失败');
      }

      console.log('创建新用户:', user);
    }

    // 生成 token
    const token = jwt.sign(
      { id: user.id, openid: user.openid },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('登录成功:', { userId: user.id, token });

    // 为新用户生成初始数据
    if (!user.has_initial_data) {
      await generateInitialData(user.id);
      // 标记用户已有初始数据
      await db.run(
        'UPDATE users SET has_initial_data = 1 WHERE id = ?',
        [user.id]
      );
    }

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname
        }
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? '登录失败' : err.message
    });
  }
});

// 生成用户初始数据
async function generateInitialData(userId) {
  try {
    // 生成最近三个月的数据
    const months = [
      { month: 12, year: 2024 },
      { month: 11, year: 2024 },
      { month: 10, year: 2024 }
    ];

    console.log('为用户生成初始数据:', { userId, months });

    for (const { year, month } of months) {
      const period = `${year}-${String(month).padStart(2, '0')}`;
      
      // 创建月计划
      const monthResult = await db.run(
        'INSERT INTO work_plans (user_id, period, type) VALUES (?, ?, ?)',
        [userId, period, 'month']
      );

      console.log('创建月计划:', { planId: monthResult.lastID, period });

      // 添加示例工作项
      const testItems = [
        {
          content: '完成项目需求分析',
          status: 'completed',
          evaluation: '按计划完成'
        },
        {
          content: '开发用户认证模块',
          status: 'pending',
          delay_reason: null
        },
        {
          content: '系统性能优化',
          status: 'delayed',
          delay_reason: '依赖组件未就绪'
        },
        {
          content: '编写技术文档',
          status: 'completed',
          evaluation: '提前完��'
        },
        {
          content: '部署测试环境',
          status: 'pending',
          delay_reason: null
        }
      ];

      // 为每个月随机选择3-5个工作项
      const selectedItems = testItems
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 3);

      for (const item of selectedItems) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const result = await db.run(
          `INSERT INTO work_items (
            plan_id, content, status, 
            start_date, due_date,
            evaluation, delay_reason
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            monthResult.lastID,
            item.content,
            item.status,
            startDate.toISOString().slice(0, 10),
            endDate.toISOString().slice(0, 10),
            item.evaluation,
            item.delay_reason
          ]
        );

        console.log('创建工作项:', {
          planId: monthResult.lastID,
          itemId: result.lastID,
          period,
          content: item.content
        });
      }
    }

    console.log('初始数据生成完成');
  } catch (err) {
    console.error('生成初始数据失败:', err);
    throw err;
  }
}

// 验证 token 的中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('收到的token:', token);

  if (!token) {
    console.log('未提供token');
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('解析的token数据:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token验证失败:', err);
    res.status(401).json({
      success: false,
      message: '认证令牌无效'
    });
  }
};

module.exports = {
  router,
  authMiddleware
}; 