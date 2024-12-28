// 添加安全中间件
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// 配置限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});

// 安全中间件
const securityMiddleware = [
  // 基本安全头
  helmet(),
  
  // 限流
  limiter,
  
  // XSS 防护
  (req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  },
  
  // CORS 配置
  (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  }
];

module.exports = securityMiddleware; 