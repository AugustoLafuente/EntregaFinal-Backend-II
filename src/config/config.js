import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 8080,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUrl: process.env.MONGO_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'secret_jwt_default',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    mail: {
        host: process.env.MAIL_HOST || '',
        port: Number(process.env.MAIL_PORT) || 587,
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '',
        from: process.env.MAIL_FROM || ''
    }
};

export const COOKIE_NAME = 'currentUser';
export const COOKIE_MAX_AGE = 3600000;
