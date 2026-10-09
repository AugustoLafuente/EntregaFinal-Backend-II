/**
 * DTO de Ticket: define qué campos del documento de Mongoose se exponen en
 * las respuestas de la API. Cuando el ticket viene con `populate` de `user`
 * o `event`, el documento relacionado también se filtra con su propio DTO
 * (nunca se expone `password` del usuario).
 */
import { toEventSummaryDTO } from './event.dto.js';
import { toUserSummaryDTO } from './user.dto.js';

export const toTicketDTO = (ticket) => {
    if (!ticket) return null;

    return {
        id: ticket._id,
        user: ticket.user,
        event: ticket.event,
        status: ticket.status,
        quantity: ticket.quantity,
        reservationCode: ticket.reservationCode,
        createdAt: ticket.createdAt,
        cancelledAt: ticket.cancelledAt
    };
};

// Ticket con el evento poblado (parcialmente): usado en "mis tickets".
export const toTicketWithEventDTO = (ticket) => {
    if (!ticket) return null;

    return {
        id: ticket._id,
        status: ticket.status,
        quantity: ticket.quantity,
        reservationCode: ticket.reservationCode,
        createdAt: ticket.createdAt,
        cancelledAt: ticket.cancelledAt,
        event: ticket.event && toEventSummaryDTO(ticket.event)
    };
};

// Ticket con el usuario poblado (parcialmente): usado por el organizador
// para ver quién se inscribió a su evento. Nunca expone password.
export const toTicketWithUserDTO = (ticket) => {
    if (!ticket) return null;

    return {
        id: ticket._id,
        status: ticket.status,
        quantity: ticket.quantity,
        reservationCode: ticket.reservationCode,
        createdAt: ticket.createdAt,
        cancelledAt: ticket.cancelledAt,
        user: ticket.user && toUserSummaryDTO(ticket.user)
    };
};

export default {
    toTicketDTO,
    toTicketWithEventDTO,
    toTicketWithUserDTO
};
