import { Router } from 'express';
import {
  createProperty,
  getProperties,
  destacarAnuncio,
  bumpAnuncio,
  applyProperties,
  getApplicants,
  getMyApplications,
  approveApplicant,
  rejectApplicant,
  validateTenantDocument,
  updateApplicationStatus,
  deleteProperty,
  getPropertyById
} from './property.controller.js';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { onlyArrendador } from '../../middlewares/roles.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
const router = Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
})
const uploadcreate = multer({ storage });

// --- RUTAS PÚBLICAS ---
router.get('/', getProperties); // Listar con prioridad y bump

// --- RUTAS EXCLUSIVAS PARA ARRENDADORES ---
// Gestión de Anuncios
router.post('/', authMiddleware, uploadcreate.array('photos', 10), createProperty);
router.delete('/:id', authMiddleware, deleteProperty);
router.get('/:id', authMiddleware, getPropertyById);


router.put('/:id', authMiddleware, upload.single('documento'), applyProperties);
router.patch('/decide-application/:applicationId', authMiddleware, onlyArrendador, updateApplicationStatus);
router.patch('/:id/destacar', authMiddleware, onlyArrendador, destacarAnuncio);
router.patch('/:id/bump', authMiddleware, onlyArrendador, bumpAnuncio);

// Gestión de Aplicantes (Bandeja de entrada del dueño)
router.get('/applicants', authMiddleware, onlyArrendador, getApplicants);
router.patch('/accept/:interestId', authMiddleware, onlyArrendador, approveApplicant);
router.patch('/reject/:interestId', authMiddleware, onlyArrendador, rejectApplicant);

// --- RUTAS EXCLUSIVAS PARA ARRENDATARIOS (INQUILINOS) ---
// Ver mis propias aplicaciones enviadas
router.get('/my-applications', authMiddleware, getMyApplications);

// Enviar documento y validar con IA
router.post(
  '/validate-document', 
  authMiddleware, 
  upload.single('file'), // El cliente debe enviar el archivo bajo el nombre 'file'
  validateTenantDocument
);

export default router;