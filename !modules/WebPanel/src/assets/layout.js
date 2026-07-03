let session = null;
let currentScope = window.location.pathname.startsWith('/admin') ? 'admin' : 'app';

// Initialization
async function init() {
    await fetchSession();
    setupDropdown();
    await loadNavigation();
    
    // Handle initial route
    handleRoute();

    // Handle back/forward navigation
    window.addEventListener('popstate', handleRoute);
    
    // Intercept clicks on links
    document.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (a && a.href && a.origin === window.location.origin) {
            // Don't intercept API links or external links
            const path = a.getAttribute('href');
            if (path && path.startsWith('/') && !path.startsWith('/api/') && !path.startsWith('/assets/') && path !== '/logout') {
                e.preventDefault();
                window.history.pushState({}, '', path);
                handleRoute();
            }
        }
    });
}

async function fetchSession() {
    try {
        const res = await fetch('/api/me');
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        const data = await res.json();
        session = data;
        
        // Setup global CSRF for all subsequent fetch requests
        if (session.csrfToken) {
            const originalFetch = window.fetch;
            window.fetch = async function() {
                let [resource, config] = arguments;
                if (!config) config = {};
                if (!config.headers) config.headers = {};
                
                // Add CSRF token for mutating requests
                if (config.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase())) {
                    config.headers['X-CSRF-Token'] = session.csrfToken;
                }
                
                return originalFetch(resource, config);
            };
        }
        
        // Update Header
        document.getElementById('header-username').textContent = session.username;
        document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${session.username}&background=random`;
        
        if (session.permissions.includes('*') || session.permissions.includes('admin.view')) {
            document.getElementById('link-admin').style.display = 'block';
            document.getElementById('link-app').style.display = 'block';
        }
    } catch (e) {
        console.error('Session fetch error', e);
    }
}

function setupDropdown() {
    const btn = document.getElementById('user-dropdown-btn');
    const menu = document.getElementById('user-dropdown-menu');
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        menu.classList.remove('show');
    });
}

async function loadNavigation() {
    try {
        const res = await fetch(`/api/nav?scope=${currentScope}`);
        const data = await res.json();
        const navItems = data.items || [];
        
        const navContainer = document.getElementById('sidebar-nav');
        navContainer.innerHTML = '';

        navItems.forEach(item => {
            const a = document.createElement('a');
            a.href = item.path;
            a.innerHTML = `<i class="${item.icon || 'fa-solid fa-circle'}"></i> ${item.title}`;
            navContainer.appendChild(a);
        });
    } catch (e) {
        console.error('Nav fetch error', e);
    }
}

async function handleRoute() {
    const path = window.location.pathname; // e.g. "/", "/admin/users"

    // Scope check to update sidebar when moving between App and Admin
    const newScope = path.startsWith('/admin') ? 'admin' : 'app';
    if (newScope !== currentScope) {
        currentScope = newScope;
        await loadNavigation();
    }

    // Set a default title in case we don't find a matching nav item
    document.getElementById('page-title').textContent = 'Xady Panel';

    // Update active nav item
    document.querySelectorAll('#sidebar-nav a').forEach(a => {
        a.classList.remove('active');
        
        const aHref = a.getAttribute('href');
        if (aHref === path) {
            a.classList.add('active');
            document.getElementById('page-title').textContent = a.textContent.trim();
        }
    });

    const contentArea = document.getElementById('page-content');
    contentArea.innerHTML = `<div class="loader-container"><div class="loader"></div></div>`;

    try {
        // Fetch the view content
        const res = await fetch(`/api/view?path=${encodeURIComponent(path)}`);
        if (!res.ok) {
            contentArea.innerHTML = `<div class="card"><div class="card-body text-danger">Sayfa yüklenemedi. (${res.status})</div></div>`;
            return;
        }
        
        const data = await res.json();
        
        // Remove only page-specific modals/toasts to prevent duplicates, leave globals intact
        document.querySelectorAll('.modal-overlay, .modal:not(#global-confirm-modal), #toast-container:not(#global-toast-container)').forEach(el => el.remove());
        
        contentArea.innerHTML = data.html || '';
        
        // Execute any script tags that came with the HTML
        const scripts = contentArea.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

    } catch (e) {
        contentArea.innerHTML = `<div class="card"><div class="card-body text-danger">Bağlantı hatası.</div></div>`;
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);

// --- GLOBAL UTILITY FUNCTIONS ---

window.showToast = function(message, type = 'success') {
    const container = document.getElementById('global-toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.style.background = type === 'success' ? 'var(--success)' : 'var(--danger)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.fontSize = '14px';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    toast.innerHTML = message;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Animate out
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

window.showModal = function(title, message, onConfirm, confirmText = 'Evet, Onayla', type = 'danger') {
    const modal = document.getElementById('global-confirm-modal');
    if (!modal) {
        console.error("Global confirm modal elementi bulunamadı!");
        return;
    }
    
    document.getElementById('global-confirm-title').textContent = title || 'Emin misiniz?';
    document.getElementById('global-confirm-message').textContent = message || 'Bu işlemi geri alamazsınız.';
    
    const btn = document.getElementById('global-confirm-btn');
    btn.textContent = confirmText;
    btn.className = type === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
    
    btn.onclick = () => {
        window.closeModal();
        if (typeof onConfirm === 'function') onConfirm();
    };
    
    // Explicitly set z-index to make sure it's on top of everything
    modal.style.zIndex = "999999";
    modal.style.display = 'flex';
};

window.closeModal = function() {
    const modal = document.getElementById('global-confirm-modal');
    if (modal) modal.style.display = 'none';
};

window.sendChatMessage = async function(text) {
    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text })
        });
        if (res.ok) {
            window.showToast("Mesaj gönderildi!", "success");
            return true;
        } else {
            window.showToast("Mesaj gönderilemedi!", "danger");
            return false;
        }
    } catch (err) {
        console.error(err);
        window.showToast("Bağlantı hatası!", "danger");
        return false;
    }
};

window.logout = function() {
    window.location.href = '/logout';
};
