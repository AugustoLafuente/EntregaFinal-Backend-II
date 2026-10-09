/**
 * Lógica de negocio para la gestión administrativa de usuarios.
 * Los controllers consumen este service, nunca el repository directamente.
 */
import usersRepository from '../repositories/users.repository.js';
import { toUserDTO } from '../dtos/user.dto.js';

export const listUsers = async () => {
    const users = await usersRepository.getAllUsers();
    return users.map(toUserDTO);
};

export default {
    listUsers
};
