/**
 * Lógica de negocio para la gestión de usuarios, incluida la autenticación.
 * Los controllers y las estrategias de Passport consumen este service,
 * nunca el repository directamente.
 */
import usersRepository from '../repositories/users.repository.js';
import { toUserDTO } from '../dtos/user.dto.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import AppError from '../utils/AppError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export const listUsers = async () => {
    const users = await usersRepository.getAllUsers();
    return users.map(toUserDTO);
};

export const registerUser = async ({ first_name, last_name, email, password }) => {
    if (!first_name || !last_name || !email || !password) {
        throw new AppError('Faltan campos obligatorios', 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        throw new AppError('El formato del email es inválido', 400);
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
        throw new AppError(
            `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
            400
        );
    }

    const existingUser = await usersRepository.getUserByEmail(normalizedEmail);
    if (existingUser) {
        throw new AppError('El email ya está registrado', 409);
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await usersRepository.createUser({
        first_name: String(first_name).trim(),
        last_name: String(last_name).trim(),
        email: normalizedEmail,
        password: hashedPassword
        // role no se acepta desde el body: siempre queda el valor por defecto del modelo
    });

    return toUserDTO(newUser);
};

// Usado por la estrategia 'current' de Passport para resolver el perfil
// completo a partir del id guardado en el JWT. Devuelve null (en vez de
// lanzar) si el usuario ya no existe, para que la estrategia responda 401.
export const getUserById = async (id) => {
    const user = await usersRepository.getUserById(id);
    return toUserDTO(user);
};

// Devuelve null si las credenciales son inválidas, en lugar de lanzar,
// para que la estrategia 'login' decida cómo responder (done(null, false)).
export const validateCredentials = async (email, password) => {
    if (!email || !password) {
        return null;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await usersRepository.getUserByEmail(normalizedEmail);
    if (!user) {
        return null;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        return null;
    }

    return toUserDTO(user);
};

export default {
    listUsers,
    registerUser,
    getUserById,
    validateCredentials
};
