// src/modules/properties/property.controller.js
import { pool } from '../../config/db.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const createProperty = async (req, res) => {
  try {
    // Multer pone los textos en req.body y los archivos en req.files
    const {
      title,
      price,
      phone,
      address,
      featured,
      bed,
      bathtub,
      square,
      description,
      rating
    } = req.body;

    // Extraemos las rutas de los archivos guardados
    const photosPaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const result = await pool.query(
      `INSERT INTO properties 
      (owner_id, title, price, photos, rating, phone, address, featured, bed, bathtub, square, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.user.id,                    // ID extraído del token por el middleware
        title,
        Number(price),                  // Convertir string a número
        JSON.stringify(photosPaths),    // Guardar array como JSON o TEXT
        Number(rating || 4.0),
        phone,
        address,
        featured === 'true',            // FormData envía booleanos como strings
        Number(bed),
        Number(bathtub),
        Number(square),
        description
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al insertar:", error);
    res.status(500).json({ 
        message: "Error al crear la propiedad",
        error: error.message 
    });
  }
};


export const deleteProperty = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `DELETE FROM properties
     WHERE id = $1 AND owner_id = $2
     RETURNING *`,
    [id, req.user.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Propiedad no encontrada' });
  }

  res.json({ message: 'Propiedad eliminada', property: result.rows[0] });
};


export const destacarAnuncio = async (req, res) => {
  const { id } = req.params;

  await pool.query(
    `UPDATE properties
     SET priority = priority + 1
     WHERE id = $1 AND owner_id = $2`,
    [id, req.user.id]
  );

  res.json({ message: 'Anuncio destacado' });
};

export const bumpAnuncio = async (req, res) => {
  const { id } = req.params;

  await pool.query(
    `UPDATE properties
     SET fecha_ultimo_bump = NOW()
     WHERE id = $1 AND owner_id = $2`,
    [id, req.user.id]
  );

  res.json({ message: 'Bump aplicado' });
};

export const getProperties = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*, 
        u.name as owner_name 
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE (p.status = 'active' OR p.status IS NULL)
      ORDER BY 
        COALESCE(p.priority, 0) DESC, 
        COALESCE(p.fecha_ultimo_bump, p.created_at) DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener las propiedades:", error);
    
    // Intentar consulta más simple si la primera falla
    try {
      console.log("Intentando consulta simplificada...");
      const simpleQuery = `
        SELECT p.*, u.name as owner_name 
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
      `;
      const simpleResult = await pool.query(simpleQuery);
      return res.json(simpleResult.rows);
    } catch (simpleError) {
      console.error("Error en consulta simple también:", simpleError);
      res.status(500).json({ 
        error: "Error al obtener las propiedades",
        detail: error.message,
        originalError: error.message,
        simpleErrorDetail: simpleError.message
      });
    }
  }
};
export const getPropertyById = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID de propiedad inválido" });
  }

  try {
    const query = `
      SELECT 
        p.*,
        u.name AS owner_name
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1
        AND (p.status = 'active' OR p.status IS NULL)
      LIMIT 1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error al obtener la propiedad:", error);

    // Fallback: consulta simple
    try {
      console.log("Intentando consulta simplificada...");
      const simpleQuery = `
        SELECT p.*, u.name AS owner_name
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
        WHERE p.id = $1
        LIMIT 1
      `;

      const simpleResult = await pool.query(simpleQuery, [id]);

      if (simpleResult.rows.length === 0) {
        return res.status(404).json({ error: "Propiedad no encontrada" });
      }

      return res.json(simpleResult.rows[0]);

    } catch (simpleError) {
      console.error("Error en consulta simple también:", simpleError);
      res.status(500).json({
        error: "Error al obtener la propiedad",
        detail: error.message,
        simpleErrorDetail: simpleError.message
      });
    }
  }
};


/*export const applyProperties = async (req, res) => {
  const propertyId = req.params.id;
  const tenantId = req.user.id;
  const { message } = req.body;
  const file = req.file;

  // Valores por defecto si la IA falla
  let aiScore = null; 
  let aiAnalysis = "Pendiente de revisión manual (IA no disponible)";

  try {
    // INTENTO DE VALIDACIÓN CON IA
    if (file) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent([
          "Analiza solvencia. Responde solo JSON: { \"score\": 0-100, \"analysis\": \"...\" }",
          { inlineData: { data: file.buffer.toString("base64"), mimeType: file.mimetype } }
        ]);
        
        const response = JSON.parse(result.response.text().replace(/```json|```/g, ""));
        aiScore = response.score;
        aiAnalysis = response.analysis;
      } catch (aiError) {
        console.error("La IA falló, pero continuaremos manual:", aiError.message);
        // No lanzamos error aquí, dejamos que siga el flujo manual
      }
    }

    // GUARDAR EN BASE DE DATOS (Independientemente de si la IA funcionó o no)
    const query = `
      INSERT INTO interests (property_id, tenant_id, message, ai_score, ai_analysis)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (property_id, tenant_id) 
      DO UPDATE SET message = $3, ai_score = EXCLUDED.ai_score, ai_analysis = EXCLUDED.ai_analysis
      RETURNING *;
    `;

    const result = await pool.query(query, [propertyId, tenantId, message, aiScore, aiAnalysis]);

    res.status(200).json({
      message: aiScore ? "Aplicación analizada por IA" : "Aplicación recibida para revisión manual",
      data: result.rows[0]
    });

  } catch (dbError) {
    res.status(500).json({ error: "Error crítico en la base de datos" });
  }
};*/
export const applyProperties = async (req, res) => {
  const propertyId = req.params.id;
  const tenantId = req.user.id;
  const { message } = req.body;
  const fileName = req.file ? req.file.filename : null;

  try {
    // 1. Insertar o Actualizar la aplicación
    await pool.query(`
      INSERT INTO interests (property_id, tenant_id, message, ai_analysis)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ON CONSTRAINT unique_property_tenant 
      DO UPDATE SET 
        message = EXCLUDED.message, 
        ai_analysis = EXCLUDED.ai_analysis,
        created_at = CURRENT_TIMESTAMP
    `, [propertyId, tenantId, message, fileName]);

    // 2. Traer la información completa con Nombres
    const detailsQuery = `
      SELECT 
        i.*, 
        u.name AS tenant_name, 
        p.title AS property_title,
        CONCAT('http://localhost:3000/uploads/', i.ai_analysis) AS document_url
      FROM interests i
      JOIN users u ON i.tenant_id = u.id
      JOIN properties p ON i.property_id = p.id
      WHERE i.property_id = $1 AND i.tenant_id = $2
    `;

    const result = await pool.query(detailsQuery, [propertyId, tenantId]);

    // 3. Responder con el objeto completo
    res.status(201).json({ 
      success: true, 
      message: "Aplicación registrada con éxito",
      data: result.rows[0] 
    });

  } catch (error) {
    console.error("Error al aplicar:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  const { applicationId } = req.params;
  const { status, owner_feedback } = req.body; // status: 'ACEPTADO', 'RECHAZADO'

  try {
    const result = await pool.query(
      `UPDATE interests 
       SET status = $1, ai_analysis = ai_analysis || $2
       WHERE id = $3 RETURNING *`,
      [status, ` | Nota del dueño: ${owner_feedback}`, applicationId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar estado" });
  }
};

export const getApplicants = async (req, res) => {
  const landlordId = req.user.id;

  try {
    const query = `
      SELECT 
        i.id AS interest_id,
        i.message,
        i.status,
        i.ai_score,
        i.ai_analysis,
        u.name AS applicant_name, -- Cambiado de full_name a name
        u.email AS applicant_email,
        p.title AS property_title
      FROM interests i
      JOIN properties p ON i.property_id = p.id
      JOIN users u ON i.tenant_id = u.id
      WHERE p.owner_id = $1
      ORDER BY i.created_at DESC
    `;

    const result = await pool.query(query, [landlordId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error SQL detallado:", error);
    res.status(500).json({ 
        error: "Error al obtener aplicantes", 
        detail: error.message 
    });
  }
};

export const getMyApplications = async (req, res) => {
  const tenantId = req.user.id; // Tu ID del token

  try {
    const query = `
      SELECT 
        i.id AS application_id,
        i.status,
        i.message,
        p.title,
        p.price,
        p.address
      FROM interests i
      JOIN properties p ON i.property_id = p.id
      WHERE i.tenant_id = $1
    `;

    const result = await pool.query(query, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tus aplicaciones" });
  }
};

export const approveApplicant = async (req, res) => {
  const { interestId } = req.params; // El ID de la solicitud de interés
  const ownerId = req.user.id;      // ID del arrendador desde el token

  try {
    // Actualizamos si el interés existe Y la propiedad pertenece al usuario
    const query = `
      UPDATE interests i
      SET status = 'accepted'
      FROM properties p
      WHERE i.property_id = p.id 
        AND i.id = $1 
        AND p.owner_id = $2
      RETURNING i.*;
    `;

    const result = await pool.query(query, [interestId, ownerId]);

    if (result.rowCount === 0) {
      return res.status(403).json({
        message: "No tienes permiso para aprobar esta solicitud o no existe."
      });
    }

    res.json({ message: "Aplicante aceptado con éxito", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectApplicant = async (req, res) => {
  const { interestId } = req.params;
  const ownerId = req.user.id;

  try {
    const query = `
      UPDATE interests i
      SET status = 'rejected'
      FROM properties p
      WHERE i.property_id = p.id 
        AND i.id = $1 
        AND p.owner_id = $2
      RETURNING i.*;
    `;

    const result = await pool.query(query, [interestId, ownerId]);

    if (result.rowCount === 0) {
      return res.status(403).json({ message: "No autorizado o solicitud inexistente." });
    }

    res.json({
      message: "Solicitud rechazada",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const validateTenantDocument = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const file = req.file; // Recibido vía Multer

    if (!file) {
      return res.status(400).json({ error: "Por favor, sube un documento (PDF o Imagen)." });
    }

    // 1. Inicializar el modelo Gemini 1.5 Flash (es el más rápido y económico)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Convertir el archivo a formato compatible con la IA
    const docPart = {
      inlineData: {
        data: file.buffer.toString("base64"),
        mimeType: file.mimetype,
      },
    };

    // 3. El Prompt "Cerebro": Aquí defines las reglas de negocio
    const prompt = `
      Eres un asistente de riesgos inmobiliarios. Analiza este documento.
      Tu tarea es:
      1. Identificar si es un documento de identidad, extracto bancario o recibo de sueldo.
      2. Validar que los datos sean legibles y no parezcan alterados.
      3. Si es un extracto de sueldo, verifica que los ingresos sean consistentes.
      
      Responde EXCLUSIVAMENTE en formato JSON con esta estructura:
      {
        "porcentaje_aptitud": (número de 0 a 100),
        "resumen": "breve descripción de lo hallado",
        "es_apto": (booleano),
        "datos_extraidos": { "nombre": "...", "ingresos_estimados": "..." }
      }
    `;

    // 4. Llamada a la IA
    const result = await model.generateContent([prompt, docPart]);
    const responseText = result.response.text();

    // Limpiar la respuesta (Gemini a veces envuelve el JSON en ```json ... ```)
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const aiAnalysis = JSON.parse(cleanJson);

    // 5. Opcional: Guardar el análisis en tu tabla 'interests' para que el Arrendador lo vea
    await pool.query(
      `UPDATE interests 
       SET ai_score = $1, ai_analysis = $2 
       WHERE tenant_id = $3 AND property_id = $4`,
      [aiAnalysis.porcentaje_aptitud, aiAnalysis.resumen, req.user.id, propertyId]
    );

    res.json({
      success: true,
      analysis: aiAnalysis
    });

  } catch (error) {
    console.error("Error con Gemini IA:", error);
    res.status(500).json({ error: "La IA no pudo procesar el documento." });
  }
};