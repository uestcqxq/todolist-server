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
const errorHandler = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');
const { requestLogger } = require('./utils/logger');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(requestLogger);
app.use(securityMiddleware);

// 路由
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/work-plans', require('./routes/workPlans'));
app.use('/api/evaluations', require('./routes/evaluations'));

// 错误处理
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});