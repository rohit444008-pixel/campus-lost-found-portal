// LocalStorage data state architecture setup
let itemsList = JSON.parse(localStorage.getItem('campusItems')) || [
    { id: 1, type: 'lost', name: 'Mobile Phone', location: 'Library', date: '2026-08-20', user: 'Rahul', email: 'rahul@college.edu', icon: '📱', status: 'Approved' },
    { id: 2, type: 'lost', name: 'College ID Card', location: 'CSE Block', date: '2026-08-19', user: 'Aman', email: 'aman@college.edu', icon: '💳', status: 'Pending Review' },
    { id: 3, type: 'lost', name: 'Wireless Earbuds', location: 'Cafeteria', date: '2026-08-18', user: 'Neha', email: 'neha@college.edu', icon: '🎧', status: 'Approved' },
    { id: 4, type: 'found', name: 'Wallet', location: 'Parking Area', date: '2026-08-20', user: 'Karan', email: 'karan@college.edu', icon: '👛', status: 'Pending Review' },
    { id: 5, type: 'found', name: 'Car Keys', location: 'Main Gate', date: '2026-08-19', user: 'Rohit', email: 'rohit@college.edu', icon: '🔑', status: 'Approved' }
];

let isAdminLoggedIn = false;

const categoryIcons = {
    'Mobile': '📱', 'Laptop': '💻', 'Wallet': '👛', 'ID Card': '💳',
    'Keys': '🔑', 'Books': '📚', 'Bag': '🎒', 'Other': '📦'
};

// Toggle Panel Trigger
function toggleAdminPanel() {
    if (isAdminLoggedIn) {
        isAdminLoggedIn = false;
        const btn = document.getElementById('adminLoginBtn');
        btn.innerText = "Admin Login";
        btn.classList.remove('logged-in');
        alert("Admin Session Ended.");
        renderItems();
    } else {
        document.getElementById('adminModal').style.display = 'flex';
    }
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

// Authentication Controller
function handleAdminLogin() {
    const id = document.getElementById('adminId').value;
    const pass = document.getElementById('adminPass').value;

    if (id === 'admin' && pass === 'password') {
        isAdminLoggedIn = true;
        const btn = document.getElementById('adminLoginBtn');
        btn.innerText = "Admin Logout 🔓";
        btn.classList.add('logged-in');
        closeAdminModal();
        alert("Verification Success! Admin view enabled.");
        renderItems();
    } else {
        alert("Unauthorized Access. Wrong ID or Password!");
    }
    document.getElementById('adminId').value = '';
    document.getElementById('adminPass').value = '';
}

// Render Core Pipeline
function renderItems(filterText = '') {
    const lostContainer = document.querySelector('#lost .items-container');
    const foundContainer = document.querySelector('#found .items-container');

    lostContainer.innerHTML = '';
    foundContainer.innerHTML = '';

    const filtered = itemsList.filter(item =>
        item.name.toLowerCase().includes(filterText.toLowerCase()) ||
        item.location.toLowerCase().includes(filterText.toLowerCase())
    );

    filtered.forEach(item => {
        // Validation filter: Hide pending products from non-admins
        if (!isAdminLoggedIn && item.status === 'Pending Review') return;

        const card = document.createElement('div');
        card.className = 'item-card';

        const badgeColor = item.status === 'Approved' ? '#2ecc71' : '#f59e0b';

        // Conditional Rendering of Admin Buttons
        const adminControls = isAdminLoggedIn ? `
            <div class="admin-actions-pane">
                ${item.status === 'Pending Review' ? `<button class="admin-btn-approve" onclick="approveItem(${item.id})">Approve</button>` : ''}
                <button class="admin-btn-delete" onclick="deleteItem(${item.id})">Delete</button>
            </div>
        ` : '';

        card.innerHTML = `
            <div class="item-image">${item.icon}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin: 0 20px 10px;">
                <h3 style="margin:0; font-size:20px;">${item.name}</h3>
                <span style="background:${badgeColor}; color:white; font-size:11px; padding:3px 8px; border-radius:50px; font-weight:bold;">${item.status}</span>
            </div>
            <p><strong>${item.type === 'lost' ? 'Location:' : 'Found At:'}</strong> ${item.location}</p>
            <p><strong>Date:</strong> ${item.date}</p>
            <p><strong>${item.type === 'lost' ? 'Owner:' : 'Found By:'}</strong> ${item.user}</p>
            ${!isAdminLoggedIn ? `<button onclick="actionAlert('${item.type}')">${item.type === 'lost' ? 'View Details' : 'Claim Item'}</button>` : ''}
            ${adminControls}
        `;

        if (item.type === 'lost') {
            lostContainer.appendChild(card);
        } else {
            foundContainer.appendChild(card);
        }
    });

    localStorage.setItem('campusItems', JSON.stringify(itemsList));
}

// Action Management Methods
function approveItem(id) {
    const item = itemsList.find(i => i.id === id);
    if (item) {
        item.status = 'Approved';
        alert("Item approved successfully!");
        renderItems();
    }
}

// Student User Status Tracking Engine
function trackUserStatus() {
    const emailInput = document.getElementById('trackEmailBox').value.trim().toLowerCase();
    const resultWindow = document.getElementById('statusResultWindow');
    const tracksContainer = document.getElementById('statusTracksContainer');

    if (!emailInput) {
        alert("Please enter your college email ID first!");
        return;
    }

    const userItems = itemsList.filter(item => item.email && item.email.toLowerCase() === emailInput);

    resultWindow.style.display = 'block';
    tracksContainer.innerHTML = '';

    if (userItems.length === 0) {
        tracksContainer.innerHTML = `<p style="color: #ef4444; font-weight: 500; text-align: center; padding: 10px;">No reports found registered under this email address.</p>`;
        return;
    }

    userItems.forEach(item => {
        const statusBadgeColor = item.status === 'Approved' ? '#2ecc71' : '#f59e0b';
        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px 10px; border-bottom: 1px solid #f1f5f9; gap: 10px;";

        row.innerHTML = `
            <div>
                <span style="font-size: 18px; margin-right: 8px;">${item.icon}</span>
                <strong style="color: #0f172a;">${item.name}</strong> 
                <span style="font-size: 12px; color: #64748b; margin-left: 10px;">(${item.type.toUpperCase()} at ${item.location})</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 12px; color: #94a3b8;">${item.date}</span>
                <span style="background: ${statusBadgeColor}; color: white; font-size: 11px; padding: 3px 10px; border-radius: 50px; font-weight: bold;">${item.status}</span>
            </div>
        `;
        tracksContainer.appendChild(row);
    });
}

function deleteItem(id) {
    if (confirm("Are you sure you want to permanently delete this log?")) {
        itemsList = itemsList.filter(i => i.id !== id);
        renderItems();
    }
}

function actionAlert(type) {
    alert(type === 'lost' ? "Opening internal messaging pipeline to owner..." : "Redirecting to official claim validation form...");
}

function searchItem() {
    const query = document.getElementById('searchBox').value;
    renderItems(query);
}

// Form Post Request Pipeline (Catches Email Correctly)
document.getElementById('reportForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const type = document.getElementById('reportType').value;
    const name = document.getElementById('itemName').value;
    const category = document.getElementById('category').value;
    const location = document.getElementById('location').value;
    const date = document.getElementById('date').value;
    const user = document.getElementById('studentName').value;
    const email = document.getElementById('email').value;
    const icon = categoryIcons[category] || '📦';

    itemsList.unshift({
        id: Date.now(),
        type, name, location, date, user, email, icon,
        status: 'Pending Review'
    });

    renderItems();

    const msg = document.getElementById('successMessage');
    msg.innerText = `🎉 Report Filed! Awaiting Campus Administration Review. You can track it using your email below.`;
    msg.style.color = "#f59e0b";

    document.getElementById('reportForm').reset();
});

// App Initiation
window.onload = () => renderItems();
