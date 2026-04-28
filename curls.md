# Comandos cURL para todas las rutas de la API

**Base URL:** `http://localhost:3000`

## 📋 Índice
1. [Autenticación](#autenticación)
2. [Propiedades - Públicas](#propiedades---públicas)
3. [Propiedades - Arrendadores](#propiedades---arrendadores)
4. [Propiedades - Arrendatarios](#propiedades---arrendatarios)

---

## 🔐 Autenticación

### 1. Registrar Usuario (Arrendador)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Arrendador",
    "email": "juan@mail.com",
    "password": "123456",
    "role": "ARRENDADOR"
  }'
```

### 2. Registrar Usuario (Arrendatario)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pedro Buscador",
    "email": "pedro@mail.com",
    "password": "123456",
    "role": "ARRENDATARIO"
  }'
```

### 3. Iniciar Sesión
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@mail.com",
    "password": "123456"
  }'
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Nota:** Guarda el token recibido para usarlo en las siguientes peticiones que requieren autenticación.

---

## 🏠 Propiedades - Públicas

### 4. Listar todas las propiedades (PÚBLICO - No requiere autenticación)
```bash
curl -X GET http://localhost:3000/properties
```

---

## 👤 Propiedades - Arrendadores

**Nota:** Todas estas rutas requieren:
- Header `Authorization: Bearer TU_TOKEN_AQUI`
- Usuario con rol `ARRENDADOR`

### 5. Crear Propiedad
```bash
curl -X POST http://localhost:3000/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "title": "Apartamento en Medellín",
    "price": 1200000,
    "photos": [
      "https://img1.jpg",
      "https://img2.jpg"
    ],
    "rating": 4.5,
    "phone": "3001234567",
    "address": "Calle 123 #45-67, Medellín",
    "featured": true,
    "bed": 2,
    "bathtub": 2,
    "square": 80.5,
    "description": "Hermoso apartamento en zona residencial..."
  }'
```

### 6. Obtener Propiedad por ID
```bash
curl -X GET http://localhost:3000/properties/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 7. Eliminar Propiedad
```bash
curl -X DELETE http://localhost:3000/properties/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 8. Destacar Anuncio (Aumentar prioridad)
```bash
curl -X PATCH http://localhost:3000/properties/1/destacar \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 9. Bump Anuncio (Actualizar fecha de bump)
```bash
curl -X PATCH http://localhost:3000/properties/1/bump \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 10. Ver Aplicantes (Bandeja de entrada del dueño)
```bash
curl -X GET http://localhost:3000/properties/applicants \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 11. Aprobar Aplicante
```bash
curl -X PATCH http://localhost:3000/properties/accept/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 12. Rechazar Aplicante
```bash
curl -X PATCH http://localhost:3000/properties/reject/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 13. Decidir sobre Aplicación (Con feedback)
```bash
curl -X PATCH http://localhost:3000/properties/decide-application/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "status": "ACEPTADO",
    "owner_feedback": "Bienvenido, nos pondremos en contacto pronto"
  }'
```

---

## 🏡 Propiedades - Arrendatarios

**Nota:** Todas estas rutas requieren:
- Header `Authorization: Bearer TU_TOKEN_AQUI`
- Usuario autenticado (cualquier rol)

### 14. Aplicar a una Propiedad (Con documento opcional)
```bash
# Sin documento (solo mensaje)
curl -X PUT http://localhost:3000/properties/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Estoy interesado en rentar esta propiedad"
  }'
```

```bash
# Con documento PDF/imagen
curl -X PUT http://localhost:3000/properties/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -F "documento=@/ruta/al/archivo.pdf" \
  -F "message=Estoy interesado en rentar esta propiedad"
```

### 15. Ver Mis Aplicaciones
```bash
curl -X GET http://localhost:3000/properties/my-applications \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 16. Validar Documento con IA
```bash
curl -X POST http://localhost:3000/properties/validate-document \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -F "file=@/ruta/al/documento.pdf" \
  -F "propertyId=1"
```

**Nota:** Este endpoint analiza el documento con IA (Gemini) y actualiza el score y análisis en la base de datos.

---

## 📝 Ejemplos de uso completo

### Flujo completo: Arrendador crea propiedad y recibe aplicaciones

```bash
# 1. Registrar arrendador
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Arrendador",
    "email": "juan@mail.com",
    "password": "123456",
    "role": "ARRENDADOR"
  }'

# 2. Login y obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@mail.com",
    "password": "123456"
  }' | jq -r '.token')

# 3. Crear propiedad
curl -X POST http://localhost:3000/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Apartamento en Medellín",
    "price": 1200000,
    "photos": ["https://img1.jpg"],
    "rating": 4.5,
    "phone": "3001234567",
    "address": "Calle 123 #45-67",
    "featured": true,
    "bed": 2,
    "bathtub": 2,
    "square": 80.5,
    "description": "Hermoso apartamento"
  }'

# 4. Ver aplicantes
curl -X GET http://localhost:3000/properties/applicants \
  -H "Authorization: Bearer $TOKEN"
```

### Flujo completo: Arrendatario aplica a propiedad

```bash
# 1. Registrar arrendatario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pedro Buscador",
    "email": "pedro@mail.com",
    "password": "123456",
    "role": "ARRENDATARIO"
  }'

# 2. Login y obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pedro@mail.com",
    "password": "123456"
  }' | jq -r '.token')

# 3. Ver propiedades disponibles (público, no requiere token)
curl -X GET http://localhost:3000/properties

curl -X GET http://localhost:3000/properties/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 4. Aplicar a propiedad con documento
curl -X PUT http://localhost:3000/properties/1 \
  -H "Authorization: Bearer $TOKEN" \
  -F "documento=@documento.pdf" \
  -F "message=Estoy muy interesado en esta propiedad"

# 5. Ver mis aplicaciones
curl -X GET http://localhost:3000/properties/my-applications \
  -H "Authorization: Bearer $TOKEN"
```

---


## 🔧 Notas Importantes

1. **Token de Autenticación**: Después de hacer login, copia el token de la respuesta y reemplaza `TU_TOKEN_AQUI` en los headers de las peticiones protegidas.

2. **Variables de Entorno**: Si cambias el puerto en `.env`, actualiza la base URL en los curls.

3. **Archivos**: Para enviar archivos (PDF, imágenes), usa `-F` en lugar de `-d` y especifica la ruta al archivo con `@ruta/al/archivo.pdf`.

4. **Roles**: 
   - `ARRENDADOR`: Puede crear propiedades, ver aplicantes, aprobar/rechazar
   - `ARRENDATARIO`: Puede aplicar a propiedades, ver sus aplicaciones

5. **IDs**: Reemplaza los números de ejemplo (1, etc.) con los IDs reales de tu base de datos.

6. **Formato JSON**: Asegúrate de que el JSON esté bien formateado, especialmente los arrays y objetos anidados.

---

## 🚀 Scripts de prueba rápida

### Guardar token en variable (Bash/Zsh)
```bash
# Login y guardar token
export TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@mail.com","password":"123456"}' \
  | jq -r '.token')

# Usar el token
curl -X GET http://localhost:3000/properties/applicants \
  -H "Authorization: Bearer $TOKEN"
```

### Ejecutar múltiples curls
```bash
# Guardar token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@mail.com","password":"123456"}' \
  | jq -r '.token')

# Crear propiedad
curl -X POST http://localhost:3000/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test","price":1000000,"photos":[],"bed":1,"bathtub":1}'

# Ver aplicantes
curl -X GET http://localhost:3000/properties/applicants \
  -H "Authorization: Bearer $TOKEN"
```
