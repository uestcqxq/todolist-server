const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// 根据环境加载配置
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

dotenv.config({ path: envFile });

const app = express();

// 中间件
app.use(cors({
  origin: '*',  // 允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// API 路由
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/work-plans', require('./routes/workPlans'));
app.use('/api/evaluations', require('./routes/evaluations'));

// 错误处理
app.use((err, req, res, next) => {
  console.error('全局错误处理:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Server URL: ${process.env.BASE_URL}`);
});