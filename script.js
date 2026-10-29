
// ===== Supabase connection =====
// Publishable key public hoti hai (safe). NEVER put the secret/service_role key here.
const SUPABASE_URL = "https://ddtbqlalhfokedxbhdhj.supabase.co";
const SUPABASE_KEY = "sb_publishable_egINPJu1IQV6kYN4EXLF3A_8pIpi6qz";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
 
let itemsList = [];
let isAdminLoggedIn = false;
 
const categoryIcons = {
    'Mobile': '📱', 'Laptop': '💻', 'Wallet': '👛', 'ID Card': '💳',
    'Keys': '🔑', 'Books': '📚', 'Bag': '🎒', 'Other': '📦'
};
const STATUS_LABEL = { pending: 'Pending Review', approved: 'Approved', rejected: 'Rejected' };
const STATUS_COLOR = { pending: '#f59e0b', approved: '#2ecc71', rejected: '#ef4444' };
 
// Shared data ab sabko dikhta hai, isliye HTML escape zaroori hai (XSS se bachne ke liye)
function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
 
// ===== Data loading =====
async function loadItems() {
    // Admin ko saari reports (reports table), public ko sirf approved (public_reports view)
    const source = isAdminLoggedIn ? 'reports' : 'public_reports';
    const { data, error } = await db.from(source).select('*').order('created_at', { ascending: false });
    if (error) {
        console.error(error);
        alert("Data load nahi hua: " + error.message);
        return;
    }
    // Re-render ke baad page upar na jaye, isliye scroll position yaad rakho
    const y = window.scrollY;
    itemsList = data || [];
    renderItems(document.getElementById('searchBox').value);
    window.scrollTo({ top: y, behavior: 'instant' });
}
 
// ===== Admin auth (Supabase Auth) =====
function setAdminUI(on) {
    isAdminLoggedIn = on;
    const btn = document.getElementById('adminLoginBtn');
    btn.innerText = on ? "Admin Logout 🔓" : "Admin Login";
    btn.classList.toggle('logged-in', on);
}
 
async function toggleAdminPanel() {
    if (isAdminLoggedIn) {
        await db.auth.signOut();
        setAdminUI(false);
        alert("Admin Session Ended.");
        loadItems();
    } else {
        document.getElementById('adminModal').style.display = 'flex';
    }
}
 
function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}
 
async function handleAdminLogin() {
    const email = document.getElementById('adminId').value.trim();
    const password = document.getElementById('adminPass').value;
 
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Unauthorized Access. Wrong email or password!");
    } else {
        setAdminUI(true);
        closeAdminModal();
        alert("Verification Success! Admin view enabled.");
        loadItems();
    }
    document.getElementById('adminId').value = '';
    document.getElementById('adminPass').value = '';
}
 
// ===== Render =====
function renderItems(filterText = '') {
    const lostContainer = document.querySelector('#lost .items-container');
    const foundContainer = document.querySelector('#found .items-container');
    lostContainer.innerHTML = '';
    foundContainer.innerHTML = '';
 
    const q = filterText.toLowerCase();
    const filtered = itemsList.filter(item =>
        (item.item_name || '').toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q)
    );
 
    filtered.forEach(item => {
        const status = item.status || 'approved'; // public view me sirf approved aate hain
        const icon = categoryIcons[item.category] || '📦';
        const card = document.createElement('div');
        card.className = 'item-card';
 
        const adminControls = isAdminLoggedIn ? `
            <div class="admin-actions-pane">
                ${status === 'pending' ? `<button class="admin-btn-approve" onclick="approveItem('${esc(item.id)}')">Approve</button>` : ''}
                <button class="admin-btn-delete" onclick="deleteItem('${esc(item.id)}')">Delete</button>
            </div>` : '';
 
        // Naam/email sirf admin ko dikhte hain (public view me hote hi nahi)
        const reporter = isAdminLoggedIn
            ? `<p><strong>${item.type === 'lost' ? 'Owner:' : 'Found By:'}</strong> ${esc(item.name)}</p>
               <p>📞 ${item.phone ? `<a href="tel:${esc(item.phone)}">${esc(item.phone)}</a>` : 'N/A'} | ✉️ <a href="mailto:${esc(item.email)}">${esc(item.email)}</a></p>` : '';
 
        card.innerHTML = `
            <div class="item-image">${icon}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin: 0 20px 10px;">
                <h3 style="margin:0; font-size:20px;">${esc(item.item_name)}</h3>
                <span style="background:${STATUS_COLOR[status]}; color:white; font-size:11px; padding:3px 8px; border-radius:50px; font-weight:bold;">${STATUS_LABEL[status]}</span>
            </div>
            <p><strong>${item.type === 'lost' ? 'Location:' : 'Found At:'}</strong> ${esc(item.location)}</p>
            <p><strong>Date:</strong> ${esc(item.date)}</p>
            ${item.description ? `<p>${esc(item.description)}</p>` : ''}
            ${reporter}
            ${!isAdminLoggedIn ? `<button onclick="actionAlert('${item.type}')">${item.type === 'lost' ? 'View Details' : 'Claim Item'}</button>` : ''}
            ${adminControls}
        `;
 
        (item.type === 'lost' ? lostContainer : foundContainer).appendChild(card);
    });
}
 
// ===== Admin actions =====
// Screen par message dikhane ke liye (alert/console ki zaroorat nahi)
function toast(msg, ok = true) {
    let el = document.getElementById('appToast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'appToast';
        el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:99999;padding:12px 20px;border-radius:8px;color:#fff;font-weight:bold;max-width:90%;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.25)';
        document.body.appendChild(el);
    }
    el.style.background = ok ? '#16a34a' : '#dc2626';
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.display = 'none'; }, 8000);
}
 
async function approveItem(id) {
    try {
        toast('Approving...', true);
        const { data: sess } = await db.auth.getSession();
        if (!sess.session) return toast('Login expire ho gaya. Admin Logout karke dobara Login karo.', false);
 
        const { data, error } = await db.from('reports').update({ status: 'approved' }).eq('id', id).select();
        console.log('APPROVE RESULT:', { id, data, error });
        if (error) return toast('Approve fail: ' + error.message, false);
        if (!data || data.length === 0) return toast('Approve nahi hua: 0 rows change hui (permission issue).', false);
 
        // Poori list dobara load karne ki jagah sirf us card ka status badlo (page upar nahi jayega)
        const item = itemsList.find(i => String(i.id) === String(id));
        if (item) item.status = 'approved';
        const y = window.scrollY;
        renderItems(document.getElementById('searchBox').value);
        window.scrollTo({ top: y, behavior: 'instant' });
        toast('Approved! Ab ye item public list me dikhega.', true);
    } catch (e) {
        console.error(e);
        toast('Approve error: ' + e.message, false);
    }
}
 
async function deleteItem(id) {
    if (!confirm("Are you sure you want to permanently delete this log?")) return;
    const { data, error } = await db.from('reports').delete().eq('id', id).select();
    if (error) return alert("Delete fail: " + error.message);
    if (!data || data.length === 0) return alert("Delete nahi hua: database ne allow nahi kiya. Dobara Login karke try karo.");
    loadItems();
}
 
// ===== Track by email (RPC function) =====
async function trackUserStatus() {
    const email = document.getElementById('trackEmailBox').value.trim().toLowerCase();
    const resultWindow = document.getElementById('statusResultWindow');
    const tracksContainer = document.getElementById('statusTracksContainer');
 
    if (!email) return alert("Please enter your college email ID first!");
 
    const { data, error } = await db.rpc('track_reports', { p_email: email });
    resultWindow.style.display = 'block';
    tracksContainer.innerHTML = '';
 
    if (error) {
        tracksContainer.innerHTML = `<p style="color:#ef4444; text-align:center; padding:10px;">Error: ${esc(error.message)}</p>`;
        return;
    }
    if (!data || data.length === 0) {
        tracksContainer.innerHTML = `<p style="color: #ef4444; font-weight: 500; text-align: center; padding: 10px;">No reports found registered under this email address.</p>`;
        return;
    }
 
    data.forEach(item => {
        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px 10px; border-bottom: 1px solid #f1f5f9; gap: 10px;";
        row.innerHTML = `
            <div>
                <span style="font-size: 18px; margin-right: 8px;">${item.type === 'lost' ? '🔍' : '📦'}</span>
                <strong style="color: #0f172a;">${esc(item.item_name)}</strong>
                <span style="font-size: 12px; color: #64748b; margin-left: 10px;">(${esc(item.type).toUpperCase()})</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 12px; color: #94a3b8;">${new Date(item.created_at).toLocaleDateString()}</span>
                <span style="background: ${STATUS_COLOR[item.status]}; color: white; font-size: 11px; padding: 3px 10px; border-radius: 50px; font-weight: bold;">${STATUS_LABEL[item.status] || esc(item.status)}</span>
            </div>`;
        tracksContainer.appendChild(row);
    });
}
 
function actionAlert(type) {
    alert(type === 'lost' ? "Opening internal messaging pipeline to owner..." : "Redirecting to official claim validation form...");
}
 
function searchItem() {
    renderItems(document.getElementById('searchBox').value);
}
 
// ===== Submit report =====
document.getElementById('reportForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('.submit-btn');
    btn.disabled = true;
 
    const { error } = await db.from('reports').insert({
        type: document.getElementById('reportType').value,
        item_name: document.getElementById('itemName').value.trim(),
        category: document.getElementById('category').value,
        location: document.getElementById('location').value.trim(),
        date: document.getElementById('date').value,
        description: document.getElementById('description').value.trim(),
        name: document.getElementById('studentName').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        phone: document.getElementById('phone').value.trim()
    });
 
    const msg = document.getElementById('successMessage');
    btn.disabled = false;
    if (error) {
        msg.innerText = "❌ Report submit nahi hui: " + error.message;
        msg.style.color = "#ef4444";
        return;
    }
    msg.innerText = "🎉 Report Filed! Awaiting Campus Administration Review. You can track it using your email below.";
    msg.style.color = "#f59e0b";
    this.reset();
    loadItems();
});
 
// ===== App init =====
window.onload = async () => {
    document.querySelector('footer').insertAdjacentHTML('beforeend', '<p style="font-size:11px;opacity:.6">build v4</p>');
    const { data } = await db.auth.getSession();
    setAdminUI(!!data.session);
    loadItems();
};
