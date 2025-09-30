# Dockerfile para el Sistema de Control de Gastos del Hogar
# Imagen multi-stage para optimizar el tamaño final

# Etapa 1: Construcción del frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copiar archivos de dependencias del cliente
COPY client/package*.json ./

# Instalar dependencias (incluye devDependencies para poder compilar)
RUN npm ci

# Copiar código fuente del cliente
COPY client/ ./

# Construir aplicación para producción
RUN npm run build

# Etapa 2: Configuración del backend y aplicación final
FROM node:18-alpine AS production

# Instalar dependencias del sistema para SQLite
RUN apk add --no-cache sqlite

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias del servidor
COPY server/package*.json ./server/

# Instalar dependencias del servidor
WORKDIR /app/server
RUN npm ci --only=production

# Copiar código fuente del servidor
COPY server/ ./

# Copiar archivos del proyecto raíz
WORKDIR /app
COPY package*.json ./

# Copiar frontend construido desde la etapa anterior
COPY --from=frontend-builder /app/client/build ./client/build

# Crear directorios necesarios
RUN mkdir -p /app/server/logs
RUN mkdir -p /app/data

# Cambiar propietario de archivos al usuario no-root
RUN chown -R nodeuser:nodejs /app

# Cambiar a usuario no-root
USER nodeuser

# Exponer puerto
EXPOSE 5000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_TYPE=sqlite
ENV SQLITE_DB_PATH=/app/data/database.sqlite

# Comando de inicio
CMD ["node", "server/index.js"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"
