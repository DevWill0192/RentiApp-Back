import express from 'express';
import cors from 'cors';

import authRoutes from './modules/auth/auth.routes.js';
import propertyRoutes from './modules/properties/property.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// RUTAS
app.use('/auth', authRoutes);
app.use('/properties', propertyRoutes);
app.use('/uploads', express.static('uploads'));

export default app;
