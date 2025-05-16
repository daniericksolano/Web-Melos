// auth.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Selección de Elementos del DOM ---
    const registerForm = document.getElementById('register-form');
    const registerMessageDiv = document.getElementById('register-message');

    const loginForm = document.getElementById('login-form');
    const loginMessageDiv = document.getElementById('login-message');

    // Elementos de navegación que mostraremos/ocultaremos
    const requiresLoginElements = document.querySelectorAll('.requires-login'); // Elementos como "Historial", "Cerrar Sesión"
    const showIfNotLoggedInElements = document.querySelectorAll('.show-if-not-logged-in'); // Elementos como "Iniciar Sesión", "Registrarse"
    const logoutLink = document.getElementById('logout-link'); // Enlace/botón de Cerrar Sesión

    // Elemento donde se mostrará el mensaje de bienvenida en el header
    const welcomeMessageElement = document.querySelector('.welcome-message-container .welcome-message'); // <<<--- Añadimos selector


    // --- URLs de las APIs de tu Backend ---
    const backendBaseUrl = 'http://localhost:3000'; // Asegúrate de que esta URL sea correcta


    // --- Gestión del Estado de Autenticación (Token y Datos de Usuario) ---

    // Guarda el token y los datos del usuario (incluyendo username) en localStorage
    // AHORA RECIBE EL NOMBRE DE USUARIO
    function saveAuthData(token, userId, username) { // <<<--- Añadimos username aquí
        localStorage.setItem('authToken', token); // Guardamos el token
        // Guardamos los datos básicos del usuario como un objeto JSON
        localStorage.setItem('currentUser', JSON.stringify({
             userId: userId,
             username: username // <<<--- ¡Guardamos el nombre de usuario!
        }));
        updateNavigationDisplay(); // Actualiza la vista de la navegación y mensaje
    }

    // Obtiene el token JWT de localStorage
    function getAuthToken() {
        return localStorage.getItem('authToken');
    }

    // Obtiene los datos del usuario logueado (incluyendo userId y username) de localStorage
    function getLoggedInUserData() {
         const currentUser = localStorage.getItem('currentUser');
         if (currentUser) {
             try {
                 const userData = JSON.parse(currentUser);
                 // Devuelve el objeto con userId y username
                 return userData;
             } catch (e) {
                 console.error("Error parseando userData de localStorage:", e);
                 return null; // Devuelve null si hay error parseando
             }
         }
         return null; // Devuelve null si no hay datos de usuario en localStorage
    }


    // Limpia los datos de autenticación de localStorage (para cerrar sesión)
    function clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser'); // Limpia los datos del usuario
        updateNavigationDisplay(); // Actualiza la vista de la navegación y mensaje
    }

    // Función para actualizar la visibilidad de los enlaces de navegación Y EL MENSAJE DE BIENVENIDA
    function updateNavigationDisplay() {
        const authToken = getAuthToken(); // Verificamos si hay un token
        const userData = getLoggedInUserData(); // <<<--- Obtenemos los datos del usuario

        if (authToken && userData && userData.userId) { // Verificamos que haya token y datos básicos de usuario
            // Usuario logueado
            requiresLoginElements.forEach(el => el.style.display = 'list-item'); // Mostrar enlaces "requires-login" (ajusta 'list-item' si usas otro display)
            showIfNotLoggedInElements.forEach(el => el.style.display = 'none'); // Ocultar enlaces "show-if-not-logged-in"

            // *** ACTUALIZAR EL MENSAJE DE BIENVENIDA ***
            if (welcomeMessageElement) {
                const username = userData.username || 'Usuario'; // Usar 'Usuario' si por alguna razón no hay username
                // Construimos el mensaje personalizado
                welcomeMessageElement.textContent = `¡BIENVENID@ ${username} A MELO'S PIZZA!`;
            }


        } else {
            // Usuario no logueado
            requiresLoginElements.forEach(el => el.style.display = 'none'); // Ocultar enlaces "requires-login"
            showIfNotLoggedInElements.forEach(el => el.style.display = 'list-item'); // Mostrar enlaces "show-if-not-logged-in" (ajusta 'list-item')

            // *** RESTAURAR EL MENSAJE DE BIENVENIDA GENÉRICO ***
             if (welcomeMessageElement) {
                 welcomeMessageElement.textContent = 'Tu Historial de Compras'; // O el mensaje genérico que tengas en history.html header
                 // Puedes poner un mensaje genérico diferente en otras páginas si el elemento existe
                 // Ej: if (document.body.classList.contains('home-page')) welcomeMessageElement.textContent = '¡Bienvenido a Melo\'s Pizza!';
             }
        }
    }


    // --- Funciones para mostrar/ocultar mensajes (reutilizamos las que tenías) ---
    function showMessage(messageDiv, message, isSuccess = false) {
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = 'message'; // Resetear clases
            if (isSuccess) {
                messageDiv.classList.add('success');
            } else {
                messageDiv.classList.add('error');
            }
            messageDiv.style.display = 'block'; // Mostrar el div de mensaje
        }
    }

    function hideMessage(messageDiv) {
        if (messageDiv) {
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
            messageDiv.className = 'message'; // Resetear clases
        }
    }


    // --- Manejar Envío del Formulario de Registro ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(registerMessageDiv);

            const usernameInput = document.getElementById('register-username');
            const emailInput = document.getElementById('register-email');
            const passwordInput = document.getElementById('register-password');

            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !email || !password) {
                 showMessage(registerMessageDiv, 'Por favor, completa todos los campos.', false);
                 return;
            }

            try {
                const response = await fetch(`${backendBaseUrl}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await response.json();

                if (response.ok) {
                    showMessage(registerMessageDiv, data.message, true);
                    registerForm.reset();
                    // Redirigir al login después de un registro exitoso
                    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                } else {
                    showMessage(registerMessageDiv, data.message || 'Error desconocido al registrar.', false);
                     if (data.errors) { console.error('Errores de validación del backend:', data.errors); }
                }
            } catch (error) {
                console.error('Error de red al intentar registrar:', error);
                showMessage(registerMessageDiv, 'Error de conexión. Asegúrate de que el servidor backend esté funcionando.', false);
            }
        });
    }


    // --- Manejar Envío del Formulario de Login ---
    if (loginForm) {
         loginForm.addEventListener('submit', async (event) => {
             event.preventDefault();
             hideMessage(loginMessageDiv);

             const usernameOrEmailInput = document.getElementById('login-username-email');
             const passwordInput = document.getElementById('login-password');

             const usernameOrEmail = usernameOrEmailInput.value.trim();
             const password = passwordInput.value.trim();

             if (!usernameOrEmail || !password) {
                  showMessage(loginMessageDiv, 'Por favor, ingresa usuario/correo y contraseña.', false);
                  return;
             }

             try {
                 const response = await fetch(`${backendBaseUrl}/api/login`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ usernameOrEmail, password })
                 });

                 const data = await response.json();

                 if (response.ok) { // Si el login fue exitoso
                     showMessage(loginMessageDiv, data.message, true);

                     // *** GUARDAR EL TOKEN JWT, USERID Y USERNAME ***
                     // Verificamos que la respuesta incluya los datos necesarios
                     if (data.token && data.userId && data.username) { // <<<--- AHORA ESPERAMOS data.username
                          saveAuthData(data.token, data.userId, data.username); // <<<--- Pasamos username a saveAuthData
                          console.log('Login exitoso. Token, userId y username guardados.');
                          // Redirigir a la página principal (o a otra página después del login)
                          setTimeout(() => { window.location.href = 'index.html'; }, 1500); // Redirigir después de 1.5 segundos

                     } else {
                         // Si la respuesta de éxito no incluyó el token/userId/username
                         console.error('Login exitoso, pero faltan token, userId o username en la respuesta del backend.');
                         showMessage(loginMessageDiv, 'Inicio de sesión exitoso, pero faltan datos de sesión.', false);
                     }

                 } else { // Si el backend respondió con un error (ej: 401)
                      showMessage(loginMessageDiv, data.message || 'Error desconocido al iniciar sesión.', false);
                 }

             } catch (error) {
                 console.error('Error de red al intentar iniciar sesión:', error);
                 showMessage(loginMessageDiv, 'Error de conexión. Asegúrate de que el servidor backend esté funcionando.', false);
             }
         });
    }

    // --- Manejar Clic en el Enlace de Cerrar Sesión ---
     if (logoutLink) {
        logoutLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevenir el comportamiento por defecto del enlace
            clearAuthData(); // Eliminar token y datos de usuario
            alert('Has cerrado sesión.'); // Mensaje al usuario
            // Redirigir a la página principal o de login
            window.location.href = 'index.html';
        });
     }


    // --- Inicialización ---
    // Actualizar la visualización de la navegación y el mensaje de bienvenida al cargar la página
     updateNavigationDisplay();

}); // --- Cierre del DOMContentLoaded listener ---
