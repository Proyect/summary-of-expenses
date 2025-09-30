/**
 * Script de seeders para la base de datos
 * Inicializa datos por defecto como categorías y transacciones de ejemplo
 */

require('dotenv').config();
const dbManager = require('../config/database');
const Category = require('../models/Category');

/**
 * Datos de ejemplo para transacciones
 */
const sampleTransactions = [
  // Ingresos de ejemplo
  {
    type: 'income',
    amount: 3000.00,
    description: 'Salario mensual',
    category: 'Salario',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 30 días
  },
  {
    type: 'income',
    amount: 500.00,
    description: 'Proyecto freelance',
    category: 'Freelance',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 15 días
  },
  {
    type: 'income',
    amount: 150.00,
    description: 'Dividendos de inversión',
    category: 'Inversiones',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 10 días
  },
  
  // Gastos de ejemplo
  {
    type: 'expense',
    amount: 450.00,
    description: 'Compra mensual supermercado',
    category: 'Alimentación',
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 25 días
  },
  {
    type: 'expense',
    amount: 120.00,
    description: 'Electricidad',
    category: 'Servicios',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 20 días
  },
  {
    type: 'expense',
    amount: 80.00,
    description: 'Combustible',
    category: 'Transporte',
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 18 días
  },
  {
    type: 'expense',
    amount: 60.00,
    description: 'Internet',
    category: 'Servicios',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 15 días
  },
  {
    type: 'expense',
    amount: 25.00,
    description: 'Cine',
    category: 'Entretenimiento',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 12 días
  },
  {
    type: 'expense',
    amount: 35.00,
    description: 'Farmacia',
    category: 'Salud',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 8 días
  },
  {
    type: 'expense',
    amount: 200.00,
    description: 'Ropa de invierno',
    category: 'Ropa',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 5 días
  },
  {
    type: 'expense',
    amount: 75.00,
    description: 'Cena restaurante',
    category: 'Alimentación',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 3 días
  },
  {
    type: 'expense',
    amount: 40.00,
    description: 'Productos de limpieza',
    category: 'Hogar',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Hace 1 día
  }
];

/**
 * Inicializa las categorías por defecto
 */
async function seedCategories() {
  try {
    console.log('🌱 Inicializando categorías por defecto...');
    await Category.initializeDefaultCategories();
    console.log('✅ Categorías inicializadas correctamente');
  } catch (error) {
    console.error('❌ Error inicializando categorías:', error);
    throw error;
  }
}

/**
 * Inicializa transacciones de ejemplo
 */
async function seedTransactions() {
  try {
    console.log('🌱 Creando transacciones de ejemplo...');
    
    const dbType = dbManager.getDatabaseType();
    let createdCount = 0;
    
    for (const transaction of sampleTransactions) {
      try {
        let query, params;
        
        if (dbType === 'postgresql') {
          query = `
            INSERT INTO transactions (type, amount, description, category, date, created_at) 
            VALUES ($1, $2, $3, $4, $5, NOW())
          `;
          params = [transaction.type, transaction.amount, transaction.description, transaction.category, transaction.date];
        } else {
          query = `
            INSERT INTO transactions (type, amount, description, category, date) 
            VALUES (?, ?, ?, ?, ?)
          `;
          params = [transaction.type, transaction.amount, transaction.description, transaction.category, transaction.date];
        }
        
        await dbManager.query(query, params);
        createdCount++;
        
      } catch (error) {
        console.warn(`⚠️  Error creando transacción "${transaction.description}":`, error.message);
      }
    }
    
    console.log(`✅ ${createdCount} transacciones de ejemplo creadas`);
    
  } catch (error) {
    console.error('❌ Error creando transacciones de ejemplo:', error);
    throw error;
  }
}

/**
 * Verifica si ya existen datos en la base de datos
 */
async function checkExistingData() {
  try {
    // Verificar categorías
    const categoriesQuery = 'SELECT COUNT(*) as count FROM categories';
    const categoriesResult = await dbManager.query(categoriesQuery);
    const categoriesCount = parseInt(categoriesResult[0].count);
    
    // Verificar transacciones
    const transactionsQuery = 'SELECT COUNT(*) as count FROM transactions';
    const transactionsResult = await dbManager.query(transactionsQuery);
    const transactionsCount = parseInt(transactionsResult[0].count);
    
    return {
      categories: categoriesCount,
      transactions: transactionsCount
    };
  } catch (error) {
    console.error('❌ Error verificando datos existentes:', error);
    return { categories: 0, transactions: 0 };
  }
}

/**
 * Limpia todos los datos de la base de datos
 */
async function clearAllData() {
  try {
    console.log('🧹 Limpiando datos existentes...');
    
    // Eliminar transacciones primero (por foreign key constraints)
    await dbManager.query('DELETE FROM transactions');
    console.log('✅ Transacciones eliminadas');
    
    // Eliminar categorías
    await dbManager.query('DELETE FROM categories');
    console.log('✅ Categorías eliminadas');
    
    // Reiniciar secuencias (solo PostgreSQL)
    if (dbManager.getDatabaseType() === 'postgresql') {
      await dbManager.query('ALTER SEQUENCE transactions_id_seq RESTART WITH 1');
      await dbManager.query('ALTER SEQUENCE categories_id_seq RESTART WITH 1');
      console.log('✅ Secuencias reiniciadas');
    }
    
    console.log('🧹 Base de datos limpiada');
    
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
    throw error;
  }
}

/**
 * Ejecuta todos los seeders
 */
async function runSeeders(options = {}) {
  try {
    console.log('🌱 Iniciando proceso de seeding...');
    
    // Conectar a la base de datos
    await dbManager.connect();
    
    const dbType = dbManager.getDatabaseType();
    console.log(`📊 Ejecutando seeders para ${dbType.toUpperCase()}`);
    
    // Verificar datos existentes
    const existingData = await checkExistingData();
    console.log(`📊 Datos existentes: ${existingData.categories} categorías, ${existingData.transactions} transacciones`);
    
    // Limpiar datos si se solicita
    if (options.fresh || options.clear) {
      await clearAllData();
    }
    
    // Inicializar categorías
    if (options.fresh || options.clear || existingData.categories === 0) {
      await seedCategories();
    } else {
      console.log('ℹ️  Saltando categorías (ya existen datos)');
    }
    
    // Inicializar transacciones de ejemplo
    if (options.withSamples && (options.fresh || options.clear || existingData.transactions === 0)) {
      await seedTransactions();
    } else if (options.withSamples) {
      console.log('ℹ️  Saltando transacciones de ejemplo (ya existen datos)');
    }
    
    // Mostrar resumen final
    const finalData = await checkExistingData();
    console.log('📊 Resumen final:');
    console.log(`   📁 Categorías: ${finalData.categories}`);
    console.log(`   📝 Transacciones: ${finalData.transactions}`);
    
    console.log('🎉 Proceso de seeding completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    process.exit(1);
  } finally {
    await dbManager.close();
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    fresh: args.includes('--fresh'),
    clear: args.includes('--clear'),
    withSamples: args.includes('--samples') || args.includes('--with-samples'),
    help: args.includes('--help') || args.includes('-h')
  };
  
  if (options.help) {
    console.log(`
🌱 Script de Seeding - Control de Gastos del Hogar

Uso: node seed.js [opciones]

Opciones:
  --fresh         Limpia todos los datos y los recrea desde cero
  --clear         Solo limpia los datos existentes
  --samples       Incluye transacciones de ejemplo
  --with-samples  Alias para --samples
  --help, -h      Muestra esta ayuda

Ejemplos:
  node seed.js                    # Solo crea categorías si no existen
  node seed.js --samples          # Crea categorías y transacciones de ejemplo
  node seed.js --fresh --samples  # Limpia todo y recrea con ejemplos
  node seed.js --clear            # Solo limpia los datos
    `);
    return;
  }
  
  await runSeeders(options);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  runSeeders,
  seedCategories,
  seedTransactions,
  clearAllData,
  checkExistingData
};
