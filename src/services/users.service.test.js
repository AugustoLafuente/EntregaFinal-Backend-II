import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import usersRepository from '../repositories/users.repository.js';
import usersService from './users.service.js';
import { hashPassword } from '../utils/hash.js';

const VALID_USER_INPUT = {
    first_name: 'Juan',
    last_name: 'Pérez',
    email: 'juan.perez@example.com',
    password: 'password123'
};

const buildFakeUser = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    first_name: 'Juan',
    last_name: 'Pérez',
    email: 'juan.perez@example.com',
    password: 'hashed_password_mock',
    role: 'user',
    ...overrides
});

describe('users.service - registerUser', () => {
    test('rechaza campos obligatorios faltantes', async () => {
        const { first_name, ...withoutFirstName } = VALID_USER_INPUT;
        await assert.rejects(
            () => usersService.registerUser(withoutFirstName),
            (error) => {
                assert.equal(error.statusCode, 400);
                assert.match(error.message, /Faltan campos obligatorios/i);
                return true;
            }
        );
    });

    test('rechaza email con formato inválido', async () => {
        await assert.rejects(
            () => usersService.registerUser({ ...VALID_USER_INPUT, email: 'invalido-email' }),
            (error) => {
                assert.equal(error.statusCode, 400);
                assert.match(error.message, /formato del email es inválido/i);
                return true;
            }
        );
    });

    test('rechaza contraseña de menos de 8 caracteres', async () => {
        await assert.rejects(
            () => usersService.registerUser({ ...VALID_USER_INPUT, password: '123' }),
            (error) => {
                assert.equal(error.statusCode, 400);
                assert.match(error.message, /al menos 8 caracteres/i);
                return true;
            }
        );
    });

    test('rechaza registro si el email ya existe', async (t) => {
        t.mock.method(usersRepository, 'getUserByEmail', async () => buildFakeUser());

        await assert.rejects(
            () => usersService.registerUser(VALID_USER_INPUT),
            (error) => {
                assert.equal(error.statusCode, 409);
                assert.match(error.message, /ya está registrado/i);
                return true;
            }
        );
    });

    test('crea el usuario correctamente y devuelve el DTO sin password', async (t) => {
        t.mock.method(usersRepository, 'getUserByEmail', async () => null);

        let createdPayload;
        t.mock.method(usersRepository, 'createUser', async (data) => {
            createdPayload = data;
            return buildFakeUser(data);
        });

        const result = await usersService.registerUser(VALID_USER_INPUT);

        assert.equal(result.email, VALID_USER_INPUT.email);
        assert.equal(result.first_name, VALID_USER_INPUT.first_name);
        assert.equal(result.last_name, VALID_USER_INPUT.last_name);
        assert.equal(result.password, undefined);
        assert.ok(createdPayload.password !== VALID_USER_INPUT.password, 'La contraseña guardada debe estar hasheada');
    });
});

describe('users.service - validateCredentials', () => {
    test('devuelve null si faltan email o password', async () => {
        assert.equal(await usersService.validateCredentials('', '12345678'), null);
        assert.equal(await usersService.validateCredentials('test@example.com', ''), null);
    });

    test('devuelve null si el email no existe', async (t) => {
        t.mock.method(usersRepository, 'getUserByEmail', async () => null);

        const result = await usersService.validateCredentials('noexiste@example.com', 'password123');
        assert.equal(result, null);
    });

    test('devuelve null si la contraseña no coincide', async (t) => {
        const hashedPassword = await hashPassword('password123');
        t.mock.method(usersRepository, 'getUserByEmail', async () => buildFakeUser({ password: hashedPassword }));

        const result = await usersService.validateCredentials('juan.perez@example.com', 'password_incorrecta');
        assert.equal(result, null);
    });

    test('devuelve el DTO del usuario sin password si las credenciales son válidas', async (t) => {
        const rawPassword = 'password123';
        const hashedPassword = await hashPassword(rawPassword);
        t.mock.method(usersRepository, 'getUserByEmail', async () => buildFakeUser({ password: hashedPassword }));

        const result = await usersService.validateCredentials('juan.perez@example.com', rawPassword);

        assert.ok(result);
        assert.equal(result.email, 'juan.perez@example.com');
        assert.equal(result.first_name, 'Juan');
        assert.equal(result.last_name, 'Pérez');
        assert.equal(result.password, undefined);
    });
});

describe('users.service - listUsers', () => {
    test('devuelve lista de usuarios mapeada a DTOs sin passwords', async (t) => {
        t.mock.method(usersRepository, 'getAllUsers', async () => [
            buildFakeUser({ email: 'u1@example.com' }),
            buildFakeUser({ email: 'u2@example.com' })
        ]);

        const result = await usersService.listUsers();
        assert.equal(result.length, 2);
        assert.equal(result[0].email, 'u1@example.com');
        assert.equal(result[0].password, undefined);
        assert.equal(result[1].email, 'u2@example.com');
        assert.equal(result[1].password, undefined);
    });
});
