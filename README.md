# 🏠 Sistema de Control de Gastos del Hogar

Un sistema completo y portable para el registro y control de ingresos y gastos domésticos, desarrollado con Node.js, Express, React y soporte para SQLite y PostgreSQL.

## 📋 Características

### 🎯 Funcionalidades Principales
- ✅ **Gestión de Transacciones**: Registro completo de ingresos y gastos
- 📊 **Categorización Inteligente**: Sistema de categorías personalizables con iconos
- 📈 **Análisis Visual**: Gráficos interactivos con Chart.js
- 🔍 **Filtros Avanzados**: Búsqueda por fecha, categoría, tipo y texto
- 📱 **Diseño Responsivo**: Interfaz adaptable a dispositivos móviles
- 💾 **Base de Datos Dual**: Soporte para SQLite (portable) y PostgreSQL (producción)

### 🛡️ Características Técnicas
- 🔒 **Seguridad**: Helmet, rate limiting, validación con Joi
- 🚀 **Performance**: Compresión, índices de base de datos, paginación
- 📝 **Logging**: Sistema completo de logs con Morgan
- 🔄 **Migraciones**: Sistema automático de migraciones de base de datos
- 🌱 **Seeders**: Datos de ejemplo y categorías por defecto
- ⚡ **API RESTful**: Endpoints completos y documentados

## 🚀 Instalación Rápida

### Prerrequisitos
- Node.js >= 16.0.0
- npm >= 8.0.0

### 1. Clonar e Instalar
```bash
# Instalar todas las dependencias
npm run install-all
```

### 2. Configurar Variables de Entorno
```bash
# Copiar archivo de configuración
cp server/.env.example server/.env

# Editar configuración (opcional para SQLite)
# Para PostgreSQL, configurar las variables correspondientes
```

### 3. Inicializar Base de Datos
```bash
# Ejecutar migraciones y seeders
cd server
npm run setup
```

### 4. Ejecutar en Desarrollo
```bash
# Desde la raíz del proyecto
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📁 Estructura del Proyecto

```
summary-of-expenses/
├── 📁 client/                    # Frontend React
│   ├── 📁 public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── 📁 src/
│   │   ├── 📁 components/        # Componentes React
│   │   │   ├── TransactionForm.js
│   │   │   ├── TransactionList.js
│   │   │   ├── Summary.js
│   │   │   └── Charts.js
│   │   ├── App.js               # Componente principal
│   │   ├── index.js            # Punto de entrada
│   │   └── index.css           # Estilos globales
│   └── package.json
├── 📁 server/                   # Backend Node.js/Express
│   ├── 📁 config/
│   │   └── database.js         # Configuración de BD
│   ├── 📁 models/
│   │   ├── Transaction.js      # Modelo de transacciones
│   │   └── Category.js         # Modelo de categorías
│   ├── 📁 scripts/
│   │   ├── migrate.js          # Migraciones de BD
│   │   └── seed.js             # Datos iniciales
│   ├── index.js                # Servidor principal
│   ├── .env                    # Variables de entorno
│   ├── .env.example           # Plantilla de configuración
│   └── package.json
├── package.json                # Scripts principales
└── README.md                   # Esta documentación
```

## 🔧 Configuración

### Variables de Entorno

Edita el archivo `server/.env` con tu configuración:

```env
# Configuración del servidor
PORT=5000
NODE_ENV=development

# Base de datos (sqlite por defecto)
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=./database.sqlite

# Para PostgreSQL (opcional)
# DATABASE_TYPE=postgresql
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_DB=expense_tracker
# POSTGRES_USER=tu_usuario
# POSTGRES_PASSWORD=tu_contraseña
# POSTGRES_SSL=false

# Seguridad
JWT_SECRET=tu-clave-secreta-super-segura
BCRYPT_ROUNDS=12

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuración de PostgreSQL

Para usar PostgreSQL en lugar de SQLite:

1. **Instalar PostgreSQL** en tu sistema
2. **Crear base de datos**:
   ```sql
   CREATE DATABASE expense_tracker;
   CREATE USER expense_user WITH PASSWORD 'tu_password';
   GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_user;
   ```
3. **Configurar variables de entorno** en `server/.env`
4. **Ejecutar migraciones**: `npm run migrate`

## 📚 Scripts Disponibles

### Scripts Principales
```bash
# Desarrollo (frontend + backend)
npm run dev

# Instalar todas las dependencias
npm run install-all

# Construir para producción
npm run build-all

# Ejecutar en producción
npm start
```

### Scripts del Backend
```bash
cd server

# Desarrollo con auto-reload
npm run dev

# Producción
npm start

# Migraciones de base de datos
npm run migrate

# Seeders (datos iniciales)
npm run seed

# Setup completo (migraciones + seeders)
npm run setup

# Linting y formato
npm run lint
npm run format

# Tests
npm test
```

### Scripts del Frontend
```bash
cd client

# Desarrollo
npm start

# Construcción para producción
npm run build

# Tests
npm test
```

## 🗄️ Base de Datos

### Modelos de Datos

#### Transacciones
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK(type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL CHECK(amount > 0),
  description VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Categorías
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(10) NOT NULL CHECK(type IN ('income', 'expense')),
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Comandos de Base de Datos

```bash
# Verificar estado de migraciones
node scripts/migrate.js status

# Ejecutar migraciones
node scripts/migrate.js run

# Limpiar datos y recrear
node scripts/seed.js --fresh --samples

# Solo categorías por defecto
node scripts/seed.js

# Con datos de ejemplo
node scripts/seed.js --samples
```

## 🌐 API Endpoints

### Transacciones
- `GET /api/transactions` - Listar transacciones (con filtros)
- `GET /api/transactions/:id` - Obtener transacción específica
- `POST /api/transactions` - Crear nueva transacción
- `PUT /api/transactions/:id` - Actualizar transacción
- `DELETE /api/transactions/:id` - Eliminar transacción

### Categorías
- `GET /api/categories` - Listar categorías
- `GET /api/categories/:id` - Obtener categoría específica
- `GET /api/categories/stats` - Categorías con estadísticas de uso
- `POST /api/categories` - Crear nueva categoría
- `PUT /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría

### Reportes y Estadísticas
- `GET /api/summary` - Resumen financiero general
- `GET /api/reports/monthly/:year` - Datos mensuales por año
- `GET /api/health` - Estado del servidor

### Ejemplos de Uso

```bash
# Obtener todas las transacciones de gastos
curl "http://localhost:5000/api/transactions?type=expense"

# Crear nueva transacción
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": 50.00,
    "description": "Compra supermercado",
    "category": "Alimentación",
    "date": "2024-01-15"
  }'

# Obtener resumen financiero
curl "http://localhost:5000/api/summary"
```

## 🎨 Interfaz de Usuario

### Características del Frontend
- **Dashboard Intuitivo**: Resumen visual con tarjetas de estadísticas
- **Formularios Inteligentes**: Validación en tiempo real
- **Filtros Avanzados**: Búsqueda por múltiples criterios
- **Gráficos Interactivos**: Visualizaciones con Chart.js
- **Diseño Responsivo**: Adaptable a móviles y tablets

### Navegación
1. **Resumen**: Dashboard principal con estadísticas
2. **Agregar Transacción**: Formulario de nueva transacción
3. **Historial**: Lista completa con filtros y paginación
4. **Gráficos**: Análisis visual y recomendaciones

## 🚀 Despliegue

### Desarrollo Local
```bash
# Clonar repositorio
git clone <tu-repositorio>
cd summary-of-expenses

# Instalar y configurar
npm run install-all
cp server/.env.example server/.env

# Inicializar base de datos
cd server && npm run setup

# Ejecutar en desarrollo
npm run dev
```

### Producción

#### Opción 1: Servidor Tradicional
```bash
# Construir aplicación
npm run build-all

# Configurar variables de entorno para producción
export NODE_ENV=production
export PORT=80

# Ejecutar
npm start
```

#### Opción 2: Docker (Próximamente)
```bash
# Construir imagen
docker build -t expense-tracker .

# Ejecutar contenedor
docker run -p 3000:3000 expense-tracker
```

### Variables de Entorno para Producción
```env
NODE_ENV=production
PORT=80
DATABASE_TYPE=postgresql
POSTGRES_HOST=tu-host-db
POSTGRES_DB=expense_tracker_prod
POSTGRES_USER=usuario_prod
POSTGRES_PASSWORD=password_seguro
JWT_SECRET=clave-super-secreta-de-produccion
```

## 🛠️ Desarrollo

### Agregar Nueva Funcionalidad

1. **Backend**: Crear endpoint en `server/index.js`
2. **Modelo**: Actualizar modelos en `server/models/`
3. **Frontend**: Crear componente en `client/src/components/`
4. **Estilos**: Actualizar `client/src/index.css`

### Estructura de Componentes React
```javascript
// Ejemplo de componente
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MiComponente = ({ prop1, prop2 }) => {
  const [estado, setEstado] = useState(null);
  
  useEffect(() => {
    // Lógica de efecto
  }, []);
  
  return (
    <div className="card">
      {/* JSX del componente */}
    </div>
  );
};

export default MiComponente;
```

### Validación de Datos
```javascript
// Usando Joi en el backend
const schema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().min(1).max(255).required(),
  // ... más validaciones
});

const { error, value } = schema.validate(data);
```

## 🔒 Seguridad

### Medidas Implementadas
- **Helmet**: Headers de seguridad HTTP
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Validación de Datos**: Joi para validación robusta
- **CORS Configurado**: Orígenes permitidos específicos
- **Sanitización**: Prevención de inyección SQL

### Recomendaciones Adicionales
- Usar HTTPS en producción
- Configurar firewall apropiado
- Mantener dependencias actualizadas
- Implementar backups regulares
- Monitorear logs de seguridad

## 🐛 Solución de Problemas

### Problemas Comunes

#### Error de Conexión a Base de Datos
```bash
# Verificar configuración
cat server/.env

# Probar conexión
node -e "require('./server/config/database').connect().then(() => console.log('OK'))"
```

#### Puerto en Uso
```bash
# Encontrar proceso usando puerto 5000
lsof -i :5000

# Cambiar puerto en .env
echo "PORT=5001" >> server/.env
```

#### Dependencias Faltantes
```bash
# Reinstalar todas las dependencias
rm -rf node_modules client/node_modules server/node_modules
npm run install-all
```

### Logs y Debugging
```bash
# Ver logs del servidor
tail -f server/logs/app.log

# Modo debug
DEBUG=* npm run dev
```

## 📈 Roadmap

### Próximas Funcionalidades
- [ ] 🐳 Soporte Docker completo
- [ ] 📊 Exportación de datos (CSV, PDF)
- [ ] 🔔 Notificaciones y alertas
- [ ] 👥 Sistema de usuarios múltiples
- [ ] 📱 App móvil (React Native)
- [ ] 🤖 Categorización automática con IA
- [ ] 💳 Integración con bancos
- [ ] 📅 Presupuestos y metas

### Mejoras Técnicas
- [ ] Tests automatizados (Jest, Cypress)
- [ ] CI/CD con GitHub Actions
- [ ] Monitoreo con Prometheus
- [ ] Cache con Redis
- [ ] WebSockets para actualizaciones en tiempo real

## 🤝 Contribuir

### Cómo Contribuir
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código
- Usar ESLint y Prettier
- Documentar funciones complejas
- Escribir tests para nuevas funcionalidades
- Seguir convenciones de nomenclatura

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🙋‍♂️ Soporte

### Documentación Adicional
- [Guía de API](docs/api.md)
- [Guía de Desarrollo](docs/development.md)
- [FAQ](docs/faq.md)

### Contacto
- 📧 Email: soporte@expense-tracker.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/expense-tracker/issues)
- 💬 Discusiones: [GitHub Discussions](https://github.com/tu-usuario/expense-tracker/discussions)

---

**¡Gracias por usar el Sistema de Control de Gastos del Hogar!** 🏠💰

*Desarrollado con ❤️ para ayudarte a tener un mejor control de tus finanzas personales.*
