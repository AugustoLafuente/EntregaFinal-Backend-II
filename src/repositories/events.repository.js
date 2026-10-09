/**
 * Repository: intermediario entre el service y el DAO, aísla al resto
 * de la app de los detalles de persistencia (Mongoose).
 */
import eventsDao, { EVENT_STATUSES } from '../dao/events.dao.js';

export { EVENT_STATUSES };

export const createEvent = async (eventData) => {
    return eventsDao.create(eventData);
};

export const findEvents = async (filter, pagination) => {
    return eventsDao.findPaginated(filter, pagination);
};

export const countEvents = async (filter) => {
    return eventsDao.count(filter);
};

export const getEventById = async (id) => {
    return eventsDao.findById(id);
};

export const updateEvent = async (id, updates) => {
    return eventsDao.updateById(id, updates);
};

export default {
    createEvent,
    findEvents,
    countEvents,
    getEventById,
    updateEvent
};
