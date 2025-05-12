// cart.js

// Espera a que todo el DOM esté cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {

    // --- Selección de Elementos del DOM ---
    // *** SELECCIONANDO EL BOTÓN FLOTANTE DEL CARRITO (.cart-float) ***
    const cartIconButton = document.querySelector('.cart-float');
    // *** SELECCIONANDO EL SPAN DE CONTADOR FLOTANTE (#cart-count-float) ***
    const cartCountSpan = document.getElementById('cart-count-float');

    // Elementos del modal del carrito (Estos NO se eliminan del HTML)
    const cartModal = document.getElementById('cart-modal');
    const closeButton = document.querySelector('.close-button'); // Botón para cerrar el modal
    const cartItemsDiv = document.getElementById('cart-items'); // Div donde se listan los items en el modal
    const cartTotalSpan = document.getElementById('cart-total-price'); // Span donde se muestra el total
    const checkoutButton = document.getElementById('checkout-button'); // Botón para enviar el pedido

    // Elementos del formulario dentro del modal
    const paymentMethodSelect = document.getElementById('payment-method'); // Select de forma de pago
    const paymentProofInstruction = document.getElementById('payment-proof-instruction'); // Párrafo de instrucción de pago
    const shippingAddressInput = document.getElementById('shipping-address'); // Input de dirección
    const shippingNeighborhoodInput = document.getElementById('shipping-neighborhood'); // Input de barrio
    const contactPhoneInput = document.getElementById('contact-phone'); // Input de teléfono
    const checkoutForm = document.getElementById('checkout-form'); // Formulario completo

    let cart = []; // Array para almacenar los items del carrito


    // --- Funciones del Carrito ---

    // Cargar carrito desde localStorage al iniciar
    function loadCart() {
        const storedCart = localStorage.getItem('meloPizzaCart');
        if (storedCart) {
            cart = JSON.parse(storedCart);
            updateCartDisplay(); // Actualiza la vista del carrito al cargar
        }
    }

    // Guardar el estado actual del carrito en localStorage
    function saveCart() {
        localStorage.setItem('meloPizzaCart', JSON.stringify(cart));
    }

    // Añadir un item al carrito o incrementar su cantidad si ya existe
    function addItemToCart(name, size, price) {
        // size será null para items que no tienen diferentes tamaños (como adiciones, bebidas)
        // Buscamos si ya existe un item con el mismo nombre Y tamaño
        const existingItemIndex = cart.findIndex(item => item.name === name && item.size === size);

        if (existingItemIndex > -1) {
            // Si el item ya existe, incrementa la cantidad
            cart[existingItemIndex].quantity++;
        } else {
            // Si el item no existe, añádelo al array con cantidad 1
            cart.push({ name, size, price, quantity: 1 });
        }

        saveCart(); // Guarda el carrito actualizado
        updateCartDisplay(); // Actualiza la vista (contador y contenido del modal)
        // No abrimos el modal automáticamente al añadir, el usuario hará clic en el botón flotante
    }

    // Remover completamente un item del carrito por su índice
    function removeItemFromCart(index) {
        // splice(indice, numeroDeElementosARemover)
        cart.splice(index, 1); // Remueve 1 item en el índice dado
        saveCart(); // Guarda el carrito actualizado
        updateCartDisplay(); // Actualiza la vista
    }

    // Actualizar la cantidad de un item por su índice
    function updateItemQuantity(index, newQuantity) {
        // Nos aseguramos de que la nueva cantidad sea un número entero no negativo
        newQuantity = parseInt(newQuantity);
        if (isNaN(newQuantity) || newQuantity < 0) {
            console.error("Cantidad no válida:", newQuantity);
            return; // Salimos de la función si la cantidad no es válida
        }

        if (newQuantity === 0) {
            // Si la nueva cantidad es 0, removemos el item
            removeItemFromCart(index);
        } else {
            // Si la nueva cantidad es mayor a 0, actualizamos la cantidad
            cart[index].quantity = newQuantity;
            saveCart(); // Guarda el carrito actualizado
            updateCartDisplay(); // Actualiza la vista
        }
    }


    // Actualizar la vista del carrito (contador flotante y contenido del modal)
    function updateCartDisplay() {
        // Calcular el número total de items (sumando las cantidades)
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        // Actualizar contador en el nuevo icono flotante (#cart-count-float)
        // Verificamos que el span del contador exista antes de intentar actualizarlo
        if (cartCountSpan) {
           cartCountSpan.textContent = totalItems;
           // Opcional: Ocultar el contador si está en 0
           // if (totalItems > 0) { cartCountSpan.style.display = 'block'; } else { cartCountSpan.style.display = 'none'; }
        }

        // Renderizar la lista de items en el modal
        cartItemsDiv.innerHTML = ''; // Limpiar contenido actual del div

        if (cart.length === 0) {
            // Si el carrito está vacío
            cartItemsDiv.innerHTML = '<p>El carrito está vacío.</p>';
            cartTotalSpan.textContent = '0'; // Total en 0
            checkoutButton.disabled = true; // Deshabilita el botón de enviar pedido
        } else {
            // Si hay items en el carrito
            let total = 0;
            // Iteramos sobre cada item en el array del carrito
            cart.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item'); // Añade la clase CSS para estilos
                // Genera el HTML para un item individual del carrito
                itemElement.innerHTML = `
                    <div class="cart-item-details">
                        <h4>${item.name} ${item.size ? '(' + item.size + ')' : ''}</h4> <p>Precio unitario: $${item.price.toLocaleString('es-CO')}</p> </div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button class="quantity-button decrease-quantity" data-index="${index}">-</button> <span class="item-quantity-display">${item.quantity}</span> <button class="quantity-button increase-quantity" data-index="${index}">+</button> </div>
                        <span class="remove-item" data-index="${index}" title="Eliminar item">
                            <i class="fas fa-trash"></i> </span>
                    </div>
                `;
                cartItemsDiv.appendChild(itemElement); // Añade el item al div del modal

                total += item.price * item.quantity; // Suma el costo total del item al total general
            });

            cartTotalSpan.textContent = total.toLocaleString('es-CO'); // Actualiza el total en el modal, formateado
            checkoutButton.disabled = false; // Habilita el botón de enviar pedido
        }
    }

    // Mostrar el modal del carrito (cambiando su estilo display)
    function showCartModal() {
        // Verificamos que el modal exista en el DOM
        if (cartModal) {
           cartModal.style.display = 'block'; // Hace visible el modal
            // Asegura que el contenido del modal esté actualizado cada vez que se abre
            updateCartDisplay();
        } else {
            console.error("Elemento con ID 'cart-modal' no encontrado.");
        }
    }

    // Ocultar el modal del carrito
    function hideCartModal() {
         // Verificamos que el modal exista en el DOM
         if (cartModal) {
            cartModal.style.display = 'none'; // Oculta el modal
            // Opcional: Limpiar el formulario y resetear el select al cerrar el modal
            checkoutForm.reset();
            paymentMethodSelect.value = "";
            paymentProofInstruction.style.display = 'none'; // Oculta la instrucción de pago
         }
    }


    // --- Event Listeners (Manejo de Interacciones del Usuario) ---

    // *** Clic en el BOTÓN FLOTANTE (.cart-float) para mostrar el modal ***
    // Verificamos que el botón flotante exista antes de añadir el listener
    if (cartIconButton) {
        cartIconButton.addEventListener('click', showCartModal);
    } else {
        console.error("Elemento con clase '.cart-float' no encontrado. El botón del carrito flotante no funcionará.");
    }

    // Clic en el botón de cerrar el modal
    // Verificamos que el botón exista
    if (closeButton) {
        closeButton.addEventListener('click', hideCartModal);
    }


    // Clic fuera del modal para cerrarlo
    // Añadimos un listener a la ventana completa
    window.addEventListener('click', (event) => {
        // Si el elemento en el que se hizo clic es el fondo oscuro del modal (no el contenido)
        if (event.target === cartModal) {
            hideCartModal(); // Oculta el modal
        }
    });


    // Manejar clics en los botones de cantidad (+/-) y el icono de remover dentro del modal
    // Usamos delegación de eventos en cartItemsDiv (el contenedor de los items del carrito)
    // para no tener que añadir listeners a cada botón individualmente
    if (cartItemsDiv) { // Verificamos que el contenedor de items exista
        cartItemsDiv.addEventListener('click', (event) => {
            const target = event.target; // El elemento exacto donde ocurrió el clic

            // Usamos .closest() para encontrar el elemento más cercano que coincida con un selector
            // Esto nos permite capturar clics en los iconos dentro de los botones, etc.
            const actionElement = target.closest('.increase-quantity, .decrease-quantity, .remove-item');

            // Si el clic no fue en uno de los elementos de acción (botones +/- o span remover), salimos
            if (!actionElement) return;

            // Obtenemos el índice del item asociado a la acción desde el atributo data-index
            const index = actionElement.dataset.index;

            // Convertimos el índice a número entero
            const itemIndex = parseInt(index);

            // Verificamos que el índice sea un número válido y esté dentro de los límites del array del carrito
            if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= cart.length) {
                console.error("Índice de item no válido:", index);
                return; // Salimos si el índice no es válido
            }


            if (actionElement.classList.contains('increase-quantity')) {
                // Si se clicó el botón de aumentar cantidad (+)
                const currentQuantity = cart[itemIndex].quantity;
                updateItemQuantity(itemIndex, currentQuantity + 1); // Llama a la función para actualizar la cantidad

            } else if (actionElement.classList.contains('decrease-quantity')) {
                // Si se clicó el botón de disminuir cantidad (-)
                const currentQuantity = cart[itemIndex].quantity;
                updateItemQuantity(itemIndex, currentQuantity - 1); // Llama a la función (manejará si llega a 0)

            } else if (actionElement.classList.contains('remove-item')) {
                // Si se clicó el span o el icono de remover
                 removeItemFromCart(itemIndex); // Llama a la función para remover el item

            }
        });
    } else {
        console.error("Elemento con ID 'cart-items' no encontrado.");
    }


    // Manejar clics en los elementos del menú que añaden items al carrito
    // Usamos delegación de eventos en el body para capturar clics en items
    // Esto es útil si los items del menú se cargan dinámicamente
    document.body.addEventListener('click', (event) => {
        const target = event.target; // El elemento exacto donde ocurrió el clic

        // Usamos .closest() para encontrar el elemento más cercano que sea .price-option o .single-price-item
        const clickedItem = target.closest('.price-option, .single-price-item');

        // Si el clic ocurrió en uno de estos items (o dentro de ellos)
        if (clickedItem) {
            // Obtenemos los datos del item de los atributos data-*
            const name = clickedItem.dataset.name;
            const size = clickedItem.dataset.size || null; // tamaño es null si no tiene data-size
            const price = parseInt(clickedItem.dataset.price); // Convertimos el precio a número

            // Verificamos que el precio sea un número válido
            if (!isNaN(price)) {
                addItemToCart(name, size, price); // Llama a la función para añadir el item al carrito
                // console.log(`${name} (${size || 'Sin tamaño'}) añadido/actualizado.`); // Opcional: log en consola
            } else {
                console.error('Precio no válido para el item:', clickedItem.dataset);
                alert('Error al añadir el producto. Precio no válido.');
            }
        }
    });


    // Mostrar/ocultar instrucción de pago al cambiar la forma de pago en el formulario
    // Verificamos que el select y la instrucción existan
    if (paymentMethodSelect && paymentProofInstruction) {
        paymentMethodSelect.addEventListener('change', () => {
            const selectedMethod = paymentMethodSelect.value;
            // Muestra la instrucción solo para métodos que requieren comprobante
            if (selectedMethod === 'nequi' || selectedMethod === 'bancolombia' || selectedMethod === 'daviplata') {
                paymentProofInstruction.style.display = 'block';
            } else {
                paymentProofInstruction.style.display = 'none';
            }
        });
    } else {
        console.warn("Select de forma de pago o instrucción de pago no encontrados. La funcionalidad de instrucciones de pago no funcionará.");
    }


    // Manejar clic en el botón de Enviar Pedido por WhatsApp
    // Verificamos que el botón y el formulario existan
    if (checkoutButton && checkoutForm && paymentMethodSelect && shippingAddressInput && shippingNeighborhoodInput && contactPhoneInput) {
        checkoutButton.addEventListener('click', () => {
            // Validar el formulario HTML5 antes de proceder
            if (!checkoutForm.checkValidity()) {
                checkoutForm.reportValidity(); // Muestra los mensajes de error del navegador
                return; // Detiene la ejecución si el formulario no es válido
            }

            // Verificamos que el carrito no esté vacío antes de enviar
            if (cart.length === 0) {
                alert('Tu carrito está vacío. Añade algunos productos antes de enviar.');
                return;
            }

            // --- Recolectar datos del formulario ---
            const paymentMethodValue = paymentMethodSelect.value;
            const shippingAddress = shippingAddressInput.value.trim(); // .trim() remueve espacios al inicio y final
            const shippingNeighborhood = shippingNeighborhoodInput.value.trim();
            const contactPhone = contactPhoneInput.value.trim();

            // --- Construir el mensaje completo para WhatsApp ---
            let whatsappMessage = "¡Hola! Tengo un nuevo pedido:\n\n"; // Mensaje de inicio

            whatsappMessage += "--- Pedido ---\n";
            // Iteramos sobre los items del carrito para añadirlos al mensaje
            cart.forEach(item => {
                // Formato: Cantidad x Nombre (Tamaño) $PrecioTotalItem
                whatsappMessage += `${item.quantity}x ${item.name}${item.size ? ' (' + item.size + ')' : ''} $${(item.price * item.quantity).toLocaleString('es-CO')}\n`;
            });

            // Calcular y añadir el total al mensaje
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            whatsappMessage += `*Total: $${total.toLocaleString('es-CO')}*\n\n`; // Total en negrita

            whatsappMessage += "--- Datos del Cliente ---\n";
            // Añadir los datos del formulario al mensaje
            // Capitalizamos la primera letra del método de pago
            whatsappMessage += `Forma de Pago: ${paymentMethodValue.charAt(0).toUpperCase() + paymentMethodValue.slice(1)}\n`;
             // Usando tus variables para dirección y barrio, si las quieres así en el mensaje
             whatsappMessage += `Dirección de Envío: ${shippingAddress}\n`;
             whatsappMessage += `Barrio: ${shippingNeighborhood}\n`;

            whatsappMessage += `Celular de Contacto: ${contactPhone}\n\n`;

            // Añadir instrucción de comprobante si la forma de pago lo requiere
            if (paymentMethodValue === 'nequi' || paymentMethodValue === 'bancolombia' || paymentMethodValue === 'daviplata') {
                 whatsappMessage += "Por favor pregunta por el costo del domicilio antes de realizar el pago y envía el comprobante de pago para confirmar tu pedido.\n\n";
            }

            // --- Codificar el mensaje para la URL de WhatsApp ---
            const encodedMessage = encodeURIComponent(whatsappMessage);

            // --- Construir la URL de WhatsApp ---
            // REEMPLAZA '573124674602' CON TU NÚMERO DE WHATSAPP Y CÓDIGO DE PAÍS REAL
            const phoneNumber = '573124674602'; // Ejemplo: 57 para Colombia, seguido de tu número
            const whatsappURL = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;

            // console.log("Generated WhatsApp URL:", whatsappURL); // Opcional: ver la URL generada en consola
            // console.log("Message Length:", whatsappMessage.length); // Opcional: ver longitud del mensaje
            // console.log("Encoded Message Length:", encodedMessage.length); // Opcional: ver longitud del mensaje codificado


            // --- Abrir WhatsApp en una nueva pestaña ---
            window.open(whatsappURL, '_blank');

            // --- Opcional: Vaciar el carrito y cerrar modal después de enviar ---
            // Considera si quieres que el carrito se vacíe automáticamente aquí o si prefieres
            // hacerlo manualmente después de confirmar en WhatsApp. Si lo vacías aquí,
            // el usuario tendrá que volver a añadir los productos si no completa el pedido.
             cart = []; // Vacía el array del carrito
             saveCart(); // Guarda el estado vacío en localStorage
             updateCartDisplay(); // Actualiza la vista (el contador se pondrá en 0)
             hideCartModal(); // Cierra el modal

        });
    } else {
         console.error("Elementos del formulario o botón de checkout no encontrados. La funcionalidad de envío de pedido no funcionará.");
    }


    // --- Inicialización al cargar la página ---
    loadCart(); // Cargar el carrito guardado (si existe) y actualizar la vista


    // *** Opcional: Ocultar el viejo icono del header con JS si el CSS no funciona por algún motivo ***
    // Aunque la mejor práctica es eliminarlo del HTML o usar display: none; en CSS
     const oldHeaderCartIcon = document.querySelector('.cart-icon-container');
     if (oldHeaderCartIcon) {
        oldHeaderCartIcon.style.display = 'none';
     }
}); // --- Cierre del DOMContentLoaded listener ---
