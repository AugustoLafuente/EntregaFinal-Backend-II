/**
 * DTO de Event: define qué campos del documento de Mongoose se exponen en
 * las respuestas de la API.
 */
export const toEventDTO = (event) => {
    if (!event) return null;

    return {
        id: event._id,
        title: event.title,
        description: event.description,
        sport_type: event.sport_type,
        category: event.category,
        date: event.date,
        location: event.location,
        capacity: event.capacity,
        price: event.price,
        status: event.status,
        organizer: event.organizer
    };
};

// Versión reducida para usar como documento relacionado (populate) en otros
// DTOs (ej. el ticket visto por el usuario, con el evento parcialmente poblado).
export const toEventSummaryDTO = (event) => {
    if (!event) return null;

    return {
        id: event._id,
        title: event.title,
        date: event.date,
        location: event.location
    };
};

export default {
    toEventDTO,
    toEventSummaryDTO
};
