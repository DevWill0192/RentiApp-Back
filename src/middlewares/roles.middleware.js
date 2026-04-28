// src/middlewares/role.middleware.js
import { normalizeRoleForClient } from '../utils/roles.js';

export const onlyArrendador = (req, res, next) => {
  const role = normalizeRoleForClient(req.user.role) || req.user.role;

  if (role !== 'ARRENDADOR') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};