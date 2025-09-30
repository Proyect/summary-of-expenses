/**
 * Script de migración de base de datos
 * Crea las tablas necesarias para el sistema de control de gastos
 * Soporta SQLite y PostgreSQL
 */

require('dotenv').config();
const dbManager = require('../config/database');

/**
 * Definición de las migraciones
 */
const migrations = {
  sqlite: {
    // Tabla de transacciones
    transactions: `
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount REAL NOT NULL CHECK(amount > 0),
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
    
    // Tabla de categorías
    categories: `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        description TEXT,
        color TEXT,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
    
    // Índices para optimizar consultas
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)',
      'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)'
    ]
  },
  
  postgresql: {
    // Tabla de transacciones
    transactions: `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL CHECK(type IN ('income', 'expense')),
        amount DECIMAL(12,2) NOT NULL CHECK(amount > 0),
        description VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
    
    // Tabla de categorías
    categories: `
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        type VARCHAR(10) NOT NULL CHECK(type IN ('income', 'expense')),
        description TEXT,
        color VARCHAR(7),
        icon VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
    
    // Índices para optimizar consultas
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)',
      'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)'
    ],
    
    // Triggers para actualizar updated_at automáticamente
    triggers: [
      `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `,
      `
        DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
        CREATE TRIGGER update_transactions_updated_at
          BEFORE UPDATE ON transactions
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `,
      `
        DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
        CREATE TRIGGER update_categories_updated_at
          BEFORE UPDATE ON categories
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `
    ]
  }
};

/**
 * Ejecuta las migraciones
 */
async function runMigrations() {
  try {
    console.log('🚀 Iniciando migraciones de base de datos...');
    
    // Conectar a la base de datos
    await dbManager.connect();
    
    const dbType = dbManager.getDatabaseType();
    const migrationSet = migrations[dbType];
    
    if (!migrationSet) {
      throw new Error(`Tipo de base de datos no soportado: ${dbType}`);
    }
    
    console.log(`📊 Ejecutando migraciones para ${dbType.toUpperCase()}`);
    
    // Crear tabla de transacciones
    console.log('📝 Creando tabla de transacciones...');
    await dbManager.query(migrationSet.transactions);
    console.log('✅ Tabla de transacciones creada');
    
    // Crear tabla de categorías
    console.log('📝 Creando tabla de categorías...');
    await dbManager.query(migrationSet.categories);
    console.log('✅ Tabla de categorías creada');
    
    // Crear índices
    console.log('📝 Creando índices...');
    for (const indexQuery of migrationSet.indexes) {
      await dbManager.query(indexQuery);
    }
    console.log('✅ Índices creados');
    
    // Crear triggers (solo PostgreSQL)
    if (dbType === 'postgresql' && migrationSet.triggers) {
      console.log('📝 Creando triggers...');
      for (const triggerQuery of migrationSet.triggers) {
        await dbManager.query(triggerQuery);
      }
      console.log('✅ Triggers creados');
    }
    
    console.log('🎉 Migraciones completadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  } finally {
    await dbManager.close();
  }
}

/**
 * Verifica el estado de las migraciones
 */
async function checkMigrationStatus() {
  try {
    await dbManager.connect();
    
    const dbType = dbManager.getDatabaseType();
    console.log(`📊 Verificando estado de migraciones para ${dbType.toUpperCase()}`);
    
    // Verificar tabla de transacciones
    try {
      const transactionsQuery = dbType === 'postgresql' 
        ? "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'transactions'"
        : "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='transactions'";
      
      const transactionsResult = await dbManager.query(transactionsQuery);
      const transactionsExists = dbType === 'postgresql' 
        ? parseInt(transactionsResult[0].count) > 0
        : parseInt(transactionsResult[0].count) > 0;
      
      console.log(`📋 Tabla transactions: ${transactionsExists ? '✅ Existe' : '❌ No existe'}`);
    } catch (error) {
      console.log('📋 Tabla transactions: ❌ No existe');
    }
    
    // Verificar tabla de categorías
    try {
      const categoriesQuery = dbType === 'postgresql' 
        ? "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'categories'"
        : "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='categories'";
      
      const categoriesResult = await dbManager.query(categoriesQuery);
      const categoriesExists = dbType === 'postgresql' 
        ? parseInt(categoriesResult[0].count) > 0
        : parseInt(categoriesResult[0].count) > 0;
      
      console.log(`📋 Tabla categories: ${categoriesExists ? '✅ Existe' : '❌ No existe'}`);
    } catch (error) {
      console.log('📋 Tabla categories: ❌ No existe');
    }
    
  } catch (error) {
    console.error('❌ Error verificando estado de migraciones:', error);
  } finally {
    await dbManager.close();
  }
}

/**
 * Función principal
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      await checkMigrationStatus();
      break;
    case 'run':
    default:
      await runMigrations();
      break;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  runMigrations,
  checkMigrationStatus
};
