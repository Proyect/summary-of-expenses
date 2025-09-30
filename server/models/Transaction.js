/**
 * Modelo de Transacción
 * Maneja todas las operaciones CRUD para transacciones de ingresos y gastos
 */

const Joi = require('joi');
const dbManager = require('../config/database');

/**
 * Esquema de validación para transacciones
 */
const transactionSchema = Joi.object({
  type: Joi.string().valid('income', 'expense').required()
    .messages({
      'any.only': 'El tipo debe ser "income" o "expense"',
      'any.required': 'El tipo es requerido'
    }),
  amount: Joi.number().positive().precision(2).required()
    .messages({
      'number.positive': 'El monto debe ser mayor a 0',
      'any.required': 'El monto es requerido'
    }),
  description: Joi.string().min(1).max(255).required()
    .messages({
      'string.min': 'La descripción no puede estar vacía',
      'string.max': 'La descripción no puede exceder 255 caracteres',
      'any.required': 'La descripción es requerida'
    }),
  category: Joi.string().min(1).max(100).required()
    .messages({
      'string.min': 'La categoría no puede estar vacía',
      'string.max': 'La categoría no puede exceder 100 caracteres',
      'any.required': 'La categoría es requerida'
    }),
  date: Joi.date().iso().required()
    .messages({
      'date.format': 'La fecha debe estar en formato ISO (YYYY-MM-DD)',
      'any.required': 'La fecha es requerida'
    })
});

class Transaction {
  /**
   * Valida los datos de una transacción
   * @param {Object} data - Datos de la transacción
   * @returns {Object} Resultado de la validación
   */
  static validate(data) {
    return transactionSchema.validate(data, { abortEarly: false });
  }

  /**
   * Obtiene todas las transacciones con filtros opcionales
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Array>} Lista de transacciones
   */
  static async getAll(filters = {}) {
    try {
      let query = 'SELECT * FROM transactions WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      // Aplicar filtros
      if (filters.type) {
        if (dbManager.getDatabaseType() === 'postgresql') {
          query += ` AND type = $${paramIndex}`;
        } else {
          query += ' AND type = ?';
        }
        params.push(filters.type);
        paramIndex++;
      }

      if (filters.category) {
        if (dbManager.getDatabaseType() === 'postgresql') {
          query += ` AND category = $${paramIndex}`;
        } else {
          query += ' AND category = ?';
        }
        params.push(filters.category);
        paramIndex++;
      }

      if (filters.startDate) {
        if (dbManager.getDatabaseType() === 'postgresql') {
          query += ` AND date >= $${paramIndex}`;
        } else {
          query += ' AND date >= ?';
        }
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        if (dbManager.getDatabaseType() === 'postgresql') {
          query += ` AND date <= $${paramIndex}`;
        } else {
          query += ' AND date <= ?';
        }
        params.push(filters.endDate);
        paramIndex++;
      }

      // Ordenar por fecha descendente
      query += ' ORDER BY date DESC, created_at DESC';

      // Aplicar límite si se especifica
      if (filters.limit) {
        if (dbManager.getDatabaseType() === 'postgresql') {
          query += ` LIMIT $${paramIndex}`;
        } else {
          query += ' LIMIT ?';
        }
        params.push(filters.limit);
        paramIndex++;
      }

      const transactions = await dbManager.query(query, params);
      return transactions;
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      throw new Error('Error al obtener las transacciones');
    }
  }

  /**
   * Obtiene una transacción por ID
   * @param {number} id - ID de la transacción
   * @returns {Promise<Object|null>} Transacción encontrada o null
   */
  static async getById(id) {
    try {
      const query = dbManager.getDatabaseType() === 'postgresql' 
        ? 'SELECT * FROM transactions WHERE id = $1'
        : 'SELECT * FROM transactions WHERE id = ?';
      
      const transactions = await dbManager.query(query, [id]);
      return transactions.length > 0 ? transactions[0] : null;
    } catch (error) {
      console.error('Error obteniendo transacción por ID:', error);
      throw new Error('Error al obtener la transacción');
    }
  }

  /**
   * Crea una nueva transacción
   * @param {Object} data - Datos de la transacción
   * @returns {Promise<Object>} Transacción creada
   */
  static async create(data) {
    // Validar datos
    const { error, value } = this.validate(data);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      const e = new Error(errorMessage);
      e.name = 'ValidationError';
      throw e;
    }

    try {
      const { type, amount, description, category, date } = value;
      
      if (dbManager.getDatabaseType() === 'postgresql') {
        const query = `
          INSERT INTO transactions (type, amount, description, category, date, created_at) 
          VALUES ($1, $2, $3, $4, $5, NOW()) 
          RETURNING *
        `;
        const result = await dbManager.query(query, [type, amount, description, category, date]);
        return result[0];
      } else {
        const query = `
          INSERT INTO transactions (type, amount, description, category, date) 
          VALUES (?, ?, ?, ?, ?)
        `;
        const result = await dbManager.query(query, [type, amount, description, category, date]);
        
        // Obtener la transacción creada
        return await this.getById(result.lastID);
      }
    } catch (error) {
      console.error('Error creando transacción:', error);
      throw new Error('Error al crear la transacción');
    }
  }

  /**
   * Actualiza una transacción existente
   * @param {number} id - ID de la transacción
   * @param {Object} data - Nuevos datos de la transacción
   * @returns {Promise<Object>} Transacción actualizada
   */
  static async update(id, data) {
    // Validar datos
    const { error, value } = this.validate(data);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      const e = new Error(errorMessage);
      e.name = 'ValidationError';
      throw e;
    }

    try {
      const { type, amount, description, category, date } = value;
      
      if (dbManager.getDatabaseType() === 'postgresql') {
        const query = `
          UPDATE transactions 
          SET type = $1, amount = $2, description = $3, category = $4, date = $5, updated_at = NOW()
          WHERE id = $6
          RETURNING *
        `;
        const result = await dbManager.query(query, [type, amount, description, category, date, id]);
        
        if (result.length === 0) {
          throw new Error('Transacción no encontrada');
        }
        
        return result[0];
      } else {
        const query = `
          UPDATE transactions 
          SET type = ?, amount = ?, description = ?, category = ?, date = ?
          WHERE id = ?
        `;
        const result = await dbManager.query(query, [type, amount, description, category, date, id]);
        
        if (result.changes === 0) {
          throw new Error('Transacción no encontrada');
        }
        
        return await this.getById(id);
      }
    } catch (error) {
      console.error('Error actualizando transacción:', error);
      throw error;
    }
  }

  /**
   * Elimina una transacción
   * @param {number} id - ID de la transacción
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  static async delete(id) {
    try {
      if (dbManager.getDatabaseType() === 'postgresql') {
        const query = 'DELETE FROM transactions WHERE id = $1 RETURNING *';
        const result = await dbManager.query(query, [id]);
        return result.length > 0;
      } else {
        const query = 'DELETE FROM transactions WHERE id = ?';
        const result = await dbManager.query(query, [id]);
        return result.changes > 0;
      }
    } catch (error) {
      console.error('Error eliminando transacción:', error);
      throw new Error('Error al eliminar la transacción');
    }
  }

  /**
   * Obtiene estadísticas de transacciones
   * @param {Object} filters - Filtros de fecha
   * @returns {Promise<Object>} Estadísticas calculadas
   */
  static async getStatistics(filters = {}) {
    try {
      let dateFilter = '';
      const params = [];
      let paramIndex = 1;

      if (filters.startDate && filters.endDate) {
        if (dbManager.getDatabaseType() === 'postgresql') {
          dateFilter = ` WHERE date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
          params.push(filters.startDate, filters.endDate);
        } else {
          dateFilter = ' WHERE date BETWEEN ? AND ?';
          params.push(filters.startDate, filters.endDate);
        }
      }

      const queries = [
        `SELECT COALESCE(SUM(amount), 0) as total_income FROM transactions WHERE type = 'income'${dateFilter}`,
        `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM transactions WHERE type = 'expense'${dateFilter}`,
        `SELECT category, SUM(amount) as total FROM transactions WHERE type = 'expense'${dateFilter} GROUP BY category ORDER BY total DESC`,
        `SELECT category, SUM(amount) as total FROM transactions WHERE type = 'income'${dateFilter} GROUP BY category ORDER BY total DESC`
      ];

      const results = await Promise.all(
        queries.map(query => dbManager.query(query, params))
      );

      const totalIncome = parseFloat(results[0][0]?.total_income || 0);
      const totalExpenses = parseFloat(results[1][0]?.total_expenses || 0);
      const expensesByCategory = results[2] || [];
      const incomeByCategory = results[3] || [];

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        expensesByCategory: expensesByCategory.map(item => ({
          category: item.category,
          total: parseFloat(item.total)
        })),
        incomeByCategory: incomeByCategory.map(item => ({
          category: item.category,
          total: parseFloat(item.total)
        }))
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error('Error al obtener las estadísticas');
    }
  }

  /**
   * Obtiene transacciones agrupadas por mes
   * @param {number} year - Año para filtrar
   * @returns {Promise<Array>} Transacciones agrupadas por mes
   */
  static async getMonthlyData(year) {
    try {
      let query;
      const params = [year];

      if (dbManager.getDatabaseType() === 'postgresql') {
        query = `
          SELECT 
            EXTRACT(MONTH FROM date) as month,
            type,
            SUM(amount) as total
          FROM transactions 
          WHERE EXTRACT(YEAR FROM date) = $1
          GROUP BY EXTRACT(MONTH FROM date), type
          ORDER BY month, type
        `;
      } else {
        query = `
          SELECT 
            CAST(strftime('%m', date) AS INTEGER) as month,
            type,
            SUM(amount) as total
          FROM transactions 
          WHERE strftime('%Y', date) = ?
          GROUP BY strftime('%m', date), type
          ORDER BY month, type
        `;
      }

      const results = await dbManager.query(query, params);
      
      return results.map(item => ({
        month: parseInt(item.month),
        type: item.type,
        total: parseFloat(item.total)
      }));
    } catch (error) {
      console.error('Error obteniendo datos mensuales:', error);
      throw new Error('Error al obtener los datos mensuales');
    }
  }
}

module.exports = Transaction;
