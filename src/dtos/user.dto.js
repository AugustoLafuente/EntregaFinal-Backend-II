/**
 * DTO de User: define qué campos del documento de Mongoose (o del payload
 * de un JWT) se exponen en las respuestas de la API. `password` nunca se
 * incluye, ni siquiera hasheada.
 */
export const toUserDTO = (user) => {
    if (!user) return null;

    return {
        id: (user._id ?? user.id)?.toString(),
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
    };
};

// Versión reducida para usar como documento relacionado (populate) en otros
// DTOs (ej. el ticket visto por el organizador del evento): mismos campos,
// nunca password.
export const toUserSummaryDTO = (user) => {
    if (!user) return null;

    return {
        id: (user._id ?? user.id)?.toString(),
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
    };
};

export default {
    toUserDTO,
    toUserSummaryDTO
};
