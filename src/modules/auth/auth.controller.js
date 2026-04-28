// src/modules/auth/auth.controller.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/db.js';
import { JWT_SECRET } from '../../config/env.js';
import { normalizeRoleForClient, normalizeRoleForDatabase } from '../../utils/roles.js';

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const normalizedRole = normalizeRoleForDatabase(role);
    const clientRole = normalizeRoleForClient(role);

    if (!normalizedRole && !clientRole) {
      return res.status(400).json({ message: 'Rol inválido.' });
    }

    const rolesToTry = [...new Set([normalizedRole, clientRole, role].filter(Boolean))];
    let result = null;
    let lastError = null;

    for (const roleCandidate of rolesToTry) {
      try {
        result = await pool.query(
          `INSERT INTO users (name, email, password, role)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, role`,
          [name, email, hash, roleCandidate]
        );
        break;
      } catch (error) {
        if (error.code === '23514') {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    if (!result) {
      throw lastError || new Error('No se pudo registrar el usuario.');
    }

    return res.status(201).json({
      ...result.rows[0],
      role: normalizeRoleForClient(result.rows[0].role) || result.rows[0].role
    });

  } catch (error) {
    // Check if the error is a Unique Violation (Postgres error code 23505)
    if (error.code === '23505') {
      return res.status(400).json({ 
        message: "A user with this email already exists." 
      });
    }

    // Handle other unexpected errors
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (!user.rows.length) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const valid = await bcrypt.compare(password, user.rows[0].password);
  if (!valid) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  if (!JWT_SECRET) {
    console.error('JWT_SECRET no está configurado en las variables de entorno.');
    return res.status(500).json({ message: 'Error de configuración del servidor.' });
  }

  const token = jwt.sign(
    {
      id: user.rows[0].id,
      role: normalizeRoleForClient(user.rows[0].role) || user.rows[0].role,
      name: user.rows[0].name,
      email: user.rows[0].email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token });
};
