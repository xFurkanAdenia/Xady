// POS Device JavaScript
(function() {
    'use strict';

    const state = {
        currentView: 'main',
        activeInput: null,
        activePayments: [],
        historyPayments: [],
        products: [],
        functions: [],
        balance: 0,
        eventSource: null
    };

    // ═══════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    function formatAmount(amount) {
        return Number(amount).toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatTime(timestamp) {
        return new Date(timestamp).toLocaleString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    function setStatus(text, color = '#00ff00') {
        const el = document.getElementById('pos-status');
        if (el) {
            el.textContent = text;
            el.style.color = color;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // VIEW MANAGEMENT
    // ═══════════════════════════════════════════════════════════
    window.posShowView = function(viewName) {
        // Tüm view'ları gizle
        document.querySelectorAll('.pos-screen-view').forEach(v => {
            v.style.display = 'none';
        });

        // Seçilen view'ı göster
        const view = document.getElementById(`view-${viewName}`);
        if (view) {
            view.style.display = 'block';
            state.currentView = viewName;
            state.activeInput = null;

            // View açıldığında verileri yükle
            if (viewName === 'active') loadActivePayments();
            else if (viewName === 'history') loadHistoryPayments();
            else if (viewName === 'products') loadProducts();
            else if (viewName === 'product-add') loadFunctions();
        }
    };

    // ═══════════════════════════════════════════════════════════
    // KEYPAD
    // ═══════════════════════════════════════════════════════════
    window.posKeyPress = function(key) {
        if (!state.activeInput) {
            // Input seçili değilse ses çık
            setStatus('Lütfen bir alan seçin', '#ff3333');
            setTimeout(() => setStatus('HAZIR'), 1000);
            return;
        }

        const input = document.getElementById(state.activeInput);
        if (!input) return;

        if (key === 'C') {
            input.value = '';
        } else if (key === 'OK') {
            state.activeInput = null;
            input.blur();
            setStatus('HAZIR');
        } else {
            input.value += key;
        }
    };

    // Input focus olduğunda aktif yap
    document.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('pos-input')) {
            state.activeInput = e.target.id;
            setStatus(`${e.target.previousElementSibling?.textContent || 'ALAN'} SEÇİLDİ`, '#ffaa00');
        }
    });

    // ═══════════════════════════════════════════════════════════
    // API CALLS
    // ═══════════════════════════════════════════════════════════
    async function loadBalance() {
        try {
            const res = await fetch('/api/pos/balance');
            const data = await res.json();
            if (data.ok) {
                state.balance = data.balance;
                document.getElementById('pos-user-balance').textContent = formatAmount(data.balance);
            }
        } catch (error) {
            console.error('[POS] Balance load error:', error);
        }
    }

    async function loadActivePayments() {
        try {
            const res = await fetch('/api/pos/payments');
            const data = await res.json();
            if (data.ok) {
                state.activePayments = data.payments;
                renderActivePayments();
            }
        } catch (error) {
            console.error('[POS] Active payments load error:', error);
        }
    }

    async function loadHistoryPayments() {
        try {
            const res = await fetch('/api/pos/history');
            const data = await res.json();
            if (data.ok) {
                state.historyPayments = data.payments;
                renderHistoryPayments();
            }
        } catch (error) {
            console.error('[POS] History load error:', error);
        }
    }

    async function loadProducts() {
        try {
            const res = await fetch('/api/pos/products');
            const data = await res.json();
            if (data.ok) {
                state.products = data.products;
                renderProducts();
            }
        } catch (error) {
            console.error('[POS] Products load error:', error);
        }
    }

    async function loadFunctions() {
        try {
            const res = await fetch('/api/pos/functions');
            const data = await res.json();
            if (data.ok) {
                state.functions = data.functions;
                renderFunctions();
            }
        } catch (error) {
            console.error('[POS] Functions load error:', error);
        }
    }

    window.posAddProduct = async function() {
        const name = document.getElementById('input-product-name').value.trim();
        const price = parseFloat(document.getElementById('input-product-price').value);
        const description = document.getElementById('input-product-desc').value.trim();
        const functionId = document.getElementById('input-product-function').value;

        if (!name) {
            setStatus('ÜRÜN ADI GEREKLİ', '#ff3333');
            return;
        }

        if (!price || price <= 0) {
            setStatus('GEÇERSİZ FİYAT', '#ff3333');
            return;
        }

        setStatus('KAYDEDİLİYOR...', '#ffaa00');

        try {
            // CSRF token'ı al
            const meRes = await fetch('/api/me');
            const meData = await meRes.json();
            const csrfToken = meData.csrfToken;

            const res = await fetch('/api/pos/products', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ 
                    name, 
                    price, 
                    description: description || undefined,
                    functionId: functionId || undefined
                })
            });
            const data = await res.json();

            if (data.ok) {
                setStatus('ÜRÜN EKLENDİ', '#00ff00');
                document.getElementById('input-product-name').value = '';
                document.getElementById('input-product-price').value = '';
                document.getElementById('input-product-desc').value = '';
                document.getElementById('input-product-function').value = '';
                setTimeout(() => {
                    loadProducts();
                    posShowView('products');
                }, 1000);
            } else {
                setStatus(data.error || 'HATA', '#ff3333');
            }
        } catch (error) {
            setStatus('BAĞLANTI HATASI', '#ff3333');
        }
    };

    window.posCreatePayment = async function() {
        const username = document.getElementById('input-username').value.trim();
        const amount = parseFloat(document.getElementById('input-amount').value);
        const description = document.getElementById('input-desc').value.trim();

        if (!username) {
            setStatus('OYUNCU ADI GEREKLİ', '#ff3333');
            return;
        }

        if (!amount || amount <= 0) {
            setStatus('GEÇERSİZ TUTAR', '#ff3333');
            return;
        }

        setStatus('OLUŞTURULUYOR...', '#ffaa00');

        try {
            const res = await fetch('/api/pos/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, amount, description })
            });
            const data = await res.json();

            if (data.ok) {
                setStatus('ÖDEME OLUŞTURULDU', '#00ff00');
                document.getElementById('input-username').value = '';
                document.getElementById('input-amount').value = '';
                document.getElementById('input-desc').value = '';
                setTimeout(() => posShowView('active'), 1000);
            } else {
                setStatus(data.error || 'HATA', '#ff3333');
            }
        } catch (error) {
            setStatus('BAĞLANTI HATASI', '#ff3333');
        }
    };

    // ═══════════════════════════════════════════════════════════
    // RENDER FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    function renderActivePayments() {
        const container = document.getElementById('active-list');
        if (!container) return;

        if (state.activePayments.length === 0) {
            container.innerHTML = '<div class="pos-empty">AKTİF ÖDEME YOK</div>';
            return;
        }

        container.innerHTML = state.activePayments.map(payment => `
            <div class="pos-list-item">
                <div class="pos-list-item-header">
                    <span>${payment.username}</span>
                    <span>${formatAmount(payment.amount)}⛁</span>
                </div>
                <div class="pos-list-item-body">
                    ${payment.description || '-'}<br>
                    ${formatTime(payment.createdAt)}
                </div>
            </div>
        `).join('');
    }

    function renderHistoryPayments() {
        const container = document.getElementById('history-list');
        if (!container) return;

        if (state.historyPayments.length === 0) {
            container.innerHTML = '<div class="pos-empty">GEÇMİŞ YOK</div>';
            return;
        }

        container.innerHTML = state.historyPayments.slice(0, 20).map(payment => {
            const statusIcon = payment.status === 'success' ? '✓' : '✗';
            const statusColor = payment.status === 'success' ? '#00ff00' : '#ff3333';
            return `
                <div class="pos-list-item">
                    <div class="pos-list-item-header">
                        <span style="color: ${statusColor};">${statusIcon} ${payment.username}</span>
                        <span>${formatAmount(payment.amount)}⛁</span>
                    </div>
                    <div class="pos-list-item-body">
                        ${formatTime(payment.completedAt || payment.createdAt)}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderProducts() {
        const container = document.getElementById('products-grid');
        if (!container) return;

        if (state.products.length === 0) {
            container.innerHTML = '<div class="pos-empty" style="grid-column: 1/-1;">ÜRÜN YOK</div>';
            return;
        }

        container.innerHTML = state.products.filter(p => p.enabled).map(product => `
            <div class="pos-product-card" onclick="posSelectProduct('${product.id}')">
                <div class="pos-product-name">${product.name}</div>
                <div class="pos-product-price">${formatAmount(product.price)}⛁</div>
            </div>
        `).join('');
    }

    function renderFunctions() {
        const select = document.getElementById('input-product-function');
        if (!select) return;

        // Mevcut option'ları temizle (ilk option hariç)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Fonksiyonları ekle
        state.functions.forEach(fn => {
            const option = document.createElement('option');
            option.value = fn.id;
            option.textContent = `${fn.name} (${fn.module})`;
            select.appendChild(option);
        });
    }

    window.posSelectProduct = async function(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        setStatus('ÜRÜN SEÇİLDİ', '#00ff00');
        
        // Ödeme oluşturma ekranına git ve otomatik doldur
        posShowView('create');
        document.getElementById('input-amount').value = product.price;
        document.getElementById('input-desc').value = product.name;
        
        // Username input'a focus
        document.getElementById('input-username').focus();
    };

    // ═══════════════════════════════════════════════════════════
    // SSE CONNECTION
    // ═══════════════════════════════════════════════════════════
    function connectSSE() {
        if (state.eventSource) {
            state.eventSource.close();
        }

        state.eventSource = new EventSource('/api/pos/stream');

        state.eventSource.addEventListener('pos_new', (e) => {
            const payment = JSON.parse(e.data);
            state.activePayments.push(payment);
            if (state.currentView === 'active') {
                renderActivePayments();
            }
            setStatus('YENİ ÖDEME', '#ffaa00');
            setTimeout(() => setStatus('HAZIR'), 2000);
        });

        state.eventSource.addEventListener('pos_complete', (e) => {
            const payment = JSON.parse(e.data);
            state.activePayments = state.activePayments.filter(p => p.id !== payment.id);
            state.historyPayments.unshift(payment);
            
            if (state.currentView === 'active') {
                renderActivePayments();
            } else if (state.currentView === 'history') {
                renderHistoryPayments();
            }

            loadBalance(); // Bakiye güncellenebilir
            setStatus('ÖDEME TAMAMLANDI', '#00ff00');
            setTimeout(() => setStatus('HAZIR'), 2000);
        });

        state.eventSource.addEventListener('pos_cancel', (e) => {
            const payment = JSON.parse(e.data);
            state.activePayments = state.activePayments.filter(p => p.id !== payment.id);
            
            if (state.currentView === 'active') {
                renderActivePayments();
            }
            
            setStatus('ÖDEME İPTAL', '#ff3333');
            setTimeout(() => setStatus('HAZIR'), 2000);
        });

        state.eventSource.onerror = () => {
            setTimeout(() => connectSSE(), 3000);
        };
    }

    // ═══════════════════════════════════════════════════════════
    // CLOCK
    // ═══════════════════════════════════════════════════════════
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        document.getElementById('pos-time').textContent = timeStr;
    }

    // ═══════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        loadBalance();
        connectSSE();
        setInterval(updateClock, 1000);
        updateClock();
        setStatus('HAZIR');
    });

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            loadBalance();
            connectSSE();
            setInterval(updateClock, 1000);
            updateClock();
            setStatus('HAZIR');
        }, 1);
    }
})();
