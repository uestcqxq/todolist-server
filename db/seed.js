const db = require('./index');

async function clearData() {
  try {
    await db.run('DELETE FROM work_items');
    await db.run('DELETE FROM work_plans');
    await db.run('DELETE FROM users');
    console.log('数据清理完成');
  } catch (err) {
    console.error('清理数据失败:', err);
    throw err;
  }
}

async function generateData() {
  try {
    // 创建测试用户
    const testUser = {
      openid: 'test_openid_' + Date.now(),
      nickname: 'Test User'
    };

    const userResult = await db.run(
      'INSERT INTO users (openid, nickname) VALUES (?, ?)',
      [testUser.openid, testUser.nickname]
    );
    const userId = userResult.lastID;
    console.log('创建测试用户:', { userId, openid: testUser.openid });

    // 生成所有月份的数据
    const months = [
      { month: '12', year: '2024' },  // 当前选择的月份
      { month: '11', year: '2024' },
      { month: '10', year: '2024' }
    ];

    for (const { year, month } of months) {
      const period = `${year}-${month}`;
      console.log(`生成 ${period} 的计划数据`);
      
      // 创建月计划
      const monthResult = await db.run(
        'INSERT INTO work_plans (user_id, period, type) VALUES (?, ?, ?)',
        [userId, period, 'month']
      );
      console.log('创建月计划:', { planId: monthResult.lastID, userId, period });

      // 添加测试工作项
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
          evaluation: '提前完成'
        },
        {
          content: '部署测试环境',
          status: 'pending',
          delay_reason: null
        }
      ];

      // 插入工作项
      for (const item of testItems) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        
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
          itemId: result.lastID,
          content: item.content,
          status: item.status
        });
      }
    }

    console.log('测试数据生成完成');
  } catch (err) {
    console.error('生成数据失败:', err);
    throw err;
  }
}

async function seed() {
  try {
    await clearData();
    await generateData();
    console.log('数据初始化完成');
  } catch (err) {
    console.error('数据初始化失败:', err);
    process.exit(1);
  }
}

// 运行数据初始化
seed(); 