# Pasos para crear la base de datos rentas_app

Este documento explica cómo crear la base de datos `rentas_app` con las tablas `users`, `properties` e `interests` (aplicaciones/intereses).

## Requisitos previos

- PostgreSQL instalado y corriendo
- Acceso a un usuario con privilegios de superusuario (generalmente `postgres`)

## Pasos para crear la base de datos

### Opción 1: Usando el script SQL (Recomendado)

1. **Abre una terminal** y conéctate a PostgreSQL:
   ```bash
   psql -U postgres
   ```
   (O usa tu usuario admin si es diferente)

2. **Ejecuta el script SQL**:
   ```bash
   psql -U postgres -f create_database.sql
   ```
   
   O si ya estás dentro de psql:
   ```sql
   \i create_database.sql
   ```

### Opción 2: Pasos manuales

1. **Conéctate a PostgreSQL**:
   ```bash
   psql -U postgres
   ```

2. **Crea la base de datos**:
   ```sql
   CREATE DATABASE rentas_app;
   ```

3. **Conéctate a la nueva base de datos**:
   ```sql
   \c rentas_app
   ```

4. **Ejecuta los comandos SQL del archivo `create_database.sql`** línea por línea, o copia y pega todo el contenido del script.

### Opción 3: Desde la línea de comandos directamente

```bash
# Crear la base de datos
createdb -U postgres rentas_app

# Ejecutar el script SQL
psql -U postgres -d rentas_app -f create_database.sql
```

## Estructura de las tablas creadas

### 1. Tabla `users` (Usuarios)
- `id`: Identificador único (serial/auto-incremental)
- `name`: Nombre del usuario
- `email`: Email único del usuario
- `password`: Contraseña hasheada
- `role`: Rol del usuario (arrendador/arrendatario)
- `created_at`: Fecha de creación

### 2. Tabla `properties` (Propiedades)
- `id`: Identificador único
- `owner_id`: Referencia al usuario propietario (FK a users)
- `title`: Título de la propiedad
- `price`: Precio de renta
- `photos`: Array JSON de URLs de fotos
- `rating`: Calificación
- `phone`: Teléfono de contacto
- `address`: Dirección
- `featured`: Si está destacada (boolean)
- `bed`: Número de habitaciones
- `bathtub`: Número de baños
- `square`: Metros cuadrados
- `description`: Descripción de la propiedad
- `priority`: Prioridad para ordenamiento
- `fecha_ultimo_bump`: Fecha del último bump
- `status`: Estado (active, inactive, etc.)
- `created_at`: Fecha de creación

### 3. Tabla `interests` (Aplicaciones/Intereses)
**Nota:** Esta es la tabla que almacena las aplicaciones. Puede ser la que mencionaste como "upload".
- `id`: Identificador único
- `property_id`: Referencia a la propiedad (FK a properties)
- `tenant_id`: Referencia al inquilino (FK a users)
- `message`: Mensaje del inquilino
- `ai_score`: Puntuación de IA (opcional)
- `ai_analysis`: Análisis de IA o nombre del archivo subido
- `status`: Estado (pending, accepted, rejected)
- `created_at`: Fecha de creación
- **Constraint único:** Un inquilino solo puede aplicar una vez por propiedad

## Ver las tablas en PostgreSQL

### Comandos básicos (dentro de psql)

```sql
-- Ver todas las tablas
\dt

-- Ver todas las tablas con más detalles (tamaño, descripción)
\dt+

-- Ver estructura completa de una tabla específica
\d users
\d properties
\d interests

-- Ver estructura completa con más detalles
\d+ users
\d+ properties
\d+ interests

-- Ver solo las columnas de una tabla
\d users
```

### Comandos SQL (funcionan en cualquier cliente SQL)

```sql
-- Ver todas las tablas del esquema public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Ver estructura de columnas de una tabla
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Ver todas las tablas con el número de columnas
SELECT 
    t.table_name,
    COUNT(c.column_name) as num_columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;

-- Ver claves foráneas (relaciones entre tablas)
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- Ver índices de una tabla
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- Verificar datos (contar registros en cada tabla)
SELECT 
    'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 
    'properties' as tabla, COUNT(*) as registros FROM properties
UNION ALL
SELECT 
    'interests' as tabla, COUNT(*) as registros FROM interests;
```

### Ejemplo de uso rápido

Si estás dentro de psql y quieres ver todo rápidamente:

```sql
-- 1. Listar todas las tablas
\dt

-- 2. Ver estructura de cada tabla
\d users
\d properties
\d interests

-- 3. Ver cuántos registros hay en cada tabla
SELECT COUNT(*) as usuarios FROM users;
SELECT COUNT(*) as propiedades FROM properties;
SELECT COUNT(*) as aplicaciones FROM interests;
```

## Configurar variables de entorno

Asegúrate de que tu archivo `.env` tenga la configuración correcta:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=rentas_app
```

## Notas importantes

1. **Tabla `interests` vs `upload`**: La tabla que almacena las aplicaciones se llama `interests` en el código. El campo `ai_analysis` puede almacenar el nombre del archivo subido.

2. **Relaciones**: Las claves foráneas están configuradas con `ON DELETE CASCADE`, lo que significa que si eliminas un usuario o propiedad, se eliminarán automáticamente los registros relacionados.

3. **Índices**: Se han creado índices en las columnas más consultadas para mejorar el rendimiento.

4. **Roles de usuario**: Los roles en la tabla `users` pueden ser `arrendador` o `arrendatario` según tu lógica de negocio.

## Solución de problemas

### Error: "database already exists"
```sql
DROP DATABASE rentas_app;
```
Luego vuelve a ejecutar el script de creación.

### Error: "permission denied"
Asegúrate de estar usando un usuario con privilegios de superusuario:
```bash
psql -U postgres
```

### Error: "role does not exist"
Crea el usuario si no existe:
```sql
CREATE USER postgres WITH PASSWORD 'tu_contraseña';
ALTER USER postgres CREATEDB;
```

