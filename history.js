// history.js

document.addEventListener('DOMContentLoaded', () => {

    // --- URLs de las APIs de tu Backend ---
    const backendBaseUrl = 'http://localhost:3000'; // Asegúrate de que esta URL sea correcta

    // --- Elemento donde se mostrará la lista de pedidos ---
    const ordersListDiv = document.getElementById('orders-list');

    // --- Obtener el token JWT y el ID del usuario logueado ---
    // Dependemos de que auth.js se haya cargado primero y haya guardado el token/userId en localStorage
     function getAuthToken() {
         return localStorage.getItem('authToken');
     }

    function getLoggedInUserId() {
         const currentUser = localStorage.getItem('currentUser');
         if (currentUser) {
             try {
                 const userData = JSON.parse(currentUser);
                 return userData.userId;
             } catch (e) {
                 console.error("Error parseando userData de localStorage:", e);
                 return null;
             }
         }
         return null;
    }

    // --- Función para mostrar mensajes en el div de historial ---
    function displayHistoryMessage(message) {
        if (ordersListDiv) {
            ordersListDiv.innerHTML = `<p>${message}</p>`;
        }
    }

    // --- Función principal para cargar y mostrar el historial de pedidos ---
    async function loadPurchaseHistory() {
        const userId = getLoggedInUserId(); // Obtiene el ID del usuario logueado
        const authToken = getAuthToken(); // *** OBTENER EL TOKEN ***

        if (!userId || !authToken) { // *** Verificamos que haya tanto userId como Token ***
            // Si no hay usuario logueado O no hay token, mostramos mensaje y no intentamos cargar
            console.log("Usuario no logueado o sin token. No se puede cargar historial.");
            displayHistoryMessage('Por favor, inicia sesión para ver tu historial de compras.');
            // Opcional: Redirigir a la página de login
             // setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            return; // Salimos de la función
        }

        // Si el usuario está logueado y hay token, mostramos un mensaje de carga
        displayHistoryMessage('Cargando historial...');

        try {
            // 1. Hacer la solicitud al backend para obtener los pedidos del usuario
            // Enviamos el ID del usuario en la URL, pero el backend usará el ID DEL TOKEN
            const response = await fetch(`${backendBaseUrl}/api/users/${userId}/orders`, { // Seguimos enviando userId en URL por consistencia/ejemplo
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // *** INCLUIR EL TOKEN JWT EN EL HEADER DE AUTORIZACIÓN ***
                    'Authorization': `Bearer ${authToken}` // <<<--- Añade esta línea
                },
            });

            // *** Manejar la respuesta, incluyendo errores de autenticación (401/403) ***
             if (response.status === 401 || response.status === 403) {
                 console.warn('Error de autenticación al cargar historial:', response.status);
                 displayHistoryMessage('Tu sesión ha expirado o no estás autorizado. Por favor, inicia sesión de nuevo.');
                 clearAuthData(); // Limpia datos de login (función de auth.js)
                 // Retraso opcional antes de redirigir
                 setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                 return; // Detenemos la ejecución
             }


            const data = await response.json(); // Parsear la respuesta JSON (si no hubo error 401/403)


            if (response.ok) { // Si el backend responde 2xx (éxito)
                console.log('Historial de pedidos recibido:', data);

                // 2. Mostrar la lista de pedidos en el div ordersListDiv
                if (data.length === 0) {
                    displayHistoryMessage('Aún no has realizado ningún pedido.');
                } else {
                    ordersListDiv.innerHTML = ''; // Limpiar contenido de carga

                    data.forEach(order => {
                        const orderElement = document.createElement('div');
                        orderElement.classList.add('order-item');

                         const orderDate = new Date(order.createdAt).toLocaleString('es-CO', {
                             year: 'numeric', month: 'long', day: 'numeric',
                             hour: '2-digit', minute: '2-digit'
                         });

                        let itemsHtml = '<ul class="items-list">';
                        order.items.forEach(item => {
                            itemsHtml += `<li>${item.quantity}x ${item.name}${item.size ? ' (' + item.size + ')' : ''} - $${(item.price * item.quantity).toLocaleString('es-CO')}</li>`;
                        });
                        itemsHtml += '</ul>';

                        orderElement.innerHTML = `
                            <h3>Pedido #${order._id.substring(0, 8)}... - Fecha: ${orderDate}</h3>
                            <p>Total: <strong>$${order.totalAmount.toLocaleString('es-CO')}</strong></p>
                            <p>Estado: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                            <p>Dirección: ${order.customerInfo.shippingAddress}, ${order.customerInfo.shippingNeighborhood || 'N/A'}</p>
                            <p>Forma de Pago: ${order.customerInfo.paymentMethod}</p>
                             <p>Teléfono: ${order.customerInfo.contactPhone}</p>
                            <h4>Detalles del Pedido:</h4>
                            ${itemsHtml}
                        `;
                        ordersListDiv.appendChild(orderElement);
                    });
                }

            } else { // Si el backend respondió con otro tipo de error (ej: 500)
                console.error('Error del backend al cargar el historial:', data.message);
                displayHistoryMessage('Error al cargar tu historial: ' + (data.message || 'Error desconocido.'));
            }

        } catch (error) { // Error de red
            console.error('Error de red al intentar cargar el historial:', error);
            displayHistoryMessage('Error de conexión con el servidor. No se pudo cargar el historial.');
        }
    }

    // --- Opcional: Implementar el botón de Cerrar Sesión (Si history.js se carga globalmente o después de auth.js) ---
    // Si auth.js ya maneja esto y se carga en todas las páginas, puedes eliminar este bloque.
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (event) => {
            event.preventDefault();
            clearAuthData(); // Llama a la función de auth.js para limpiar los datos
            alert('Has cerrado sesión.');
            window.location.href = 'index.html';
        });
    }


    // --- Opcional: Mostrar/Ocultar enlaces de navegación según el estado de login ---
    // Si auth.js ya maneja esto y se carga en todas las páginas, puedes eliminar este bloque.
     const userId = getLoggedInUserId();
     const requiresLoginElements = document.querySelectorAll('.requires-login');
     const showIfNotLoggedInElements = document.querySelectorAll('.show-if-not-logged-in');

     if (userId) {
         requiresLoginElements.forEach(el => el.style.display = 'list-item');
         showIfNotLoggedInElements.forEach(el => el.style.display = 'none');
     } else {
         requiresLoginElements.forEach(el => el.style.display = 'none');
         showIfNotLoggedInElements.forEach(el => el.style.display = 'list-item');
     }


    // --- Inicialización ---
    // Llamar a la función principal para cargar el historial al cargar la página
    loadPurchaseHistory();


     // Nota: Si tienes el botón flotante del carrito y el modal en history.html,
     // necesitarás asegurarte de que cart.js también se carga y que sus selectores
     // de elementos sean robustos (como los modificamos antes).

}); // --- Cierre del DOMContentLoaded listener ---
