// src/server.js

// Importar los módulos necesarios
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Para hashear y comparar contraseñas
const cors = require("cors"); // Para permitir solicitudes desde tu frontend
const jwt = require('jsonwebtoken'); // Para trabajar con JSON Web Tokens

// Importar los modelos que creamos
const User = require('./models/User');
const Order = require('./models/Order');

// Crear una instancia de la aplicación Express
const app = express();

// --- Middlewares ---
// Middleware CORS (permite solicitudes desde cualquier origen - conveniente para desarrollo local)
app.use(cors());
// Middleware para parsear JSON en las solicitudes
app.use(express.json());

// --- Clave Secreta para JWT ---
// !!! IMPORTANTE: En producción, usa una variable de entorno para esto !!!
const jwtSecret = process.env.JWT_SECRET || 'yoursClaveLong&seguraforjwt'; // <<<--- ASEGÚRATE DE CAMBIAR ESTO POR UNA CLAVE LARGA Y ÚNICA

// --- Middleware para Verificar JWT ---
// Esta función se usará en las rutas que queremos proteger
const verifyJWT = (req, res, next) => {
    // 1. Obtener el token del header de Autorización
    // El token típicamente viene en el formato: "Bearer TOKEN_AQUI"
    const authHeader = req.headers['authorization'];
    // console.log('Auth Header:', authHeader); // Log para depuración
    const token = authHeader && authHeader.split(' ')[1]; // Extraer el token después de "Bearer "

    // 2. Si no hay token, enviar respuesta 401 (No autorizado)
    if (token == null) {
        console.warn('Intento de acceso a ruta protegida sin token.');
        return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' }); // Unauthorized
    }

    // 3. Verificar el token
    jwt.verify(token, jwtSecret, (err, decoded) => {
        // Si la verificación falla (token inválido, expirado, etc.)
        if (err) {
            console.error('Error al verificar token:', err.message);
            // El error más común es 'jwt expired'
            return res.status(403).json({ message: 'Token inválido o expirado.' }); // Forbidden
        }

        // Si la verificación es exitosa, el 'decoded' contiene el payload del token
        console.log('Token verificado exitosamente. Payload:', decoded);

        // Añadir el payload decodificado a la solicitud para que esté disponible en la ruta
        // Ahora puedes acceder a req.user.userId en las rutas protegidas
        req.user = decoded; // decoded es { userId: ... }

        // 4. Pasar al siguiente middleware o a la función manejadora de la ruta
        next();
    });
};


// --- Conexión a MongoDB ---
const dbURI = 'mongodb://localhost:27017/melospizzadb'; // URL de conexión a tu base de datos local

mongoose.connect(dbURI)
    .then(() => {
        console.log('Conectado a la base de datos MongoDB');
        // Una vez conectados a la base de datos, iniciamos el servidor
        const PORT = process.env.PORT || 3000; // Puerto en el que el servidor escuchará

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
            console.log(`Accede al servidor en: http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Error al conectar a la base de datos:', err);
        process.exit(1); // Salir del proceso si no se puede conectar a la base de datos
    });


// --- Rutas Públicas (No requieren JWT) ---

// Ruta de ejemplo para verificar que el servidor funciona
app.get('/', (req, res) => {
    res.send('¡El backend de Melo\'s Pizza está funcionando!');
});

// Ruta para el Registro de Usuarios
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body; // Obtener los datos del cuerpo de la solicitud

    try {
        // Crear una nueva instancia de usuario usando el modelo
        const user = new User({ username, email, password });

        // Guardar el usuario en la base de datos
        // El middleware pre('save') en el modelo se encargará de hashear la contraseña antes de guardar
        await user.save();

        // Si el registro fue exitoso, enviar una respuesta de éxito
        // No enviamos la contraseña (ni siquiera la hasheada) de vuelta por seguridad
        res.status(201).json({ message: 'Usuario registrado exitosamente', userId: user._id });

    } catch (err) {
        // Si ocurre un error (por ejemplo, nombre de usuario o correo duplicado, validación fallida)
        console.error('Error en el registro de usuario:', err);

        let errorMessage = 'Error al registrar el usuario.';

        // Manejar errores específicos de Mongoose (por ejemplo, duplicados o validación)
        if (err.code === 11000) {
            // Error de clave duplicada (username o email ya existen)
            const field = Object.keys(err.keyValue)[0];
            errorMessage = `El ${field} '${err.keyValue[field]}' ya está registrado.`;
            res.status(409).json({ message: errorMessage }); // 409 Conflict
        } else if (err.errors) {
            // Errores de validación (ej: contraseña corta, correo inválido)
            const validationErrors = Object.values(err.errors).map(e => e.message);
            errorMessage = 'Errores de validación: ' + validationErrors.join(', ');
            res.status(400).json({ message: errorMessage, errors: validationErrors }); // 400 Bad Request
        } else {
            // Otro tipo de error del servidor
            res.status(500).json({ message: errorMessage }); // 500 Internal Server Error
        }
    }
});

// Ruta para el Inicio de Sesión (Ahora genera y envía JWT Y NOMBRE DE USUARIO)
app.post('/api/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body; // Recibir nombre de usuario/correo y contraseña

    try {
        // 1. Buscar al usuario por nombre de usuario o correo electrónico
        const user = await User.findOne({
            $or: [ // Usamos $or para buscar en dos campos
                { username: usernameOrEmail.toLowerCase() }, // Buscar por nombre de usuario (en minúsculas)
                { email: usernameOrEmail.toLowerCase() } // O buscar por correo electrónico (en minúsculas)
            ]
        });

        // 2. Verificar si el usuario existe
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas (usuario no encontrado)' }); // 401 Unauthorized
        }

        // 3. Comparar la contraseña proporcionada con la contraseña hasheada en la base de datos
        const isMatch = await bcrypt.compare(password, user.password);

        // 4. Verificar si las contraseñas coinciden
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas (contraseña incorrecta)' });
        }

        // 5. Si el usuario existe y la contraseña es correcta, el login es exitoso
        // *** Generamos un Token JWT y lo enviamos al frontend ***

        // Payload del token: Información que quieres guardar en el token (ej. user ID)
        const payload = { userId: user._id };

        // Generar el token
        const token = jwt.sign(
            payload, // Datos a incluir (el ID del usuario)
            jwtSecret, // Nuestra clave secreta para firmar el token
            { expiresIn: '1h' } // Opciones: El token expira en 1 hora (puedes ajustar esto)
        );

        // Enviar la respuesta de éxito al frontend, incluyendo el token, userId Y username
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token: token,
            userId: user._id,
            username: user.username // <<<--- ¡HE AÑADIDO username aquí!
        });

    } catch (err) {
        console.error('Error en el inicio de sesión:', err);
        res.status(500).json({ message: 'Error interno del servidor al intentar iniciar sesión.' }); // 500 Internal Server Error
    }
});


// --- Rutas Protegidas (Requieren JWT) ---
// Añadimos 'verifyJWT' como middleware antes de la función manejadora de la ruta

// Ruta para Crear un Nuevo Pedido (PROTEGIDA)
// Ahora requiere un Token JWT válido para saber quién hace el pedido
app.post('/api/orders', verifyJWT, async (req, res) => { // <<<--- Añadimos verifyJWT aquí
    // Ya no necesitamos obtener el userId del cuerpo de la solicitud (req.body)
    // ¡Obtenemos el userId del TOKEN verificado por el middleware!
    const userId = req.user.userId; // <<<--- CAMBIAMOS ESTO: Ahora viene del token

    // El resto de los datos del pedido vienen del cuerpo de la solicitud
    const { items, customerInfo, totalAmount } = req.body;

    // Validación básica de los datos recibidos (mantenemos esto)
    if (!items || !Array.isArray(items) || items.length === 0 || !customerInfo || !totalAmount) {
        return res.status(400).json({ message: 'Faltan datos obligatorios para crear el pedido.' });
    }

    try {
        // Crear una nueva instancia de pedido usando el modelo
        const order = new Order({
            user: userId, // Asociar el pedido al userId OBTENIDO DEL TOKEN
            items: items,
            customerInfo: customerInfo,
            totalAmount: totalAmount,
            // status se usará el valor por defecto 'pendiente'
        });

        // Guardar el pedido en la base de datos
        await order.save();

        // Si el pedido se guardó exitosamente, enviar una respuesta de éxito
        res.status(201).json({ message: 'Pedido guardado exitosamente', orderId: order._id });

    } catch (err) {
        console.error('Error al guardar el pedido:', err);
        let errorMessage = 'Error al guardar el pedido.';
        if (err.errors) {
            const validationErrors = Object.values(err.errors).map(e => e.message);
            errorMessage = 'Errores de validación del pedido: ' + validationErrors.join(', ');
            res.status(400).json({ message: errorMessage, errors: validationErrors });
        } else {
            res.status(500).json({ message: errorMessage });
        }
    }
});

// Ruta para Obtener Historial de Pedidos por Usuario (PROTEGIDA)
// Ahora requiere un Token JWT válido y SOLO permite obtener el historial del usuario logueado
app.get('/api/users/:userId/orders', verifyJWT, async (req, res) => { // <<<--- Añadimos verifyJWT aquí
    // Obtener el userId solicitado en los parámetros de la URL (lo que el frontend pidió ver)
    const requestedUserId = req.params.userId;

    // Obtener el userId del TOKEN verificado por el middleware
    const authenticatedUserId = req.user.userId; // <<<--- OBTENEMOS EL ID DEL TOKEN

    // *** VERIFICACIÓN DE SEGURIDAD: Asegurar que el usuario logueado solo consulte SU propio historial ***
    // Comparamos el ID del token con el ID solicitado en la URL
    // Si no coinciden, alguien está intentando acceder al historial de otro
    if (requestedUserId !== authenticatedUserId) {
        console.warn(`Intento de usuario ${authenticatedUserId} de acceder al historial de usuario ${requestedUserId}`);
        return res.status(403).json({ message: 'Prohibido. No puedes acceder al historial de otros usuarios.' }); // Forbidden
    }

    // Si llegamos aquí, el usuario está autenticado y está pidiendo SU PROPIO historial (el ID coincide)

    try {
        // Buscar todos los pedidos en la base de datos asociados al userId del TOKEN
        const orders = await Order.find({ user: authenticatedUserId }) // <<<--- USAMOS authenticatedUserId para la búsqueda
            .sort({ createdAt: -1 }); // Opcional: Ordenar por fecha de creación descendente (más recientes primero)

        // Enviar la lista de pedidos encontrados como respuesta
        // Si no se encuentran pedidos, se enviará un array vacío []
        res.status(200).json(orders);

    } catch (err) {
        console.error('Error al obtener historial de pedidos:', err);
        res.status(500).json({ message: 'Error interno del servidor al obtener historial de pedidos.' });
    }
});

// Aquí es donde añadiremos otras rutas protegidas si es necesario


// module.exports = app; (si lo tienes)