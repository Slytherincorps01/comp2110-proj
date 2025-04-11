document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const ordersList = document.getElementById('ordersList');
    const ownerEmail = 'youremail@example.com'; // Replace with your email
    
    // Load existing orders from localStorage
    loadOrders();
    
    // Handle form submission
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            // Get form values
            const name = document.getElementById('name').value.trim();
            const item = document.getElementById('item').value;
            const quantity = document.getElementById('quantity').value;
            const specialRequests = document.getElementById('special-requests').value.trim();
            
            // Validate inputs
            if (!name || !item || !quantity) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Create order object
            const order = {
                name,
                item,
                quantity,
                specialRequests: specialRequests || 'None',
                timestamp: new Date().toISOString(),
                status: 'Received'
            };
            
            // Add order to display
            addOrderToDisplay(order);
            
            // Save order to localStorage
            saveOrder(order);
            
            // Send notification
            await sendOrderNotification(order);
            
            // Reset form
            orderForm.reset();
            
            // Show confirmation
            showAlert(`Thank you, ${name}! Your order for ${quantity} dozen ${item} cookies has been placed!`);
            
        } catch (error) {
            console.error('Order submission error:', error);
            showAlert('There was an error processing your order. Please try again.');
        }
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
        
        // Create HTML for order
        orderCard.innerHTML = `
            <h3>${order.name}</h3>
            <p><strong>Status:</strong> <span class="status-${order.status.toLowerCase()}">${order.status}</span></p>
            <p><strong>Cookie Type:</strong> ${order.item}</p>
            <p><strong>Quantity:</strong> ${order.quantity} dozen</p>
            ${order.specialRequests !== 'None' ? `<p><strong>Special Requests:</strong> ${order.specialRequests}</p>` : ''}
            <p class="order-time">Ordered at: ${formattedDate}</p>
            <button class="status-btn" data-id="${order.timestamp}">Mark as Ready</button>
        `;
        
        // Add to top of list
        ordersList.insertBefore(orderCard, ordersList.firstChild);
        
        // Add event listener to status button
        orderCard.querySelector('.status-btn').addEventListener('click', function() {
            updateOrderStatus(order.timestamp, 'Ready');
        });
    }
    
    function saveOrder(order) {
        try {
            let orders = JSON.parse(localStorage.getItem('lolaCookiesOrders')) || [];
            orders.unshift(order);
            localStorage.setItem('lolaCookiesOrders', JSON.stringify(orders));
        } catch (error) {
            console.error('Error saving order:', error);
        }
    }
    
    function loadOrders() {
        try {
            const orders = JSON.parse(localStorage.getItem('lolaCookiesOrders')) || [];
            
            if (orders.length > 0) {
                // Remove "no orders" message if it exists
                const noOrdersMsg = ordersList.querySelector('.no-orders');
                if (noOrdersMsg) {
                    noOrdersMsg.remove();
                }
                
                // Add each order to display
                orders.forEach(order => addOrderToDisplay(order));
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }
    
    function updateOrderStatus(timestamp, newStatus) {
        try {
            let orders = JSON.parse(localStorage.getItem('lolaCookiesOrders')) || [];
            const orderIndex = orders.findIndex(o => o.timestamp === timestamp);
            
            if (orderIndex !== -1) {
                orders[orderIndex].status = newStatus;
                localStorage.setItem('lolaCookiesOrders', JSON.stringify(orders));
                
                // Refresh display
                ordersList.innerHTML = '<p class="no-orders">No orders yet. Be the first to order!</p>';
                loadOrders();
                
                // Notify customer if status is "Ready"
                if (newStatus === 'Ready') {
                    const order = orders[orderIndex];
                    notifyCustomer(order);
                }
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    }
    
    async function sendOrderNotification(order) {
        // Using FormSubmit.co (free service)
        const formData = new FormData();
        formData.append('_replyto', 'julioagapito119@gmail.com');
        formData.append('_subject', `New Order: ${order.name}`);
        formData.append('message', `
            New Order Details:
            Name: ${order.name}
            Item: ${order.item}
            Quantity: ${order.quantity} dozen
            Special Requests: ${order.specialRequests}
            Time: ${new Date(order.timestamp).toLocaleString()}
        `);
        
        try {
            await fetch(`https://formsubmit.co/ajax/${ownerEmail}`, {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.error('Notification failed:', error);
        }
    }
    
    function notifyCustomer(order) {
        // In a real app, you would send an email/SMS here
        console.log(`Order ready notification for ${order.name}`);
        // Example: You could integrate with Twilio for SMS or EmailJS for emails
    }
    
    function showAlert(message) {
        // Replace with a nicer alert system if desired
        alert(message);
    }
});

// Add this to your CSS:
/*
.status-received { color: #FFA500; font-weight: bold; }
.status-ready { color: #008000; font-weight: bold; }
.status-btn {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
}
*/
