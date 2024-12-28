const { body, query, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: errors.array()
    });
  }
  next();
};

const workPlanValidators = {
  create: [
    body('period')
      .notEmpty()
      .withMessage('期间不能为空')
      .matches(/^\d{4}-\d{2}(-\d{2})?$/)
      .withMessage('期间格式不正确')
      .custom((value, { req }) => {
        const date = new Date(value);
        if (date > new Date()) {
          throw new Error('不能创建未来的计划');
        }
        return true;
      }),
    body('type')
      .notEmpty()
      .withMessage('类型不能为空')
      .isIn(['month', 'week'])
      .withMessage('类型必须是 month 或 week'),
    body('items')
      .isArray()
      .withMessage('工作项必须是数组')
      .notEmpty()
      .withMessage('工作项不能为空'),
    body('items.*.content')
      .notEmpty()
      .withMessage('工作内容不��为空')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('工作内容长度必须在1-500之间'),
    validate
  ],
  
  update: [
    param('id').isInt().withMessage('ID无效'),
    body('status').optional().isIn(['pending', 'completed', 'delayed']).withMessage('状态无效'),
    validate
  ]
};

module.exports = {
  validate,
  workPlanValidators
}; 