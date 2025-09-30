/**
 * Servidor principal del Sistema de Control de Gastos del Hogar
 * 
 * Este servidor proporciona una API RESTful completa para gestionar:
 * - Transacciones de ingresos y gastos
 * - Categorías personalizables
 * - Estadísticas y reportes
 * - Soporte para SQLite y PostgreSQL
 * 
 * Características:
 * - Validación completa de datos con Joi
 * - Manejo de errores robusto
 * - Rate limiting y seguridad con Helmet
 * - Logging con Morgan
 * - Compresión de respuestas
 * - Cierre graceful del servidor
 * - Migraciones automáticas de base de datos
 * 
 * @author Sistema de Control de Gastos
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar configuración y modelos
const dbManager = require('./config/database');
const Transaction = require('./models/Transaction');
const Category = require('./models/Category');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite de 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware de seguridad y utilidades
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
}));
app.use(compression());
app.use(limiter);
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Servir archivos estáticos del frontend en producción
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }
  
  // Error de base de datos
  if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') {
    return res.status(409).json({
      error: 'Conflicto en la base de datos',
      details: 'El recurso ya existe o viola una restricción'
    });
  }
  
  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    details: NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
};

// Inicializar base de datos
async function initializeDatabase() {
  try {
    await dbManager.connect();
    console.log('✅ Base de datos conectada exitosamente');
    
    // Ejecutar migraciones si es necesario
    const { runMigrations } = require('./scripts/migrate');
    await runMigrations();
    
    // Inicializar categorías por defecto
    await Category.initializeDefaultCategories();
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
}

// ==========================================
// RUTAS DE LA API
// ==========================================

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbManager.isConnectionActive() ? 'Connected' : 'Disconnected',
    version: '1.0.0'
  });
});

// ==========================================
// RUTAS DE TRANSACCIONES
// ==========================================

/**
 * GET /api/transactions
 * Obtiene todas las transacciones con filtros opcionales
 */
app.get('/api/transactions', async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type,
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    
    const transactions = await Transaction.getAll(filters);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transactions/:id
 * Obtiene una transacción específica por ID
 */
app.get('/api/transactions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.getById(id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/transactions
 * Crea una nueva transacción
 */
app.post('/api/transactions', async (req, res, next) => {
  try {
    const transaction = await Transaction.create(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/transactions/:id
 * Actualiza una transacción existente
 */
app.put('/api/transactions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.update(id, req.body);
    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/transactions/:id
 * Elimina una transacción
 */
app.delete('/api/transactions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    res.json({ message: 'Transacción eliminada correctamente' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// RUTAS DE CATEGORÍAS
// ==========================================

/**
 * GET /api/categories
 * Obtiene todas las categorías con filtros opcionales
 */
app.get('/api/categories', async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type
    };
    
    const categories = await Category.getAll(filters);
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories/:id
 * Obtiene una categoría específica por ID
 */
app.get('/api/categories/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.getById(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json(category);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories/stats
 * Obtiene categorías con estadísticas de uso
 */
app.get('/api/categories/stats', async (req, res, next) => {
  try {
    const { type } = req.query;
    const categories = await Category.getWithUsageStats(type);
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/categories
 * Crea una nueva categoría
 */
app.post('/api/categories', async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/categories/:id
 * Actualiza una categoría existente
 */
app.put('/api/categories/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.update(id, req.body);
    res.json(category);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/categories/:id
 * Elimina una categoría
 */
app.delete('/api/categories/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Category.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// RUTAS DE ESTADÍSTICAS Y REPORTES
// ==========================================

/**
 * GET /api/summary
 * Obtiene resumen financiero con estadísticas generales
 */
app.get('/api/summary', async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const summary = await Transaction.getStatistics(filters);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/monthly/:year
 * Obtiene datos mensuales para un año específico
 */
app.get('/api/reports/monthly/:year', async (req, res, next) => {
  try {
    const { year } = req.params;
    const yearInt = parseInt(year);
    
    if (isNaN(yearInt) || yearInt < 2000 || yearInt > 2100) {
      return res.status(400).json({ error: 'Año inválido' });
    }
    
    const monthlyData = await Transaction.getMonthlyData(yearInt);
    res.json(monthlyData);
  } catch (error) {
    next(error);
  }
});

// Aplicar middleware de manejo de errores
app.use(errorHandler);

// Ruta catch-all para servir el frontend en producción
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });
}

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================

/**
 * Inicia el servidor después de inicializar la base de datos
 */
async function startServer() {
  try {
    // Inicializar base de datos
    await initializeDatabase();
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log('🚀 ===================================');
      console.log('🏠 Sistema de Control de Gastos del Hogar');
      console.log('🚀 ===================================');
      console.log(`📡 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${NODE_ENV}`);
      console.log(`💾 Base de datos: ${dbManager.getDatabaseType().toUpperCase()}`);
      console.log(`🔗 URL local: http://localhost:${PORT}`);
      if (NODE_ENV === 'development') {
        console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
      }
      console.log('🚀 ===================================');
    });
    
    // Configurar cierre graceful
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor...`);
      
      server.close(async () => {
        console.log('🔌 Servidor HTTP cerrado');
        
        try {
          await dbManager.close();
          console.log('💾 Conexión a base de datos cerrada');
          console.log('✅ Cierre graceful completado');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error cerrando base de datos:', error);
          process.exit(1);
        }
      });
      
      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️  Forzando cierre del servidor');
        process.exit(1);
      }, 10000);
    };
    
    // Manejar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Manejar errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
    
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
  } catch (error) {
    console.error('❌ Error fatal iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
