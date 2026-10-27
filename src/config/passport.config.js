/**
 * Configuración centralizada de Passport.js: estrategias de registro,
 * login y usuario actual. Nuevas estrategias (Google, GitHub, etc.) se
 * agregan acá sin tocar app.js.
 */
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import usersService from '../services/users.service.js';
import { config, COOKIE_NAME } from './config.js';
import AppError from '../utils/AppError.js';

// Extrae el JWT desde la cookie httpOnly en lugar del header Authorization.
const cookieExtractor = (req) => req?.cookies?.[COOKIE_NAME] || null;

const initializePassport = () => {
    passport.use(
        'register',
        new LocalStrategy(
            { usernameField: 'email', passwordField: 'password', passReqToCallback: true },
            async (req, email, password, done) => {
                try {
                    const { first_name, last_name } = req.body;
                    const newUser = await usersService.registerUser({
                        first_name,
                        last_name,
                        email,
                        password
                    });
                    return done(null, newUser);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    passport.use(
        'login',
        new LocalStrategy(
            { usernameField: 'email', passwordField: 'password' },
            async (email, password, done) => {
                try {
                    const user = await usersService.validateCredentials(email, password);
                    if (!user) {
                        return done(null, false);
                    }
                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    passport.use(
        'current',
        new JwtStrategy(
            {
                jwtFromRequest: cookieExtractor,
                secretOrKey: config.jwtSecret
            },
            async (jwtPayload, done) => {
                try {
                    const user = await usersService.getUserById(jwtPayload.id);
                    if (!user) {
                        return done(null, false);
                    }
                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );
};

// Middlewares de ruta: envuelven passport.authenticate y reenvían cualquier
// error al middleware global (src/middlewares/errorHandler.middleware.js),
// manteniendo las rutas limpias y la lógica de autenticación en las
// estrategias de arriba.
export const authenticateRegister = (req, res, next) => {
    passport.authenticate('register', { session: false }, (err, user) => {
        if (err) {
            return next(err);
        }
        req.user = user;
        return next();
    })(req, res, next);
};

export const authenticateLogin = (req, res, next) => {
    passport.authenticate('login', { session: false }, (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next(new AppError('Credenciales inválidas', 401));
        }
        req.user = user;
        return next();
    })(req, res, next);
};

export default initializePassport;
