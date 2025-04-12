document.addEventListener('DOMContentLoaded', function () {
    const orderForm = document.getElementById('orderForm');
    const ordersList = document.getElementById('ordersList');
    const ownerEmail = 'julioagapito119@gmail.com';

    // Load existing orders
    loadOrders();

    // Handle form submission
    orderForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const item = document.getElementById('item').value;
        const quantity = document.getElementById('quantity').value;
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        const unit = orderType === 'piece' ? 'pieces' : 'tubs';
        const specialRequests = document.getElementById('special-requests').value.trim();

        if (!name || !item || !quantity) {
            alert('Please fill in all required fields');
            return;
        }

        const order = {
            name,
            item,
            orderType,
            quantity,
            unit,
            specialRequests: specialRequests || 'None',
            timestamp: new Date().toISOString(),
            status: 'Received'
        };

        addOrderToDisplay(order);
        saveOrder(order);
        await sendOrderNotification(order);

        orderForm.reset();
        document.querySelector('input[name="orderType"][value="tub"]').checked = true;
        document.getElementById('quantity').value = 1;

        showAlert(`Thank you, ${name}! Your order for ${quantity} ${unit} of ${item} has been placed!`);
    });

    function addOrderToDisplay(order) {
        const noOrdersMsg = ordersList.querySelector('.no-orders');
        if (noOrdersMsg) noOrdersMsg.remove();

        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';

        const formattedDate = new Date(order.timestamp).toLocaleString();

        orderCard.innerHTML = `
            <h3>${order.name}</h3>
            <p><strong>Status:</strong> <span class="status-${order.status.toLowerCase()}">${order.status}</span></p>
            <p><strong>Cookie Type:</strong> ${order.item}</p>
            <p><strong>Quantity:</strong> ${order.quantity} ${order.unit}</p>
            ${order.specialRequests !== 'None' ? `<p><strong>Special Requests:</strong> ${order.specialRequests}</p>` : ''}
            <p class="order-time">Ordered at: ${formattedDate}</p>
            <button class="status-btn" data-id="${order.timestamp}">Mark as Ready</button>
        `;

        ordersList.insertBefore(orderCard, ordersList.firstChild);

        orderCard.querySelector('.status-btn').addEventListener('click', function () {
            updateOrderStatus(order.timestamp, 'Ready');
        });
    }

    function saveOrder(order) {
        let orders = JSON.parse(localStorage.getItem('lolaCookiesOrders')) || [];
        orders.unshift(order);
        localStorage.setItem('lolaCookiesOrders', JSON.stringify(orders));
    }

    function loadOrders() {
        const orders = JSON.parse(localStorage.getItem('lolaCookiesOrders')) || [];

        if (orders.length === 0) {
            ordersList.innerHTML = '<p class="no-orders">No orders yet. Be the first to order!</p>';
        } else {
            orders.forEach(order => addOrderToDisplay(order));
        }
    }

    function updateOrderStatus(timestamp, newStatus) {
        let orders = JSON.parse(localStorage.getItem('lolaCookiesOrders')) || [];
        const orderIndex = orders.findIndex(o => o.timestamp === timestamp);

        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            localStorage.setItem('lolaCookiesOrders', JSON.stringify(orders));
            ordersList.innerHTML = '';
            loadOrders();

            if (newStatus === 'Ready') {
                notifyCustomer(orders[orderIndex]);
            }
        }
    }

    async function sendOrderNotification(order) {
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
        console.log(`Order ready notification for ${order.name}`);
        // Extend with real notification (email/text) if needed.
    }

    function showAlert(message) {
        alert(message); // Replace with custom modal if needed
    }
});
