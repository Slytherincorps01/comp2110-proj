document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const orderForm = document.getElementById('orderForm');
    const ordersList = document.getElementById('ordersList');
    const quantityContainer = document.getElementById('quantityContainer');
    const orderTypeRadios = document.querySelectorAll('input[name="orderType"]');
    const adminToggle = document.getElementById('admin-toggle');
    
    // State
    let adminMode = false;
    const ownerEmail = 'julioagapito119@gmail.com';
    
    // Initialize
    initEventListeners();
    loadOrders();
    
    function initEventListeners() {
        // Admin toggle
        adminToggle.addEventListener('click', toggleAdminView);
        
        // Order type selection
        orderTypeRadios.forEach(radio => {
            radio.addEventListener('change', handleOrderTypeChange);
        });
        
        // Form submission
        orderForm.addEventListener('submit', handleFormSubmit);
    }
    
    function toggleAdminView() {
        adminMode = !adminMode;
        adminToggle.style.opacity = adminMode ? '1' : '0.7';
        adminToggle.title = adminMode ? 'Admin Mode (Hide Names)' : 'Admin Mode (Show Names)';
        loadOrders();
    }
    
    function handleOrderTypeChange() {
        const isPiece = this.value === 'piece';
        quantityContainer.querySelector('label').textContent = 
            isPiece ? 'Number of Cookies' : 'Number of Tubs';
        document.getElementById('quantity').max = isPiece ? '100' : '20';
        document.getElementById('quantity').value = isPiece ? '6' : '1';
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        const quantity = document.getElementById('quantity').value;
        const specialRequests = document.getElementById('special-requests').value.trim();
        
        // Validate
        if (!name || !quantity) {
            showAlert('Please fill in all required fields');
            return;
        }
        
        // Create order
        const order = createOrder(name, orderType, quantity, specialRequests);
        
        // Process order
        processOrder(order);
        
        // Reset form
        resetForm();
        
        // Show confirmation
        showOrderConfirmation(order);
    }
    
    function createOrder(name, orderType, quantity, specialRequests) {
        return {
            name,
            item: "Chocolate Chip Cookies",
            orderType,
            quantity,
            unit: orderType === 'piece' ? 'pieces' : 'tubs',
            specialRequests: specialRequests || 'None',
            timestamp: new Date().toISOString(),
            status: 'Received'
        };
    }
    
    function processOrder(order) {
        addOrderToDisplay(order);
        saveOrder(order);
        sendOrderNotification(order);
    }
    
    function addOrderToDisplay(order) {
        // Remove "no orders" message if exists
        const noOrdersMsg = ordersList.querySelector('.no-orders');
        if (noOrdersMsg) noOrdersMsg.remove();
        
        // Create order card
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        // Format date
        const orderDate = new Date(order.timestamp);
        const formattedDate = orderDate.toLocaleString();
        
        // Generate order ID
        const orderId = 'ORD-' + order.timestamp.slice(-6).replace(/\D/g, '');
        
        // Create HTML
        orderCard.innerHTML = `
            <h3>${adminMode ? order.name : orderId}</h3>
            <p><strong>Status:</strong> <span class="status-${order.status.toLowerCase()}">${order.status}</span></p>
            <p><strong>Cookie Type:</strong> ${order.item}</p>
            <p><strong>Quantity:</strong> ${order.quantity} ${order.unit}</p>
            ${order.specialRequests !== 'None' ? `<p><strong>Notes:</strong> ${order.specialRequests}</p>` : ''}
            <p class="order-time">Ordered: ${formattedDate}</p>
            ${adminMode ? `<button class="status-btn" data-id="${order.timestamp}">Mark as Ready</button>` : ''}
        `;
        
        // Add to top of list
        ordersList.insertBefore(orderCard, ordersList.firstChild);
        
        // Add event listener if admin mode
        if (adminMode) {
            orderCard.querySelector('.status-btn').addEventListener('click', function() {
                updateOrderStatus(order.timestamp, 'Ready');
            });
        }
    }
    
    function saveOrder(order) {
        try {
            const orders = JSON.parse(localStorage.getItem('lolaCookieOrders')) || [];
            orders.unshift(order);
            localStorage.setItem('lolaCookieOrders', JSON.stringify(orders));
        } catch (error) {
            console.error('Error saving order:', error);
            showAlert('Error saving your order. Please try again.');
        }
    }
    
    function loadOrders() {
    try {
        // Check if localStorage is available
        if (!window.localStorage) {
            throw new Error("localStorage not available");
        }

        // Get orders with the correct key
        const ordersData = localStorage.getItem('lolaCookieOrders');
        
        // If no orders exist, show empty state
        if (!ordersData) {
            ordersList.innerHTML = '<p class="no-orders">No orders yet. Be the first to order!</p>';
            return;
        }

        // Parse the orders
        const orders = JSON.parse(ordersData);
        
        // Validate the orders array
        if (!Array.isArray(orders)) {
            throw new Error("Invalid orders data format");
        }

        // Clear current orders
        ordersList.innerHTML = '';

        // Display orders
        if (orders.length === 0) {
            ordersList.innerHTML = '<p class="no-orders">No orders yet. Be the first to order!</p>';
        } else {
            orders.forEach(order => addOrderToDisplay(order));
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<p class="error-message">⚠️ Error loading orders. Please refresh the page.</p>';
        
        // Optional: Clear corrupted data
        localStorage.removeItem('lolaCookieOrders');
    }
}
    
    function updateOrderStatus(timestamp, newStatus) {
        try {
            const orders = JSON.parse(localStorage.getItem('lolaCookieOrders')) || [];
            const orderIndex = orders.findIndex(o => o.timestamp === timestamp);
            
            if (orderIndex !== -1) {
                orders[orderIndex].status = newStatus;
                localStorage.setItem('lolaCookieOrders', JSON.stringify(orders));
                loadOrders();
                
                if (newStatus === 'Ready') {
                    notifyCustomer(orders[orderIndex]);
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }
    
    async function sendOrderNotification(order) {
        try {
            const formData = new FormData();
            formData.append('_replyto', ownerEmail);
            formData.append('_subject', `New Order from ${order.name}`);
            formData.append('message', `
                New Cookie Order:
                Name: ${order.name}
                Item: ${order.item}
                Quantity: ${order.quantity} ${order.unit}
                Special Requests: ${order.specialRequests}
                Time: ${new Date(order.timestamp).toLocaleString()}
            `);
            
            await fetch(`https://formsubmit.co/ajax/${ownerEmail}`, {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.error('Notification failed:', error);
        }
    }
    
    function notifyCustomer(order) {
        console.log(`Order ready notification for ${order.name}`);
        // In a real app, implement SMS/email notification here
    }
    
    function resetForm() {
        orderForm.reset();
        document.querySelector('input[name="orderType"][value="tub"]').checked = true;
        quantityContainer.querySelector('label').textContent = 'Number of Tubs';
        document.getElementById('quantity').max = '20';
        document.getElementById('quantity').value = '1';
    }
    
    function showOrderConfirmation(order) {
        const orderId = 'ORD-' + order.timestamp.slice(-6).replace(/\D/g, '');
        showAlert(`Thank you!\nYour order #${orderId} for ${order.quantity} ${order.unit} has been placed!`);
    }
    
    function showAlert(message) {
        alert(message);
    }
});
