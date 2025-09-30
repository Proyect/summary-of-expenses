/**
 * Configuración de base de datos
 * Soporta SQLite y PostgreSQL basado en variables de entorno
 */

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

/**
 * Clase para manejar la conexión a la base de datos
 * Abstrae las diferencias entre SQLite y PostgreSQL
 */
class DatabaseManager {
  constructor() {
    this.dbType = process.env.DATABASE_TYPE || 'sqlite';
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * Inicializa la conexión a la base de datos
   */
  async connect() {
    try {
      if (this.dbType === 'postgresql') {
        await this.connectPostgreSQL();
      } else {
        await this.connectSQLite();
      }
      this.isConnected = true;
      console.log(`✅ Conectado a base de datos ${this.dbType.toUpperCase()}`);
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error);
      throw error;
    }
  }

  /**
   * Conecta a PostgreSQL
   */
  async connectPostgreSQL() {
    const config = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'expense_tracker',
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20, // máximo número de conexiones en el pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.connection = new Pool(config);
    
    // Probar la conexión
    const client = await this.connection.connect();
    await client.query('SELECT NOW()');
    client.release();
  }

  /**
   * Conecta a SQLite
   */
  async connectSQLite() {
    return new Promise((resolve, reject) => {
      const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../database.sqlite');
      this.connection = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          // Habilitar foreign keys en SQLite
          this.connection.run('PRAGMA foreign_keys = ON');
          resolve();
        }
      });
    });
  }

  /**
   * Ejecuta una consulta SQL
   * @param {string} query - La consulta SQL
   * @param {Array} params - Parámetros para la consulta
   * @returns {Promise} Resultado de la consulta
   */
  async query(query, params = []) {
    if (!this.isConnected) {
      throw new Error('Base de datos no conectada');
    }

    if (this.dbType === 'postgresql') {
      return await this.queryPostgreSQL(query, params);
    } else {
      return await this.querySQLite(query, params);
    }
  }

  /**
   * Ejecuta consulta en PostgreSQL
   */
  async queryPostgreSQL(query, params) {
    const client = await this.connection.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Ejecuta consulta en SQLite
   */
  async querySQLite(query, params) {
    return new Promise((resolve, reject) => {
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        this.connection.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        this.connection.run(query, params, function(err) {
          if (err) reject(err);
          else resolve({ 
            lastID: this.lastID, 
            changes: this.changes,
            affectedRows: this.changes 
          });
        });
      }
    });
  }

  /**
   * Ejecuta múltiples consultas en una transacción
   * @param {Array} queries - Array de objetos {query, params}
   */
  async transaction(queries) {
    if (this.dbType === 'postgresql') {
      return await this.transactionPostgreSQL(queries);
    } else {
      return await this.transactionSQLite(queries);
    }
  }

  /**
   * Transacción PostgreSQL
   */
  async transactionPostgreSQL(queries) {
    const client = await this.connection.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      
      for (const { query, params } of queries) {
        const result = await client.query(query, params);
        results.push(result.rows);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Transacción SQLite
   */
  async transactionSQLite(queries) {
    return new Promise((resolve, reject) => {
      this.connection.serialize(() => {
        this.connection.run('BEGIN TRANSACTION');
        
        const results = [];
        let completed = 0;
        
        const executeNext = (index) => {
          if (index >= queries.length) {
            this.connection.run('COMMIT', (err) => {
              if (err) reject(err);
              else resolve(results);
            });
            return;
          }
          
          const { query, params } = queries[index];
          
          if (query.trim().toUpperCase().startsWith('SELECT')) {
            this.connection.all(query, params, (err, rows) => {
              if (err) {
                this.connection.run('ROLLBACK');
                reject(err);
              } else {
                results.push(rows);
                executeNext(index + 1);
              }
            });
          } else {
            this.connection.run(query, params, function(err) {
              if (err) {
                this.connection.run('ROLLBACK');
                reject(err);
              } else {
                results.push({ lastID: this.lastID, changes: this.changes });
                executeNext(index + 1);
              }
            });
          }
        };
        
        executeNext(0);
      });
    });
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async close() {
    if (this.connection) {
      if (this.dbType === 'postgresql') {
        await this.connection.end();
      } else {
        return new Promise((resolve) => {
          this.connection.close((err) => {
            if (err) console.error('Error cerrando SQLite:', err);
            resolve();
          });
        });
      }
      this.isConnected = false;
      console.log('🔌 Conexión a base de datos cerrada');
    }
  }

  /**
   * Obtiene el tipo de base de datos actual
   */
  getDatabaseType() {
    return this.dbType;
  }

  /**
   * Verifica si la conexión está activa
   */
  isConnectionActive() {
    return this.isConnected;
  }
}

// Instancia singleton
const dbManager = new DatabaseManager();

module.exports = dbManager;
