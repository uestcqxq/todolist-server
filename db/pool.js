const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../config');

/**
 * 数据库连接池管理类
 * 用于管理和复用数据库连接，提高性能和可靠性
 */
class ConnectionPool {
  constructor() {
    this.pool = [];
    this.maxSize = 10;  // 最大连接数
    this.minSize = 2;   // 最小连接数
    this.timeout = 30000; // 连接超时时间（毫秒）
    this.initialize();
  }

  /**
   * 初始化连接池
   * 创建最小数量的数据库连接
   */
  initialize() {
    for (let i = 0; i < this.minSize; i++) {
      this.createConnection();
    }
  }

  /**
   * 创建新的数据库连接
   * @returns {Object} 数据库连接对象
   */
  createConnection() {
    const connection = {
      db: new sqlite3.Database(DB_PATH),
      inUse: false,
      lastUsed: Date.now()
    };
    this.pool.push(connection);
    return connection;
  }

  /**
   * 获取可用的数据库连接
   * @returns {Promise<Object>} 数据库连接对象
   */
  async getConnection() {
    // 查找空闲连接
    let connection = this.pool.find(conn => !conn.inUse);
    
    // 如果没有空闲连接且未达到最大连接数，创建新连接
    if (!connection && this.pool.length < this.maxSize) {
      connection = this.createConnection();
    }
    
    // 如果仍然没有可用连接，等待并重试
    if (!connection) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getConnection();
    }

    connection.inUse = true;
    connection.lastUsed = Date.now();
    return connection;
  }

  /**
   * 释放数据库连接
   * @param {Object} connection 要释放的连接对象
   */
  releaseConnection(connection) {
    connection.inUse = false;
    connection.lastUsed = Date.now();
    this.cleanup();
  }

  /**
   * 清理过期的连接
   * 移除超时未使用的连接，但保持最小连接数
   */
  cleanup() {
    const now = Date.now();
    const unusedConnections = this.pool.filter(
      conn => !conn.inUse && (now - conn.lastUsed > this.timeout)
    );

    // 保持最小连接数
    const removeCount = Math.max(0, this.pool.length - this.minSize);
    
    unusedConnections.slice(0, removeCount).forEach(conn => {
      conn.db.close();
      const index = this.pool.indexOf(conn);
      if (index > -1) {
        this.pool.splice(index, 1);
      }
    });
  }

  /**
   * 关闭所有数据库连接
   */
  closeAll() {
    this.pool.forEach(conn => {
      conn.db.close();
    });
    this.pool = [];
  }
}

// 创建连接池单例
const pool = new ConnectionPool();

module.exports = pool; 