/**
 * DAO: acceso directo al modelo de Mongoose para la colección de eventos.
 */
import Event, { EVENT_STATUSES } from '../models/Event.js';

export { EVENT_STATUSES };

export const create = async (eventData) => {
    return Event.create(eventData);
};

export const findPaginated = async (filter, { page, limit, sort }) => {
    const skip = (page - 1) * limit;
    return Event.find(filter).sort(sort).skip(skip).limit(limit);
};

export const count = async (filter) => {
    return Event.countDocuments(filter);
};

export const findById = async (id) => {
    return Event.findById(id);
};

export const updateById = async (id, updates) => {
    return Event.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
};

export default {
    create,
    findPaginated,
    count,
    findById,
    updateById
};
