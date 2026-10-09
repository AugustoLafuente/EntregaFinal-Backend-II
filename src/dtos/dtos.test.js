/**
 * Tests de la capa de DTO: garantizan que ninguna respuesta (ni siquiera
 * cuando el documento viene de un `populate`) exponga el campo `password`
 * del usuario, y que los DTOs filtren los documentos relacionados con su
 * propio DTO.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { toUserDTO, toUserSummaryDTO } from './user.dto.js';
import { toEventDTO, toEventSummaryDTO } from './event.dto.js';
import { toTicketDTO, toTicketWithEventDTO, toTicketWithUserDTO } from './ticket.dto.js';

const fakeUserWithPassword = {
    _id: 'u1',
    first_name: 'Ana',
    last_name: 'Pérez',
    email: 'ana@mail.com',
    password: '$2b$10$hashedpasswordvalue',
    role: 'organizer'
};

describe('user.dto', () => {
    test('toUserDTO nunca incluye password', () => {
        const dto = toUserDTO(fakeUserWithPassword);
        assert.equal(dto.password, undefined);
        assert.ok(!('password' in dto));
        assert.equal(dto.email, 'ana@mail.com');
        assert.equal(dto.role, 'organizer');
    });

    test('toUserDTO funciona con el payload reducido del JWT (sin first_name/last_name)', () => {
        const dto = toUserDTO({ id: 'u1', email: 'ana@mail.com', role: 'user' });
        assert.equal(dto.id, 'u1');
        assert.equal(dto.password, undefined);
    });

    test('toUserDTO con null devuelve null', () => {
        assert.equal(toUserDTO(null), null);
    });

    test('toUserSummaryDTO nunca incluye password', () => {
        const dto = toUserSummaryDTO(fakeUserWithPassword);
        assert.ok(!('password' in dto));
        assert.equal(dto.first_name, 'Ana');
    });
});

describe('event.dto', () => {
    const fakeEvent = {
        _id: 'e1',
        title: 'Maratón',
        description: 'desc',
        sport_type: 'running',
        category: 'amateur',
        date: new Date(),
        location: 'CABA',
        capacity: 10,
        price: 0,
        status: 'published',
        organizer: 'u1'
    };

    test('toEventDTO expone los campos esperados', () => {
        const dto = toEventDTO(fakeEvent);
        assert.equal(dto.id, 'e1');
        assert.equal(dto.title, 'Maratón');
        assert.equal(dto.organizer, 'u1');
    });

    test('toEventSummaryDTO solo expone los campos reducidos', () => {
        const dto = toEventSummaryDTO(fakeEvent);
        assert.deepEqual(Object.keys(dto).sort(), ['date', 'id', 'location', 'title']);
    });
});

describe('ticket.dto', () => {
    const fakeTicket = {
        _id: 't1',
        status: 'confirmed',
        quantity: 2,
        reservationCode: 'TCK-ABC',
        createdAt: new Date(),
        cancelledAt: null,
        user: fakeUserWithPassword,
        event: { _id: 'e1', title: 'Maratón', date: new Date(), location: 'CABA' }
    };

    test('toTicketDTO no transforma user/event (uso sin populate)', () => {
        const dto = toTicketDTO({ ...fakeTicket, user: 'u1', event: 'e1' });
        assert.equal(dto.user, 'u1');
        assert.equal(dto.event, 'e1');
    });

    test('toTicketWithUserDTO filtra el usuario poblado y nunca expone password', () => {
        const dto = toTicketWithUserDTO(fakeTicket);
        assert.ok(!('password' in dto.user));
        assert.equal(dto.user.email, 'ana@mail.com');
        assert.equal(dto.user.first_name, 'Ana');
    });

    test('toTicketWithEventDTO filtra el evento poblado a sus campos reducidos', () => {
        const dto = toTicketWithEventDTO(fakeTicket);
        assert.deepEqual(Object.keys(dto.event).sort(), ['date', 'id', 'location', 'title']);
    });
});
