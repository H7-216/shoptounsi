// Initialisation du stockage local
function initStorage() {
    if(!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }

    if(!localStorage.getItem('products')) {
        localStorage.setItem('products', JSON.stringify([
            {id: 1, name: "Urne Classique", price: 99.99, stock: 10, image: ""},
            {id: 2, name: "Urne Design", price: 149.99, stock: 5, image: ""},
            {id: 3, name: "Urne Bois", price: 129.99, stock: 8, image: ""}
        ]));
    }

    if(!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify([]));
    }

    if(!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', JSON.stringify(null));
    }
}

// Gestion des utilisateurs
function registerUser(name, email, password) {
    const users = JSON.parse(localStorage.getItem('users'));
    const userExists = users.some(user => user.email === email);
    
    if(userExists) {
        alert("Un utilisateur avec cet email existe déjà");
        return false;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        password, // En production, il faudrait hasher le mot de passe
        cart: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return true;
}

function loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.email === email && u.password === password);
    
    if(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    
    return false;
}

function logoutUser() {
    // Sauvegarder le panier avant de se déconnecter
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if(currentUser) {
        const users = JSON.parse(localStorage.getItem('users'));
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if(userIndex !== -1) {
            users[userIndex].cart = currentUser.cart;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    localStorage.setItem('currentUser', JSON.stringify(null));
}

// Gestion des produits
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products'));
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = '';
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
            <h3>${product.name}</h3>
            <p>Prix: ${product.price}€</p>
            <p>Stock: ${product.stock}</p>
            <button onclick="addToCart(${product.id})">Ajouter au panier</button>
        `;
        productGrid.appendChild(productElement);
    });
}

// Gestion du panier
function addToCart(productId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if(!currentUser) {
        alert("Veuillez vous connecter pour ajouter des articles au panier");
        document.getElementById('login-btn').click();
        return;
    }
    
    const products = JSON.parse(localStorage.getItem('products'));
    const product = products.find(p => p.id === productId);
    
    if(!product || product.stock <= 0) {
        alert("Produit indisponible");
        return;
    }
    
    const userCartItem = currentUser.cart.find(item => item.productId === productId);
    
    if(userCartItem) {
        userCartItem.quantity += 1;
    } else {
        currentUser.cart.push({
            productId,
            quantity: 1,
            price: product.price,
            name: product.name
        });
    }
    
    // Mettre à jour le stock
    product.stock -= 1;
    
    // Sauvegarder les modifications
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('products', JSON.stringify(products));
    
    updateCartDisplay();
    loadProducts(); // Recharger pour afficher le nouveau stock
}

function updateCartDisplay() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const cartItemsElement = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    if(!currentUser || currentUser.cart.length === 0) {
        cartItemsElement.innerHTML = '<p>Votre panier est vide</p>';
        cartTotalElement.textContent = 'Total: 0€';
        return;
    }
    
    cartItemsElement.innerHTML = '';
    let total = 0;
    
    currentUser.cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <p>${item.name} x${item.quantity}</p>
            <p>${(item.price * item.quantity).toFixed(2)}€</p>
            <button onclick="removeFromCart(${item.productId})">Retirer</button>
        `;
        cartItemsElement.appendChild(itemElement);
        total += item.price * item.quantity;
    });
    
    cartTotalElement.textContent = `Total: ${total.toFixed(2)}€`;
}

function removeFromCart(productId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if(!currentUser) return;
    
    const cartItemIndex = currentUser.cart.findIndex(item => item.productId === productId);
    if(cartItemIndex === -1) return;
    
    const cartItem = currentUser.cart[cartItemIndex];
    const products = JSON.parse(localStorage.getItem('products'));
    const product = products.find(p => p.id === productId);
    
    // Remettre le produit en stock
    product.stock += cartItem.quantity;
    
    // Retirer du panier
    currentUser.cart.splice(cartItemIndex, 1);
    
    // Sauvegarder les modifications
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('products', JSON.stringify(products));
    
    updateCartDisplay();
    loadProducts();
}

function checkout() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if(!currentUser || currentUser.cart.length === 0) {
        alert("Votre panier est vide ou vous n'êtes pas connecté");
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem('orders'));
    const newOrder = {
        id: Date.now(),
        userId: currentUser.id,
        items: [...currentUser.cart],
        date: new Date().toISOString(),
        total: currentUser.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Vider le panier
    currentUser.cart = [];
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    alert(`Commande passée avec succès! Total: ${newOrder.total.toFixed(2)}€`);
    updateCartDisplay();
}

// Gestion de l'interface utilisateur
function updateUserUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userGreeting = document.getElementById('user-greeting');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if(currentUser) {
        userGreeting.textContent = `Bonjour, ${currentUser.name}`;
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        userGreeting.textContent = '';
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
    
    updateCartDisplay();
}

// Gestion des modals
function setupModals() {
    // Modal de connexion
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.getElementById('login-btn');
    const loginClose = loginModal.querySelector('.close');
    
    loginBtn.onclick = function() {
        loginModal.style.display = 'block';
    };
    
    loginClose.onclick = function() {
        loginModal.style.display = 'none';
    };
    
    document.getElementById('login-form').onsubmit = function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if(loginUser(email, password)) {
            loginModal.style.display = 'none';
            updateUserUI();
        } else {
            alert("Email ou mot de passe incorrect");
        }
    };
    
    // Modal d'inscription
    const registerModal = document.getElementById('register-modal');
    const registerBtn = document.getElementById('register-btn');
    const registerClose = registerModal.querySelector('.close');
    
    registerBtn.onclick = function() {
        registerModal.style.display = 'block';
    };
    
    registerClose.onclick = function() {
        registerModal.style.display = 'none';
    };
    
    document.getElementById('register-form').onsubmit = function(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        
        if(registerUser(name, email, password)) {
            registerModal.style.display = 'none';
            loginUser(email, password);
            updateUserUI();
        }
    };
    
    // Bouton de déconnexion
    document.getElementById('logout-btn').onclick = function() {
        logoutUser();
        updateUserUI();
    };
    
    // Bouton de commande
    document.getElementById('checkout-btn').onclick = checkout;
    
    // Fermer les modals en cliquant à l'extérieur
    window.onclick = function(event) {
        if(event.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if(event.target === registerModal) {
            registerModal.style.display = 'none';
        }
    };
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initStorage();
    loadProducts();
    setupModals();
    updateUserUI();
});