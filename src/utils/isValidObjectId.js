/**
 * Valida el formato de un id de Mongo sin que los services necesiten
 * importar mongoose directamente (quedaría como una dependencia de
 * persistencia filtrándose a la capa de negocio).
 */
import mongoose from 'mongoose';

export const isValidObjectId = (id) => mongoose.isValidObjectId(id);

export default isValidObjectId;
