// src/models/Order.js

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Referencia al usuario que hizo el pedido
  // `type: mongoose.Schema.Types.ObjectId` indica que este campo guardará un ID de MongoDB
  // `ref: 'User'` le dice a Mongoose a qué modelo (`User`) se refiere este ID. Esto nos permite "popular" (cargar la información completa del usuario) más adelante si es necesario.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El pedido debe estar asociado a un usuario.']
  },
  // Detalles de los items del pedido
  items: [ // Esto es un array de objetos, cada objeto representa un item en el pedido
    {
      name: {
        type: String,
        required: [true, 'El nombre del item es obligatorio']
      },
      size: { // Puede ser null para items sin tamaño (adiciones, bebidas)
        type: String
      },
      price: {
        type: Number,
        required: [true, 'El precio del item es obligatorio']
      },
      quantity: {
        type: Number,
        required: [true, 'La cantidad del item es obligatoria'],
        min: [1, 'La cantidad debe ser al menos 1']
      }
    }
  ],
  // Información de contacto y envío (similar a lo que envías por WhatsApp)
  customerInfo: {
    paymentMethod: {
      type: String,
      required: [true, 'La forma de pago es obligatoria']
    },
    shippingAddress: {
      type: String,
      required: [true, 'La dirección de envío es obligatoria']
    },
    shippingNeighborhood: {
      type: String
      // required: [true, 'El barrio es obligatorio'] // Opcional hacerlo obligatorio
    },
    contactPhone: {
      type: String,
      required: [true, 'El número de contacto es obligatorio']
    }
  },
  totalAmount: { // Monto total del pedido
    type: Number,
    required: [true, 'El monto total es obligatorio'],
    min: [0, 'El monto total debe ser un valor positivo']
  },
  // Estado del pedido (opcional, puedes añadir estados como 'pendiente', 'en proceso', 'entregado')
  status: {
    type: String,
    enum: ['pendiente', 'en proceso', 'enviado', 'entregado', 'cancelado'], // Define los estados posibles
    default: 'pendiente' // Estado por defecto al crear el pedido
  },
  // Fecha y hora del pedido (automático con timestamps: true)
}, { timestamps: true }); // `timestamps: true` añade automáticamente `createdAt` y `updatedAt`

// Crear el Modelo de Pedido a partir del esquema
const Order = mongoose.model('Order', orderSchema);

// Exportar el modelo
module.exports = Order;