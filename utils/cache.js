/**
 * 简单的内存缓存管理器
 * 用于缓存频繁访问的数据，提高响应速度
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 默认缓存时间5分钟
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} value 缓存值
   * @param {number} ttl 过期时间（毫秒）
   */
  set(key, value, ttl = this.defaultTTL) {
    const item = {
      value,
      timestamp: Date.now(),
      ttl
    };
    this.cache.set(key, item);
    
    // 设置自动过期
    if (ttl > 0) {
      setTimeout(() => {
        this.delete(key);
      }, ttl);
    }
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @returns {any} 缓存值，如果过期或不存在则返回null
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 删除缓存
   * @param {string} key 缓存键
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   * @returns {number} 缓存项数量
   */
  size() {
    return this.cache.size;
  }
}

// 创建缓存管理器单例
const cacheManager = new CacheManager();

module.exports = cacheManager; 