// cart.js

document.addEventListener('DOMContentLoaded', () => {
    const cartIcon = document.querySelector('.cart-icon-container');
    const cartCountSpan = document.getElementById('cart-count');
    const cartModal = document.getElementById('cart-modal');
    const closeButton = document.querySelector('.close-button');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total-price');
    const checkoutButton = document.getElementById('checkout-button');

    // Nuevos elementos del formulario
    const paymentMethodSelect = document.getElementById('payment-method');
    const paymentProofInstruction = document.getElementById('payment-proof-instruction');
    const shippingAddressInput = document.getElementById('shipping-address');
    const shippingNeighborhoodInput = document.getElementById('shipping-neighborhood');
    const contactPhoneInput = document.getElementById('contact-phone');
    const checkoutForm = document.getElementById('checkout-form');


    let cart = []; // Array para almacenar los items del carrito

    // --- Funciones del Carrito ---

    // Cargar carrito desde localStorage
    function loadCart() {
        const storedCart = localStorage.getItem('meloPizzaCart');
        if (storedCart) {
            cart = JSON.parse(storedCart);
            updateCartDisplay(); // Actualiza la vista al cargar la página
        }
    }

    // Guardar carrito en localStorage
    function saveCart() {
        localStorage.setItem('meloPizzaCart', JSON.stringify(cart));
    }

    // Añadir un item al carrito
    function addItemToCart(name, size, price) {
        const existingItemIndex = cart.findIndex(item => item.name === name && item.size === size);

        if (existingItemIndex > -1) {
            // Si el item ya existe, incrementa la cantidad
            cart[existingItemIndex].quantity++;
        } else {
            // Si el item no existe, añádelo con cantidad 1
            cart.push({ name, size, price, quantity: 1 });
        }

        saveCart();
        updateCartDisplay();
        // *** Eliminamos la llamada a showCartModal() aquí ***
    }

    // Remover un item del carrito
    function removeItemFromCart(index) {
        cart.splice(index, 1); // Remueve el item en el índice dado
        saveCart();
        updateCartDisplay();
    }

    // Actualizar la cantidad de un item
    function updateItemQuantity(index, newQuantity) {
        if (newQuantity < 1) {
            // Si la nueva cantidad es menor a 1, removemos el item
            removeItemFromCart(index);
        } else {
            cart[index].quantity = newQuantity;
            saveCart();
            updateCartDisplay();
        }
    }


    // Actualizar la vista del carrito (icono y modal)
    function updateCartDisplay() {
        // Actualizar contador en el icono
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountSpan.textContent = totalItems;

        // Renderizar items en el modal
        cartItemsDiv.innerHTML = ''; // Limpiar contenido actual

        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p>El carrito está vacío.</p>';
            cartTotalSpan.textContent = '0';
            checkoutButton.disabled = true; // Deshabilita el botón de pago si el carrito está vacío
        } else {
            let total = 0;
            cart.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                // *** Estructura HTML modificada para control de cantidad y icono de papelera ***
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
                        <span class="remove-item" data-index="${index}" title="Eliminar">
                            <i class="fas fa-trash"></i> </span>
                    </div>
                `;
                cartItemsDiv.appendChild(itemElement);

                total += item.price * item.quantity;
            });

            cartTotalSpan.textContent = total.toLocaleString('es-CO');
            checkoutButton.disabled = false; // Habilita el botón de pago
        }
    }

    // Mostrar el modal del carrito
    function showCartModal() {
        cartModal.style.display = 'block';
         // Cargar el carrito en el modal cada vez que se abre
         updateCartDisplay(); // Asegura que la vista esté actualizada
    }

    // Ocultar el modal del carrito
    function hideCartModal() {
        cartModal.style.display = 'none';
         // Limpiar el formulario al cerrar el modal (opcional)
         checkoutForm.reset();
         paymentMethodSelect.value = ""; // Resetear select
         paymentProofInstruction.style.display = 'none'; // Oculta la instrucción de pago al cerrar
    }

    // --- Event Listeners ---

    // Clic en las opciones de precio (Pizza y otros items)
    document.querySelectorAll('.price-option, .single-price-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.name;
            const size = item.dataset.size || null;
            const price = parseInt(item.dataset.price);

            if (!isNaN(price)) {
                addItemToCart(name, size, price);
                // Mensaje de confirmación opcional
                // alert(`${name} ${size ? '(' + size + ')' : ''} añadido al carrito!`);
            } else {
                console.error('Precio no válido para el item:', item.dataset);
                alert('Error al añadir el producto. Precio no válido.');
            }
        });
    });


    // Clic en el icono del carrito para mostrar el modal
    cartIcon.addEventListener('click', showCartModal);

    // Clic en el botón de cerrar el modal
    closeButton.addEventListener('click', hideCartModal);

    // Clic fuera del modal para cerrarlo
    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            hideCartModal();
        }
    });

    // Eventos para controles de cantidad y remover item (usando delegación en cartItemsDiv)
    cartItemsDiv.addEventListener('click', (event) => {
        const target = event.target;
        const index = target.dataset.index; // Obtiene el índice del data-attribute

        if (target.classList.contains('increase-quantity')) {
            // Aumentar cantidad
            if (index !== undefined) {
                 const currentQuantity = cart[index].quantity;
                 updateItemQuantity(index, currentQuantity + 1);
            }
        } else if (target.classList.contains('decrease-quantity')) {
            // Disminuir cantidad (o remover si llega a 0)
             if (index !== undefined) {
                const currentQuantity = cart[index].quantity;
                updateItemQuantity(index, currentQuantity - 1); // updateItemQuantity maneja si llega a 0
            }
        } else if (target.classList.contains('remove-item') || target.closest('.remove-item')) {
            // Remover item (maneja clic en el span o el icono dentro)
            const removeButton = target.classList.contains('remove-item') ? target : target.closest('.remove-item');
             const removeIndex = removeButton.dataset.index;
             if (removeIndex !== undefined) {
                 removeItemFromCart(parseInt(removeIndex));
             }
        }
    });


    // Mostrar/ocultar instrucción de pago al cambiar la forma de pago
    paymentMethodSelect.addEventListener('change', () => {
        const selectedMethod = paymentMethodSelect.value;
        if (selectedMethod === 'nequi' || selectedMethod === 'bancolombia' || selectedMethod === 'daviplata') {
            paymentProofInstruction.style.display = 'block';
        } else {
            paymentProofInstruction.style.display = 'none';
        }
    });


    // Clic en el botón de Enviar Pedido por WhatsApp
    checkoutButton.addEventListener('click', () => {
        // Validar formulario antes de proceder
        if (!checkoutForm.checkValidity()) {
            checkoutForm.reportValidity();
            return;
        }

        if (cart.length === 0) {
            alert('Tu carrito está vacío.');
            return;
        }

        // --- Recolectar datos del formulario ---
        const paymentMethodValue = paymentMethodSelect.value;
        const shippingAddress = shippingAddressInput.value.trim();
        const shippingNeighborhood = shippingNeighborhoodInput.value.trim();
        const contactPhone = contactPhoneInput.value.trim();

        // --- Construir el mensaje completo para WhatsApp (Formato más conciso) ---
        let whatsappMessage = "¡Hola! Nuevo pedido:\n\n";

        whatsappMessage += "--- Pedido ---\n";
        cart.forEach(item => {
            whatsappMessage += `${item.quantity}x ${item.name}${item.size ? ' (' + item.size + ')' : ''} $${(item.price * item.quantity).toLocaleString('es-CO')}\n`;
        });

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        whatsappMessage += `*Total: $${total.toLocaleString('es-CO')}*\n\n`;

        whatsappMessage += "--- Cliente ---\n";
        whatsappMessage += `Pago: ${paymentMethodValue.charAt(0).toUpperCase() + paymentMethodValue.slice(1)}\n`;
        whatsappMessage += `Envío: ${shippingAddress}, ${shippingNeighborhood}\n`;
        whatsappMessage += `Celular: ${contactPhone}\n\n`;

        // Añadir instrucción de comprobante si aplica
        if (paymentMethodValue === 'nequi' || paymentMethodValue === 'bancolombia' || paymentMethodValue === 'daviplata') {
             whatsappMessage += "Favor preguntar por el costo del domicilio antes de hacer el pago y enviar comprobante de pago para preparar su pedido.\n\n";
        }

        // --- Codificar el mensaje para la URL ---
        const encodedMessage = encodeURIComponent(whatsappMessage);

        // --- Construir la URL de WhatsApp (Usando la API directa - REEMPLAZA CON TU NÚMERO) ---
        const phoneNumber = '573124674602'; // <-- ¡REEMPLAZA ESTO CON TU NÚMERO Y CÓDIGO DE PAÍS! (Ej: '573124674602')
        const whatsappURL = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;

        console.log("Generated WhatsApp URL:", whatsappURL);
        console.log("Message Length:", whatsappMessage.length);
        console.log("Encoded Message Length:", encodedMessage.length);


        // --- Redirigir a WhatsApp ---
        window.open(whatsappURL, '_blank');

        // --- Opcional: Vaciar el carrito y cerrar modal ---
        cart = [];
        saveCart();
        updateCartDisplay();
        hideCartModal();
    });


    // --- Inicialización ---
    loadCart(); // Cargar carrito al cargar la página
});