const DB_ROLE_BY_ALIAS = {
  ARRENDADOR: 'arrendador',
  arrendador: 'arrendador',
  ARRENDATARIO: 'arrendatario',
  arrendatario: 'arrendatario',
  INQUILINO: 'arrendatario',
  inquilino: 'arrendatario',
};

const CLIENT_ROLE_BY_DB_ROLE = {
  arrendador: 'ARRENDADOR',
  arrendatario: 'ARRENDATARIO',
  ARRENDADOR: 'ARRENDADOR',
  ARRENDATARIO: 'ARRENDATARIO',
};

export const normalizeRoleForDatabase = (role) => {
  if (!role || typeof role !== 'string') return null;
  return DB_ROLE_BY_ALIAS[role] || null;
};

export const normalizeRoleForClient = (role) => {
  if (!role || typeof role !== 'string') return null;
  return CLIENT_ROLE_BY_DB_ROLE[role] || null;
};
