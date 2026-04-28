-- =====================================================
-- PASO 1: CREAR LA BASE DE DATOS rentas_app
-- =====================================================
-- Ejecuta este script PRIMERO (desde la base de datos postgres o template1)
-- psql -U postgres -f 01_create_db.sql

-- Eliminar la base de datos si ya existe (CUIDADO: Esto borra todos los datos)
-- DROP DATABASE IF EXISTS rentas_app;

-- Crear la base de datos
CREATE DATABASE rentas_app;

