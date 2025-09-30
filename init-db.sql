-- Script de inicialización para PostgreSQL
-- Se ejecuta automáticamente cuando se crea el contenedor de base de datos

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar timezone
SET timezone = 'UTC';

-- Crear usuario adicional para backups (opcional)
-- CREATE USER backup_user WITH PASSWORD 'backup_password_123';
-- GRANT CONNECT ON DATABASE expense_tracker TO backup_user;

-- Configuraciones de rendimiento
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Recargar configuración
SELECT pg_reload_conf();
