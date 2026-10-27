/**
 * Lógica de negocio para la creación, consulta y cancelación de tickets
 * (inscripciones a eventos con control de cupos).
 */
import ticketsRepository from '../repositories/tickets.repository.js';
import eventsRepository from '../repositories/events.repository.js';
import usersRepository from '../repositories/users.repository.js';
import mailer from '../utils/mailer.js';
import AppError from '../utils/AppError.js';
import isValidObjectId from '../utils/isValidObjectId.js';
import { toTicketDTO, toTicketWithEventDTO, toTicketWithUserDTO } from '../dtos/ticket.dto.js';

const getEventOrThrow = async (eventId) => {
    if (!isValidObjectId(eventId)) {
        throw new AppError('Evento no encontrado', 404);
    }

    const event = await eventsRepository.getEventById(eventId);
    if (!event) {
        throw new AppError('Evento no encontrado', 404);
    }

    return event;
};

export const createTicket = async (eventId, user, requestedQuantity) => {
    const event = await getEventOrThrow(eventId);

    if (event.status === 'cancelled') {
        throw new AppError('El evento está cancelado', 400);
    }
    if (event.status === 'finished') {
        throw new AppError('El evento ya finalizó', 400);
    }
    if (event.status !== 'published') {
        throw new AppError('El evento no está disponible para inscripciones', 400);
    }

    const quantity = requestedQuantity === undefined ? 1 : Number(requestedQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new AppError('quantity debe ser un número entero mayor a 0', 400);
    }

    const existingActive = await ticketsRepository.findActiveTicket(user.id, eventId);
    if (existingActive) {
        throw new AppError('Ya tenés una inscripción activa para este evento', 409);
    }

    const occupied = await ticketsRepository.getOccupiedQuantity(eventId);
    const available = event.capacity - occupied;
    if (available < quantity) {
        throw new AppError(`No hay cupos suficientes disponibles (quedan ${Math.max(available, 0)})`, 409);
    }

    const ticket = await ticketsRepository.createTicket({
        user: user.id,
        event: eventId,
        quantity,
        status: 'confirmed'
    });

    // El email es "best effort": si falla el envío, la inscripción ya está confirmada igual.
    try {
        await mailer.sendTicketConfirmationEmail(user.email, {
            eventTitle: event.title,
            eventDate: event.date,
            quantity: ticket.quantity,
            reservationCode: ticket.reservationCode
        });
    } catch (error) {
        console.error('[tickets.service] No se pudo enviar el email de confirmación:', error.message);
    }

    return toTicketDTO(ticket);
};

export const listMyTickets = async (userId) => {
    const tickets = await ticketsRepository.getTicketsByUser(userId);
    return tickets.map(toTicketWithEventDTO);
};

export const listEventTickets = async (eventId, user) => {
    const event = await getEventOrThrow(eventId);

    const isOwner = event.organizer.toString() === user.id;
    if (!isOwner && user.role !== 'admin') {
        throw new AppError('No tenés permisos para ver los tickets de este evento', 403);
    }

    const tickets = await ticketsRepository.getTicketsByEvent(eventId);
    return tickets.map(toTicketWithUserDTO);
};

export const cancelTicket = async (ticketId, user) => {
    if (!isValidObjectId(ticketId)) {
        throw new AppError('Ticket no encontrado', 404);
    }

    const ticket = await ticketsRepository.getTicketById(ticketId);
    if (!ticket) {
        throw new AppError('Ticket no encontrado', 404);
    }

    const isOwner = ticket.user.toString() === user.id;
    if (!isOwner && user.role !== 'admin') {
        throw new AppError('No tenés permisos para cancelar este ticket', 403);
    }

    if (ticket.status === 'cancelled') {
        throw new AppError('El ticket ya está cancelado', 400);
    }

    const updatedTicket = await ticketsRepository.updateTicket(ticketId, {
        status: 'cancelled',
        cancelledAt: new Date()
    });

    // Envío de email de cancelación "best effort"
    try {
        let recipientEmail = isOwner && user?.email ? user.email : null;
        if (!recipientEmail && ticket.user) {
            const userId = ticket.user?._id || ticket.user;
            const ticketUser = await usersRepository.getUserById(userId);
            recipientEmail = ticketUser?.email;
        }

        let eventTitle = 'Evento';
        let eventDate = null;
        const eventId = ticket.event?._id || ticket.event;
        if (eventId) {
            const event = await eventsRepository.getEventById(eventId);
            if (event) {
                eventTitle = event.title || eventTitle;
                eventDate = event.date || null;
            }
        }

        if (recipientEmail) {
            await mailer.sendTicketCancellationEmail(recipientEmail, {
                eventTitle,
                eventDate,
                quantity: updatedTicket.quantity,
                reservationCode: updatedTicket.reservationCode
            });
        }
    } catch (error) {
        console.error('[tickets.service] No se pudo enviar el email de cancelación:', error.message);
    }

    return toTicketDTO(updatedTicket);
};

export default {
    createTicket,
    listMyTickets,
    listEventTickets,
    cancelTicket
};
