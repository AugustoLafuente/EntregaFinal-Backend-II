import app from './app.js';
import { config } from './config/config.js';
import { connectDB } from './config/db.js';

const PORT = config.port;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT} (entorno: ${config.nodeEnv})`);
        });
    } catch (error) {
        console.error(' Error al conectar con MongoDB:', error.message);
        process.exit(1);
    }
};

startServer();
