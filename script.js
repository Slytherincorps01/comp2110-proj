document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const ordersList = document.getElementById('ordersList');
    const quantityContainer = document.getElementById('quantityContainer');
    const orderTypeRadios = document.querySelectorAll('input[name="orderType"]');
    const adminToggle = document.getElementById('admin-toggle');
    
    let adminMode = false;
    
    // Toggle admin view
    adminToggle.addEventListener('click', function() {
        adminMode = !adminMode;
        loadOrders();
        this.style.opacity = adminMode ? '1' : '0.5';
        this.title = adminMode ? 'Admin Mode (Hide Names)' : 'Admin Mode (Show Names)';
    });
    
    // Update quantity label based on selection
    orderTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'piece') {
                quantityContainer.querySelector('label').textContent = 'Number of Cookies';
                document.getElementById('quantity').max = '100';
                document.getElementById('quantity').value = '6';
            } else {
                quantityContainer.querySelector('label').textContent = 'Number of Tubs';
                document.getElementById('quantity').max = '20';
                document.getElementById('quantity').value = '1';
            }
        });
    });
    
    // Handle form submission
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        const quantity = document.getElementById('quantity').value;
        const specialRequests = document.getElementById('special-requests').value;
        
        // Create order object
        const order = {
            name,
            email,
            item: "Chocolate Chip Cookies",
            orderType,
            quantity,
            unit: orderType === 'piece' ? 'pieces' : 'tubs',
            specialRequests: specialRequests || 'None',
            timestamp: new Date().toISOString()
        };
        
        // Add order to display
        addOrderToDisplay(order);
        
        // Save order to localStorage
        saveOrder(order);
        
        // Reset form
        orderForm.reset();
        document.querySelector('input[name="orderType"][value="tub"]').checked = true;
        quantityContainer.querySelector('label').textContent = 'Number of Tubs';
        document.getElementById('quantity').max = '20';
        document.getElementById('quantity').value = '1';
        
        // Show confirmation
        const orderId = 'ORD-' + order.timestamp.slice(-6).replace(/\D/g, '');
        alert(`Thank you, ${name}!\nYour order #${orderId} for ${quantity} ${order.unit} has been placed!\nA confirmation will be sent to ${email}`);
        
        // Submit to FormSubmit
        const formData = new FormData(orderForm);
        formData.append('order_id', orderId);
        
        fetch(orderForm.action, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                console.error('Form submission failed');
            }
        })
        .catch(error => {
            console.error('Error submitting form:', error);
        });
    });
    
    function addOrderToDisplay(order) {
        // Remove "no orders" message if it exists
        const noOrdersMsg = ordersList.querySelector('.no-orders');
        if (noOrdersMsg) {
            noOrdersMsg.remove();
        }
        
        // Create order card
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        // Format date
        const orderDate = new Date(order.timestamp);
        const formattedDate = orderDate.toLocaleString();
        
        // Generate order ID
        const orderId = 'ORD-' + order.timestamp.slice(-6).replace(/\D/g, '');
        
        // Create HTML for order
        orderCard.innerHTML = `
            <h3>${adminMode ? order.name : orderId}</h3>
            ${adminMode ? `<p><strong>Email:</strong> ${order.email}</p>` : ''}
            <p><strong>${order.item}</strong> - ${order.quantity} ${order.unit}</p>
            ${order.specialRequests !== 'None' ? `<p><strong>Notes:</strong> ${order.specialRequests}</p>` : ''}
            <p class="order-time">Ordered: ${formattedDate}</p>
        `;
        
        // Add to top of list
        ordersList.insertBefore(orderCard, ordersList.firstChild);
    }
    
    function saveOrder(order) {
        let orders = JSON.parse(localStorage.getItem('lolaCookieOrders')) || [];
        orders.unshift(order);
        localStorage.setItem('lolaCookieOrders', JSON.stringify(orders));
    }
    
    function loadOrders() {
        const orders = JSON.parse(localStorage.getItem('lolaCookieOrders')) || [];
        
        if (orders.length > 0) {
            // Remove "no orders" message if it exists
            const noOrdersMsg = ordersList.querySelector('.no-orders');
            if (noOrdersMsg) {
                noOrdersMsg.remove();
            }
            
            // Clear and rebuild orders list
            ordersList.innerHTML = '';
            orders.forEach(order => addOrderToDisplay(order));
        } else {
            ordersList.innerHTML = '<p class="no-orders">No orders yet. Be the first to order!</p>';
        }
    }
    
    // Initial load
    loadOrders();
});
