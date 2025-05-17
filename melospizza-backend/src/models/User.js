const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Necesitamos bcrypt para encriptar contraseñas

// Definir el esquema de usuario
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Por favor ingresa un nombre de usuario'], // Campo obligatorio con mensaje de error
    unique: true, // El nombre de usuario debe ser único en la base de datos
    lowercase: true, // Guardar el nombre de usuario en minúsculas
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'] // Longitud mínima
  },
  email: {
    type: String,
    required: [true, 'Por favor ingresa un correo electrónico'], // Campo obligatorio
    unique: true, // El correo electrónico debe ser único
    lowercase: true, // Guardar el correo en minúsculas
    // Validación básica de formato de correo electrónico (puedes usar regex más complejos si quieres)
    match: [/.+\@.+\..+/, 'Por favor ingresa un correo electrónico válido']
  },
  password: {
    type: String,
    required: [true, 'Por favor ingresa una contraseña'], // Campo obligatorio
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'] // Longitud mínima
  },
  // Puedes añadir otros campos si los necesitas, por ejemplo:
  // fullName: { type: String },
  // address: { type: String },
  // phone: { type: String },
  // Agregar campos para el historial de pedidos más adelante
}, { timestamps: true }); // `timestamps: true` añade automáticamente `createdAt` y `updatedAt`


// --- Middleware de Mongoose (Hooks) ---
// Función que se ejecuta ANTES de guardar un documento de usuario
userSchema.pre('save', async function(next) {
  // Solo hashear la contraseña si ha sido modificada (o es un documento nuevo)
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10); // Generar un "salt" (cadena aleatoria)
    this.password = await bcrypt.hash(this.password, salt); // Hashear la contraseña con el salt
  }
  next(); // Continuar con el proceso de guardado
});


// Crear el Modelo de Usuario a partir del esquema
const User = mongoose.model('User', userSchema);

// Exportar el modelo para poder usarlo en otras partes de la aplicación
module.exports = User;