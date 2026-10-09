/**
 * Controlador para la gestión administrativa de Usuarios.
 */
import usersService from '../services/users.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await usersService.listUsers();
    return res.status(200).json({
        status: 'success',
        payload: users
    });
});

export default {
    getAllUsers
};
