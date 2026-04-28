-- =====================================================
-- SCRIPT PARA CREAR LA BASE DE DATOS rentas_app
-- =====================================================
-- INSTRUCCIONES:
-- Este script debe ejecutarse DESPUÉS de conectarse a la base de datos rentas_app
-- Ejemplo: psql -U postgres -d rentas_app -f create_database.sql
-- O dentro de psql: \c rentas_app y luego \i create_database.sql

-- Eliminar tablas e índices si ya existen (útil para recrear desde cero)
DROP TABLE IF EXISTS interests CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABLA: users (Usuarios)
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por email (ya es único, pero ayuda en performance)
CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- TABLA: properties (Propiedades)
-- =====================================================
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    photos JSONB, -- Almacena array de fotos como JSON
    rating DECIMAL(3, 2) DEFAULT 0,
    phone VARCHAR(50),
    address VARCHAR(500),
    featured BOOLEAN DEFAULT FALSE,
    bed INTEGER DEFAULT 0,
    bathtub INTEGER DEFAULT 0,
    square DECIMAL(10, 2),
    description TEXT,
    priority INTEGER DEFAULT 0,
    fecha_ultimo_bump TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_priority ON properties(priority DESC);
CREATE INDEX idx_properties_fecha_bump ON properties(fecha_ultimo_bump DESC);

-- =====================================================
-- TABLA: interests (Aplicaciones/Intereses)
-- Nota: Esta tabla almacena las aplicaciones de los inquilinos
-- a las propiedades. Puede ser la que mencionaste como "upload"
-- =====================================================
CREATE TABLE interests (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    ai_score INTEGER,
    ai_analysis TEXT, -- Almacena el nombre del archivo subido o análisis de IA
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_property_tenant UNIQUE (property_id, tenant_id)
);

-- Índices para mejorar performance
CREATE INDEX idx_interests_property_id ON interests(property_id);
CREATE INDEX idx_interests_tenant_id ON interests(tenant_id);
CREATE INDEX idx_interests_status ON interests(status);
CREATE INDEX idx_interests_created_at ON interests(created_at DESC);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verificar que las tablas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'properties', 'interests')
ORDER BY table_name;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. La tabla 'interests' es la que almacena las aplicaciones
--    de los inquilinos. El campo 'ai_analysis' puede almacenar
--    el nombre del archivo subido.
-- 
-- 2. La tabla 'properties' usa JSONB para el campo 'photos'
--    que almacena un array de URLs de imágenes.
--
-- 3. Las relaciones de claves foráneas están configuradas
--    con CASCADE para eliminar registros relacionados
--    cuando se elimina un usuario o propiedad.
--
-- 4. Los roles en la tabla users pueden ser: 
--    'arrendador' o 'arrendatario' (según tu lógica de negocio)
