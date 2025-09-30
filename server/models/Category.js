/**
 * Modelo de Categoría
 * Maneja todas las operaciones CRUD para categorías de ingresos y gastos
 */

const Joi = require('joi');
const dbManager = require('../config/database');

/**
 * Esquema de validación para categorías
 */
const categorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required()
    .messages({
      'string.min': 'El nombre de la categoría no puede estar vacío',
      'string.max': 'El nombre de la categoría no puede exceder 100 caracteres',
      'any.required': 'El nombre de la categoría es requerido'
    }),
  type: Joi.string().valid('income', 'expense').required()
    .messages({
      'any.only': 'El tipo debe ser "income" o "expense"',
      'any.required': 'El tipo es requerido'
    }),
  description: Joi.string().max(255).optional()
    .messages({
      'string.max': 'La descripción no puede exceder 255 caracteres'
    }),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
    .messages({
      'string.pattern.base': 'El color debe ser un código hexadecimal válido (ej: #FF0000)'
    }),
  icon: Joi.string().max(50).optional()
    .messages({
      'string.max': 'El icono no puede exceder 50 caracteres'
    })
});

class Category {
  /**
   * Valida los datos de una categoría
   * @param {Object} data - Datos de la categoría
   * @returns {Object} Resultado de la validación
   */
  static validate(data) {
    return categorySchema.validate(data, { abortEarly: false });
  }

  /**
   * Obtiene todas las categorías con filtros opcionales
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Array>} Lista de categorías
   */
  static async getAll(filters = {}) {
    try {
      let query = 'SELECT * FROM categories WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      // Filtrar por tipo
      if (filters.type) {
        if (dbManager.getDatabaseType() === 'postgresql') {
          query += ` AND type = $${paramIndex}`;
        } else {
          query += ' AND type = ?';
        }
        params.push(filters.type);
        paramIndex++;
      }

      // Ordenar por nombre
      query += ' ORDER BY name ASC';

      const categories = await dbManager.query(query, params);
      return categories;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw new Error('Error al obtener las categorías');
    }
  }

  /**
   * Obtiene una categoría por ID
   * @param {number} id - ID de la categoría
   * @returns {Promise<Object|null>} Categoría encontrada o null
   */
  static async getById(id) {
    try {
      const query = dbManager.getDatabaseType() === 'postgresql' 
        ? 'SELECT * FROM categories WHERE id = $1'
        : 'SELECT * FROM categories WHERE id = ?';
      
      const categories = await dbManager.query(query, [id]);
      return categories.length > 0 ? categories[0] : null;
    } catch (error) {
      console.error('Error obteniendo categoría por ID:', error);
      throw new Error('Error al obtener la categoría');
    }
  }

  /**
   * Obtiene una categoría por nombre
   * @param {string} name - Nombre de la categoría
   * @returns {Promise<Object|null>} Categoría encontrada o null
   */
  static async getByName(name) {
    try {
      const query = dbManager.getDatabaseType() === 'postgresql' 
        ? 'SELECT * FROM categories WHERE LOWER(name) = LOWER($1)'
        : 'SELECT * FROM categories WHERE LOWER(name) = LOWER(?)';
      
      const categories = await dbManager.query(query, [name]);
      return categories.length > 0 ? categories[0] : null;
    } catch (error) {
      console.error('Error obteniendo categoría por nombre:', error);
      throw new Error('Error al obtener la categoría');
    }
  }

  /**
   * Crea una nueva categoría
   * @param {Object} data - Datos de la categoría
   * @returns {Promise<Object>} Categoría creada
   */
  static async create(data) {
    // Validar datos
    const { error, value } = this.validate(data);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new Error(errorMessage);
    }

    try {
      const { name, type, description, color, icon } = value;
      
      // Verificar si la categoría ya existe
      const existingCategory = await this.getByName(name);
      if (existingCategory) {
        throw new Error('Ya existe una categoría con ese nombre');
      }

      if (dbManager.getDatabaseType() === 'postgresql') {
        const query = `
          INSERT INTO categories (name, type, description, color, icon, created_at) 
          VALUES ($1, $2, $3, $4, $5, NOW()) 
          RETURNING *
        `;
        const result = await dbManager.query(query, [name, type, description, color, icon]);
        return result[0];
      } else {
        const query = `
          INSERT INTO categories (name, type, description, color, icon) 
          VALUES (?, ?, ?, ?, ?)
        `;
        const result = await dbManager.query(query, [name, type, description, color, icon]);
        
        // Obtener la categoría creada
        return await this.getById(result.lastID);
      }
    } catch (error) {
      console.error('Error creando categoría:', error);
      throw error;
    }
  }

  /**
   * Actualiza una categoría existente
   * @param {number} id - ID de la categoría
   * @param {Object} data - Nuevos datos de la categoría
   * @returns {Promise<Object>} Categoría actualizada
   */
  static async update(id, data) {
    // Validar datos
    const { error, value } = this.validate(data);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new Error(errorMessage);
    }

    try {
      const { name, type, description, color, icon } = value;
      
      // Verificar si existe otra categoría con el mismo nombre
      const existingCategory = await this.getByName(name);
      if (existingCategory && existingCategory.id !== parseInt(id)) {
        throw new Error('Ya existe una categoría con ese nombre');
      }

      if (dbManager.getDatabaseType() === 'postgresql') {
        const query = `
          UPDATE categories 
          SET name = $1, type = $2, description = $3, color = $4, icon = $5, updated_at = NOW()
          WHERE id = $6
          RETURNING *
        `;
        const result = await dbManager.query(query, [name, type, description, color, icon, id]);
        
        if (result.length === 0) {
          throw new Error('Categoría no encontrada');
        }
        
        return result[0];
      } else {
        const query = `
          UPDATE categories 
          SET name = ?, type = ?, description = ?, color = ?, icon = ?
          WHERE id = ?
        `;
        const result = await dbManager.query(query, [name, type, description, color, icon, id]);
        
        if (result.changes === 0) {
          throw new Error('Categoría no encontrada');
        }
        
        return await this.getById(id);
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      throw error;
    }
  }

  /**
   * Elimina una categoría
   * @param {number} id - ID de la categoría
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  static async delete(id) {
    try {
      // Verificar si la categoría está siendo usada en transacciones
      const usageQuery = dbManager.getDatabaseType() === 'postgresql'
        ? 'SELECT COUNT(*) as count FROM transactions WHERE category = (SELECT name FROM categories WHERE id = $1)'
        : 'SELECT COUNT(*) as count FROM transactions WHERE category = (SELECT name FROM categories WHERE id = ?)';
      
      const usageResult = await dbManager.query(usageQuery, [id]);
      const usageCount = parseInt(usageResult[0].count);
      
      if (usageCount > 0) {
        throw new Error(`No se puede eliminar la categoría porque está siendo usada en ${usageCount} transacción(es)`);
      }

      const query = dbManager.getDatabaseType() === 'postgresql'
        ? 'DELETE FROM categories WHERE id = $1'
        : 'DELETE FROM categories WHERE id = ?';
      
      const result = await dbManager.query(query, [id]);
      
      if (dbManager.getDatabaseType() === 'postgresql') {
        return result.length > 0 || result.rowCount > 0;
      } else {
        return result.changes > 0;
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      throw error;
    }
  }

  /**
   * Obtiene categorías con estadísticas de uso
   * @param {string} type - Tipo de categoría ('income' o 'expense')
   * @returns {Promise<Array>} Categorías con estadísticas
   */
  static async getWithUsageStats(type = null) {
    try {
      let query;
      const params = [];
      let paramIndex = 1;

      if (dbManager.getDatabaseType() === 'postgresql') {
        query = `
          SELECT 
            c.*,
            COALESCE(COUNT(t.id), 0) as transaction_count,
            COALESCE(SUM(t.amount), 0) as total_amount,
            COALESCE(AVG(t.amount), 0) as avg_amount
          FROM categories c
          LEFT JOIN transactions t ON c.name = t.category
        `;
        
        if (type) {
          query += ` WHERE c.type = $${paramIndex}`;
          params.push(type);
          paramIndex++;
        }
        
        query += `
          GROUP BY c.id, c.name, c.type, c.description, c.color, c.icon, c.created_at, c.updated_at
          ORDER BY c.name ASC
        `;
      } else {
        query = `
          SELECT 
            c.*,
            COALESCE(COUNT(t.id), 0) as transaction_count,
            COALESCE(SUM(t.amount), 0) as total_amount,
            COALESCE(AVG(t.amount), 0) as avg_amount
          FROM categories c
          LEFT JOIN transactions t ON c.name = t.category
        `;
        
        if (type) {
          query += ' WHERE c.type = ?';
          params.push(type);
        }
        
        query += `
          GROUP BY c.id
          ORDER BY c.name ASC
        `;
      }

      const categories = await dbManager.query(query, params);
      
      return categories.map(category => ({
        ...category,
        transaction_count: parseInt(category.transaction_count),
        total_amount: parseFloat(category.total_amount),
        avg_amount: parseFloat(category.avg_amount)
      }));
    } catch (error) {
      console.error('Error obteniendo categorías con estadísticas:', error);
      throw new Error('Error al obtener las categorías con estadísticas');
    }
  }

  /**
   * Inicializa las categorías por defecto
   * @returns {Promise<void>}
   */
  static async initializeDefaultCategories() {
    try {
      const defaultCategories = [
        // Categorías de ingresos
        { name: 'Salario', type: 'income', description: 'Ingresos por trabajo', color: '#4CAF50', icon: '💼' },
        { name: 'Freelance', type: 'income', description: 'Trabajos independientes', color: '#2196F3', icon: '💻' },
        { name: 'Inversiones', type: 'income', description: 'Rendimientos de inversiones', color: '#FF9800', icon: '📈' },
        { name: 'Bonos', type: 'income', description: 'Bonificaciones y premios', color: '#9C27B0', icon: '🎁' },
        { name: 'Otros ingresos', type: 'income', description: 'Otros tipos de ingresos', color: '#607D8B', icon: '💰' },
        
        // Categorías de gastos
        { name: 'Alimentación', type: 'expense', description: 'Comida y bebidas', color: '#F44336', icon: '🍽️' },
        { name: 'Transporte', type: 'expense', description: 'Transporte público, combustible, etc.', color: '#FF5722', icon: '🚗' },
        { name: 'Servicios', type: 'expense', description: 'Electricidad, agua, internet, etc.', color: '#795548', icon: '🏠' },
        { name: 'Entretenimiento', type: 'expense', description: 'Ocio y diversión', color: '#E91E63', icon: '🎬' },
        { name: 'Salud', type: 'expense', description: 'Gastos médicos y farmacia', color: '#009688', icon: '🏥' },
        { name: 'Educación', type: 'expense', description: 'Cursos, libros, etc.', color: '#3F51B5', icon: '📚' },
        { name: 'Ropa', type: 'expense', description: 'Vestimenta y calzado', color: '#673AB7', icon: '👕' },
        { name: 'Hogar', type: 'expense', description: 'Artículos para el hogar', color: '#8BC34A', icon: '🏡' },
        { name: 'Otros gastos', type: 'expense', description: 'Gastos varios', color: '#9E9E9E', icon: '💸' }
      ];

      for (const categoryData of defaultCategories) {
        try {
          const existing = await this.getByName(categoryData.name);
          if (!existing) {
            await this.create(categoryData);
            console.log(`✅ Categoría creada: ${categoryData.name}`);
          }
        } catch (error) {
          // Ignorar errores de categorías duplicadas
          if (!error.message.includes('Ya existe una categoría')) {
            console.error(`Error creando categoría ${categoryData.name}:`, error.message);
          }
        }
      }

      console.log('✅ Categorías por defecto inicializadas');
    } catch (error) {
      console.error('Error inicializando categorías por defecto:', error);
      throw error;
    }
  }
}

module.exports = Category;
