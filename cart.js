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


    // --- URLs de las APIs de tu Backend (Asegúrate de que esta URL sea correcta) ---
    const backendBaseUrl = 'http://localhost:3000'; // URL de tu backend


    // --- Funciones de Autenticación (Deben estar disponibles desde auth.js) ---
    // Estas funciones asumen que auth.js se carga ANTES que cart.js
    // Si auth.js no expone estas funciones globalmente, necesitarías adaptarlo
    // o copiarlas aquí (menos recomendable si auth.js ya las tiene).
    // Para este ejemplo, asumimos que getAuthToken y clearAuthData están disponibles globalmente.

    // Comentamos la redifinición si ya existen globalmente por auth.js
    /*
    function getAuthToken() {
        return localStorage.getItem('authToken');
    }

    function clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser'); // También limpia otros datos de usuario si los guardaste
        // No llamamos a updateNavigationDisplay aquí, eso debería hacerlo auth.js si se carga en la página
    }
    */


    // --- Funciones del Carrito ---

    // Cargar carrito desde localStorage al iniciar
    function loadCart() {
        const storedCart = localStorage.getItem('meloPizzaCart');
        if (storedCart) {
            cart = JSON.parse(storedCart);
            updateCartDisplay(); // Actualiza la vista del carrito al cargar
        }
         // Los mensajes de error de "Elemento no encontrado" para elementos del modal
         // ahora se controlan dentro de showCartModal y el listener de cartItemsDiv
         // ya que cart.js se carga en todas las páginas.
         // Sin embargo, si cartItemsDiv es null al cargar la página (ej. en register.html),
         // updateCartDisplay no debería intentar renderizar nada en él.
         // Podemos añadir un check adicional aquí si es necesario, pero los if dentro
         // de updateCartDisplay ya manejan la mayoría de los casos.
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
           if (totalItems > 0) { cartCountSpan.style.display = 'block'; } else { cartCountSpan.style.display = 'none'; }
        }

        // ** IMPORTANTE: Solo intentar renderizar en cartItemsDiv si existe (estamos en index.html)**
        if (cartItemsDiv) {
             cartItemsDiv.innerHTML = ''; // Limpiar contenido actual del div

             if (cart.length === 0) {
                 // Si el carrito está vacío
                 cartItemsDiv.innerHTML = '<p>El carrito está vacío.</p>';
                 // También verificar si cartTotalSpan y checkoutButton existen antes de interactuar
                 if(cartTotalSpan) cartTotalSpan.textContent = '0'; // Total en 0
                 if(checkoutButton) checkoutButton.disabled = true; // Deshabilita el botón de enviar pedido
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
                             <h4>${item.name} ${item.size ? '(' + item.size + ')' : ''}</h4>
                             <p>Precio unitario: $${item.price.toLocaleString('es-CO')}</p>
                         </div>
                         <div class="cart-item-actions">
                             <div class="quantity-control">
                                 <button class="quantity-button decrease-quantity" data-index="${index}">-</button>
                                 <span class="item-quantity-display">${item.quantity}</span>
                                 <button class="quantity-button increase-quantity" data-index="${index}">+</button>
                             </div>
                             <span class="remove-item" data-index="${index}" title="Eliminar item">
                                 <i class="fas fa-trash"></i>
                             </span>
                         </div>
                     `;
                     cartItemsDiv.appendChild(itemElement); // Añade el item al div del modal

                     total += item.price * item.quantity; // Suma el costo total del item al total general
                 });

                 // También verificar si cartTotalSpan y checkoutButton existen antes de interactuar
                 if(cartTotalSpan) cartTotalSpan.textContent = total.toLocaleString('es-CO'); // Actualiza el total en el modal, formateado
                 if(checkoutButton) checkoutButton.disabled = false; // Habilita el botón de enviar pedido
             }
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
            // Esto puede ocurrir si cart.js se carga en una página sin el modal (ej. auth pages)
            console.warn("Elemento con ID 'cart-modal' no encontrado. El modal del carrito no funcionará en esta página.");
        }
    }

    // Ocultar el modal del carrito
    function hideCartModal() {
          // Verificamos que el modal exista en el DOM
          if (cartModal) {
             cartModal.style.display = 'none'; // Oculta el modal
             // Opcional: Limpiar el formulario y resetear el select al cerrar el modal
             // También verificar si los elementos del formulario existen
             if (checkoutForm) checkoutForm.reset();
             if (paymentMethodSelect) paymentMethodSelect.value = "";
             if (paymentProofInstruction) paymentProofInstruction.style.display = 'none'; // Oculta la instrucción de pago
           }
    }


    // --- Event Listeners (Manejo de Interacciones del Usuario) ---

    // *** Clic en el BOTÓN FLOTANTE (.cart-float) para mostrar el modal ***
    // Verificamos que el botón flotante exista antes de añadir el listener
    if (cartIconButton) {
        cartIconButton.addEventListener('click', showCartModal);
    } else {
        // Esto puede ocurrir si el elemento flotante no está en la página
        console.warn("Elemento con clase '.cart-float' no encontrado. El botón del carrito flotante no funcionará en esta página.");
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
         if (cartModal && event.target === cartModal) { // Asegurarse de que cartModal existe
             hideCartModal(); // Oculta el modal
         }
    });


    // Manejar clics en los botones de cantidad (+/-) y el icono de remover dentro del modal
    // Usamos delegación de eventos en cartItemsDiv (el contenedor de los items del carrito)
    // para no tener que añadir listeners a cada botón individualmente
    // ** IMPORTANTE: Solo añadir este listener si cartItemsDiv existe **
    if (cartItemsDiv) {
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
        // Este mensaje de error solo aparecerá si cart.js se carga en una página sin el div #cart-items
        console.warn("Elemento con ID 'cart-items' no encontrado. El manejo de cantidad y eliminación no funcionará en esta página.");
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
     if (paymentMethodSelect && paymentProofInstruction) { // Asegurarse de que existan
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
        // Este mensaje de advertencia solo aparecerá si cart.js se carga en una página sin estos elementos
        console.warn("Select de forma de pago o instrucción de pago no encontrados. La funcionalidad de instrucciones de pago no funcionará.");
    }


    // --- Manejar Envío del Pedido (Ahora envía al backend y luego WhatsApp si no logueado) ---
    // Verificamos que el botón y los elementos del formulario existan
    // ** IMPORTANTE: Solo añadir este listener si el botón de checkout existe **
    if (checkoutButton && checkoutForm && paymentMethodSelect && shippingAddressInput && shippingNeighborhoodInput && contactPhoneInput) {
        checkoutButton.addEventListener('click', async (event) => { // Marcamos la función como async
            event.preventDefault(); // Prevenir la recarga de la página

            // 1. Validar el formulario HTML5
            if (!checkoutForm.checkValidity()) {
                checkoutForm.reportValidity(); // Muestra los mensajes de error del navegador
                return; // Detiene la ejecución si el formulario no es válido
            }

            // 2. Verificar que el carrito no esté vacío
            if (cart.length === 0) {
                alert('Tu carrito está vacío. Añade algunos productos antes de enviar.');
                return;
            }

            // 3. Obtener el Token JWT
            // Asumimos que la función getAuthToken() está disponible globalmente (proporcionada por auth.js)
            // o la copiamos aquí si auth.js no se carga en esta página.
            // Si auth.js se carga, el orden de los script tags en el HTML es importante.
            const authToken = typeof getAuthToken === 'function' ? getAuthToken() : localStorage.getItem('authToken');


            // Lógica: Si hay TOKEN (usuario logueado), intentar guardar en DB.
            // Si no hay TOKEN (usuario no logueado), proceder solo con WhatsApp.

            // 4. Recolectar datos del pedido y del formulario
            const paymentMethodValue = paymentMethodSelect.value.trim();
            const shippingAddress = shippingAddressInput.value.trim();
            const shippingNeighborhood = shippingNeighborhoodInput.value.trim();
            const contactPhone = contactPhoneInput.value.trim();

            const orderItems = cart.map(item => ({
                name: item.name,
                size: item.size,
                price: item.price,
                quantity: item.quantity
            }));

            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Creamos el objeto orderData con los datos relevantes
            // El userId NO se incluye aquí en el cuerpo porque el backend lo obtiene del token
            const orderData = {
                items: orderItems,
                customerInfo: {
                    paymentMethod: paymentMethodValue,
                    shippingAddress: shippingAddress,
                    shippingNeighborhood: shippingNeighborhood,
                    contactPhone: contactPhone
                },
                totalAmount: total
            };


            // 5. Si hay TOKEN, enviar los datos al backend API protegida
            if (authToken) {
                console.log("Usuario logueado (hay token). Intentando guardar pedido en la base de datos con Token...");
                try {
                    // Deshabilitar el botón mientras se envía
                    checkoutButton.disabled = true;
                    checkoutButton.textContent = 'Enviando a la base de datos...';

                    const response = await fetch(`${backendBaseUrl}/api/orders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            // *** INCLUIR EL TOKEN JWT EN EL HEADER DE AUTORIZACIÓN ***
                            'Authorization': `Bearer ${authToken}` // <<<--- Añade esta línea
                        },
                        body: JSON.stringify(orderData) // Enviamos los datos del pedido
                    });

                    // ** Importante: Manejar respuestas del backend (incluyendo errores de autenticación) **
                     if (response.status === 401 || response.status === 403) {
                         console.warn('Error de autenticación al guardar pedido:', response.status);
                         alert('Tu sesión ha expirado o no estás autorizado. Por favor, inicia sesión de nuevo.');
                         // Asumimos que clearAuthData() está disponible globalmente desde auth.js
                         if (typeof clearAuthData === 'function') {
                              clearAuthData(); // Limpia datos de login
                         } else {
                             console.error("Función clearAuthData no disponible. Limpiando localStorage manualmente.");
                             localStorage.removeItem('authToken');
                             localStorage.removeItem('currentUser');
                         }
                         // Redirigir al login
                         setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                         return; // Detenemos la ejecución
                     }

                    // Si la respuesta no fue un error de autenticación, intentamos parsear el JSON
                    const result = await response.json();


                    if (response.ok) { // Si el backend responde 2xx (éxito al guardar)
                        console.log('Pedido guardado en la base de datos:', result.orderId);
                        alert('¡Pedido guardado exitosamente en la base de datos!');

                        sendOrderViaWhatsAppMessage(orderData); // Puedes llamarla aquí si quieres ambos

                        // Vaciar el carrito y cerrar modal
                        cart = [];
                        saveCart();
                        updateCartDisplay();
                        hideCartModal();

                    } else { // Otro error del backend (ej: 400 Bad Request por validación)
                        console.error('Error del backend al guardar el pedido:', result.message);
                         alert('Error al guardar el pedido en la base de datos: ' + (result.message || 'Error desconocido.'));

                        if (result.errors) { console.error('Errores de validación del pedido (backend):', result.errors); }
                    }

                } catch (error) { // Error de red con el backend
                    console.error('Error de red al intentar guardar el pedido:', error);
                    alert('Error de conexión con el servidor backend. No se pudo guardar el pedido.');

                } finally {
                    // Habilitar el botón de nuevo
                    checkoutButton.disabled = false;
                    checkoutButton.textContent = 'Enviar Pedido por WhatsApp'; // Restaurar texto
                }

            } else { // 6. Si NO hay TOKEN (usuario no logueado)
                console.log("Usuario no logueado (no hay token). Procediendo solo con WhatsApp.");
                // Reutilizamos la función para generar y abrir el mensaje de WhatsApp
                sendOrderViaWhatsAppMessage(orderData); // Llama a la función y le pasamos los datos recolectados

                // Después de enviar por WhatsApp (si lo deseas)
                 cart = [];
                 saveCart();
                 updateCartDisplay();
                 hideCartModal();
            }
        });
    } else {
         // Este mensaje de advertencia solo aparecerá si cart.js se carga en una página sin el botón de checkout
         console.warn("Elementos del formulario o botón de checkout no encontrados. La funcionalidad de envío de pedido no funcionará en esta página.");
    }


    // --- Función para generar y enviar el pedido via WhatsApp (extraída del código anterior y ligeramente adaptada) ---
    // Esta función ahora recibe los datos del pedido como argumento
    function sendOrderViaWhatsAppMessage(orderData) {

        // Construir el mensaje completo para WhatsApp (igual que antes)
        let whatsappMessage = "¡Hola! Tengo un nuevo pedido:\n\n";

        whatsappMessage += "--- Pedido ---\n";
         orderData.items.forEach(item => { // Usamos los items del objeto orderData
              whatsappMessage += `${item.quantity}x ${item.name}${item.size ? ' (' + item.size + ')' : ''} $${(item.price * item.quantity).toLocaleString('es-CO')}\n`;
         });

         whatsappMessage += `*Total: $${orderData.totalAmount.toLocaleString('es-CO')}*\n\n`; // Usamos el total del objeto orderData

         whatsappMessage += "--- Datos del Cliente ---\n";
         whatsappMessage += `Forma de Pago: ${orderData.customerInfo.paymentMethod.charAt(0).toUpperCase() + orderData.customerInfo.paymentMethod.slice(1)}\n`;
         whatsappMessage += `Dirección de Envío: ${orderData.customerInfo.shippingAddress}\n`;
         whatsappMessage += `Barrio: ${orderData.customerInfo.shippingNeighborhood}\n`;
         whatsappMessage += `Celular de Contacto: ${orderData.customerInfo.contactPhone}\n\n`;

        // Añadir instrucción de comprobante si la forma de pago lo requiere
        if (orderData.customerInfo.paymentMethod === 'nequi' || orderData.customerInfo.paymentMethod === 'bancolombia' || orderData.customerInfo.paymentMethod === 'daviplata') {
             whatsappMessage += "Por favor, envía el comprobante de pago para confirmar tu pedido. Pregunta por el costo del domicilio si no lo conoces.\n\n";
        }

        // Codificar y abrir WhatsApp
        const encodedMessage = encodeURIComponent(whatsappMessage);
        // REEMPLAZA '573124674602' CON TU NÚMERO DE WHATSAPP Y CÓDIGO DE PAÍS REAL
        const phoneNumber = '573124674602';
        const whatsappURL = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;

        window.open(whatsappURL, '_blank');

         // Nota: Vaciar carrito y cerrar modal ahora se maneja en el listener principal
         // después de llamar a esta función para usuarios no logueados.
    }


    // --- Inicialización al cargar la página ---
    loadCart(); // Cargar el carrito guardado (si existe) y actualizar la vista


    // *** Opcional: Ocultar el viejo icono del header con JS si el CSS no funciona por algún motivo ***
    // Aunque la mejor práctica es eliminarlo del HTML o usar display: none; en CSS
     const oldHeaderCartIcon = document.querySelector('.cart-icon-container');
     if (oldHeaderCartIcon) {
        oldHeaderCartIcon.style.display = 'none';
     }

    // ** Opcional: Mostrar el nombre de usuario logueado en el header **
    // Esto se haría mejor en auth.js si auth.js se carga en index.html,
    // o en un script que se carga en todas las páginas después de auth.js.
    // Pero como test, puedes añadirlo aquí:
    // const currentUser = localStorage.getItem('currentUser');
    // const welcomeMessageElement = document.querySelector('.welcome-message-container .welcome-message');
    // if (currentUser && welcomeMessageElement) {
    //     try {
    //         const userData = JSON.parse(currentUser);
    //         if (userData.username) { // Si guardaste el username en auth.js
    //             welcomeMessageElement.textContent = `¡Bienvenido, ${userData.username}!`;
    //         } else if (userData.userId) {
    //              welcomeMessageElement.textContent = `¡Bienvenido, usuario ${userData.userId.substring(0, 5)}...!`; // Mostrar parte del ID si no hay username
    //         }
    //     } catch(e) {
    //         console.error("Error al mostrar nombre de usuario:", e);
    //     }
    // }


}); // --- Cierre del DOMContentLoaded listener ---
