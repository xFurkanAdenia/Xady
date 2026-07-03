// POS Simple JavaScript
(function() {
    'use strict';

    const state = {
        activeTab: 'create',
        balance: 0,
        products: [],
        functions: [],
        activePayments: [],
        historyPayments: [],
        eventSource: null,
        tempActions: [], // Modal'da eklenen action'lar
        editingProductId: null
    };

    // ═══════════════════════════════════════════════════════════
    // UTILS
    // ═══════════════════════════════════════════════════════════
    function formatAmount(amount) {
        return Number(amount).toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatTime(timestamp) {
        return new Date(timestamp).toLocaleString('tr-TR');
    }

    // ═══════════════════════════════════════════════════════════
    // TABS
    // ═══════════════════════════════════════════════════════════
    window.posShowTab = function(tabName) {
        state.activeTab = tabName;

        document.querySelectorAll('.pos-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.pos-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });

        if (tabName === 'create') renderProductSelection();
        else if (tabName === 'products') loadProducts();
        else if (tabName === 'active') loadActivePayments();
        else if (tabName === 'history') loadHistoryPayments();
    };

    // ═══════════════════════════════════════════════════════════
    // API
    // ═══════════════════════════════════════════════════════════
    async function loadBalance() {
        try {
            const res = await fetch('/api/pos/balance');
            const data = await res.json();
            if (data.ok) {
                state.balance = data.balance;
                document.getElementById('pos-balance').textContent = formatAmount(data.balance) + '⛁';
            }
        } catch (error) {
            console.error('[POS] Balance error:', error);
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
            console.error('[POS] Products error:', error);
        }
    }

    async function loadFunctions() {
        try {
            const res = await fetch('/api/pos/functions');
            const data = await res.json();
            if (data.ok) {
                state.functions = data.functions;
            }
        } catch (error) {
            console.error('[POS] Functions error:', error);
        }
    }

    async function loadActivePayments() {
        try {
            const res = await fetch('/api/pos/payments');
            const data = await res.json();
            if (data.ok) {
                state.activePayments = data.payments;
                renderActivePayments();
                document.getElementById('count-active').textContent = data.payments.length;
            }
        } catch (error) {
            console.error('[POS] Active payments error:', error);
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
            console.error('[POS] History error:', error);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    function renderProductSelection() {
        const container = document.getElementById('product-selection');
        if (!container) return;

        if (state.products.length === 0) {
            container.innerHTML = '<div class="pos-product-hint">Ürün eklemek için "Ürünler" sekmesine gidin</div>';
            return;
        }

        container.innerHTML = `
            <div class="pos-product-hint">Hızlı seçim için bir ürün seçin:</div>
            <div class="pos-product-grid">
                ${state.products.map(p => `
                    <div class="pos-product-quick" onclick="posSelectQuickProduct('${p.id}')">
                        <div class="pos-product-quick-name">${p.name}</div>
                        <div class="pos-product-quick-price">${formatAmount(p.price)}⛁</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderProducts() {
        const container = document.getElementById('products-list');
        if (!container) return;

        if (state.products.length === 0) {
            container.innerHTML = `
                <div class="pos-empty">
                    <div class="pos-empty-icon">📦</div>
                    <div class="pos-empty-text">Henüz ürün eklenmemiş</div>
                </div>
            `;
            return;
        }

        container.innerHTML = state.products.map(product => `
            <div class="pos-product-item">
                <div class="pos-product-name">${product.name}</div>
                <div class="pos-product-price">${formatAmount(product.price)}⛁</div>
                ${product.description ? `<div class="pos-product-desc">${product.description}</div>` : ''}
                ${product.actions && product.actions.length > 0 ? `
                    <div class="pos-product-actions-info">
                        ${product.actions.length} komut/fonksiyon
                    </div>
                ` : ''}
                <div class="pos-product-actions">
                    <button class="btn btn-primary btn-sm" onclick="posEditProduct('${product.id}')">
                        Düzenle
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="posDeleteProduct('${product.id}')">
                        Sil
                    </button>
                </div>
            </div>
        `).join('');
    }

    function renderActivePayments() {
        const container = document.getElementById('active-grid');
        if (!container) return;

        if (state.activePayments.length === 0) {
            container.innerHTML = `
                <div class="pos-empty">
                    <div class="pos-empty-icon">⏳</div>
                    <div class="pos-empty-text">Aktif ödeme bulunmuyor</div>
                </div>
            `;
            return;
        }

        container.innerHTML = state.activePayments.map(payment => {
            const elapsed = Date.now() - payment.createdAt;
            const timeout = 15 * 60 * 1000;
            const percentage = Math.max(0, 100 - (elapsed / timeout * 100));
            const timerClass = percentage < 20 ? 'danger' : percentage < 50 ? 'warning' : '';

            return `
                <div class="pos-payment-card status-pending">
                    <div class="pos-payment-header">
                        <div>
                            <div class="pos-payment-user">👤 ${payment.username}</div>
                            <span class="pos-badge pos-badge-pending">Bekliyor</span>
                        </div>
                        <div class="pos-payment-amount">${formatAmount(payment.amount)}⛁</div>
                    </div>
                    ${payment.description ? `<div class="pos-payment-desc">${payment.description}</div>` : ''}
                    <div class="pos-payment-meta">
                        🕐 ${formatTime(payment.createdAt)}<br>
                        👤 ${payment.createdBy}
                    </div>
                    <div class="pos-payment-timer">
                        <div class="pos-payment-timer-fill ${timerClass}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="pos-payment-actions">
                        <button class="btn btn-danger btn-sm" onclick="posCancelPayment('${payment.id}')">
                            İptal
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderHistoryPayments() {
        const container = document.getElementById('history-grid');
        if (!container) return;

        if (state.historyPayments.length === 0) {
            container.innerHTML = `
                <div class="pos-empty">
                    <div class="pos-empty-icon">📋</div>
                    <div class="pos-empty-text">Henüz tamamlanan ödeme yok</div>
                </div>
            `;
            return;
        }

        container.innerHTML = state.historyPayments.slice(0, 50).map(payment => {
            const isSuccess = payment.status === 'success';
            const refunded = payment.refunds && payment.refunds.length > 0;
            const totalRefunded = payment.totalRefunded || 0;
            const netAmount = (payment.sendedMoney || payment.amount) - totalRefunded;

            return `
                <div class="pos-payment-card status-${payment.status}">
                    <div class="pos-payment-header">
                        <div>
                            <div class="pos-payment-user">👤 ${payment.username}</div>
                            <span class="pos-badge pos-badge-${isSuccess ? 'success' : 'pending'}">
                                ${isSuccess ? '✅ Tamamlandı' : '❌ İptal'}
                            </span>
                        </div>
                        <div class="pos-payment-amount">${formatAmount(payment.amount)}⛁</div>
                    </div>
                    ${payment.description ? `<div class="pos-payment-desc">${payment.description}</div>` : ''}
                    <div class="pos-payment-meta">
                        🕐 ${formatTime(payment.completedAt || payment.createdAt)}
                        ${payment.sendedMoney ? `<br>💸 Ödenen: ${formatAmount(payment.sendedMoney)}⛁` : ''}
                        ${payment.change > 0 ? `<br>🔄 Para üstü: ${formatAmount(payment.change)}⛁` : ''}
                        ${refunded ? `<br>↩️ İade: ${formatAmount(totalRefunded)}⛁ (Net: ${formatAmount(netAmount)}⛁)` : ''}
                    </div>
                    ${isSuccess ? `
                        <div class="pos-payment-actions">
                            <button class="btn btn-warning btn-sm" onclick="posShowRefundModal('${payment.id}')">
                                ↩️ İade
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    function renderActionsList() {
        const container = document.getElementById('product-actions-list');
        if (!container) return;

        if (state.tempActions.length === 0) {
            container.innerHTML = '<div class="pos-empty-small">Henüz komut/fonksiyon eklenmemiş</div>';
            return;
        }

        container.innerHTML = state.tempActions.map((action, index) => {
            let label = action.type === 'command' ? `📝 ${action.value}` : `⚙️ ${action.value}`;
            return `
                <div class="pos-action-item">
                    <span>${label}</span>
                    <button class="btn btn-danger btn-xs" onclick="posRemoveAction(${index})">×</button>
                </div>
            `;
        }).join('');
    }

    // ═══════════════════════════════════════════════════════════
    // ACTIONS - PAYMENT
    // ═══════════════════════════════════════════════════════════
    window.posSelectQuickProduct = function(id) {
        const product = state.products.find(p => p.id === id);
        if (!product) return;

        document.getElementById('input-amount').value = product.price;
        document.getElementById('input-description').value = product.name;
        document.getElementById('input-username').focus();
    };

    window.posCreatePayment = async function() {
        const username = document.getElementById('input-username').value.trim();
        const amount = parseFloat(document.getElementById('input-amount').value);
        const description = document.getElementById('input-description').value.trim();

        if (!username) return alert('Oyuncu adı gerekli');
        if (!amount || amount <= 0) return alert('Geçerli bir tutar giriniz');

        try {
            const meRes = await fetch('/api/me');
            const meData = await meRes.json();

            const res = await fetch('/api/pos/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': meData.csrfToken
                },
                body: JSON.stringify({ username, amount, description })
            });
            const data = await res.json();

            if (data.ok) {
                document.getElementById('input-username').value = '';
                document.getElementById('input-amount').value = '';
                document.getElementById('input-description').value = '';
                posShowTab('active');
                if (window.showToast) window.showToast('Ödeme talebi oluşturuldu', 'success');
            } else {
                alert(data.error || 'Hata oluştu');
            }
        } catch (error) {
            alert('Bağlantı hatası');
        }
    };

    window.posCancelPayment = async function(id) {
        if (!confirm('Bu ödemeyi iptal etmek istediğinize emin misiniz?')) return;

        try {
            const meRes = await fetch('/api/me');
            const meData = await meRes.json();

            const res = await fetch(`/api/pos/payments/${id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-Token': meData.csrfToken }
            });
            const data = await res.json();

            if (data.ok) {
                loadActivePayments();
                if (window.showToast) window.showToast('Ödeme iptal edildi', 'success');
            } else {
                alert(data.error || 'Hata oluştu');
            }
        } catch (error) {
            alert('Bağlantı hatası');
        }
    };

    // ═══════════════════════════════════════════════════════════
    // ACTIONS - PRODUCT
    // ═══════════════════════════════════════════════════════════
    window.posShowProductModal = function() {
        state.editingProductId = null;
        state.tempActions = [];
        document.getElementById('product-modal-title').textContent = 'Yeni Ürün Ekle';
        document.getElementById('product-edit-id').value = '';
        document.getElementById('product-name').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-description').value = '';
        renderActionsList();
        document.getElementById('product-modal').style.display = 'flex';
    };

    window.posEditProduct = function(id) {
        const product = state.products.find(p => p.id === id);
        if (!product) return;

        state.editingProductId = id;
        state.tempActions = product.actions || [];
        document.getElementById('product-modal-title').textContent = 'Ürün Düzenle';
        document.getElementById('product-edit-id').value = id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-description').value = product.description || '';
        renderActionsList();
        document.getElementById('product-modal').style.display = 'flex';
    };

    window.posCloseProductModal = function() {
        document.getElementById('product-modal').style.display = 'none';
        state.tempActions = [];
        state.editingProductId = null;
    };

    window.posSaveProduct = async function() {
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const description = document.getElementById('product-description').value.trim();
        const editId = state.editingProductId;

        if (!name) return alert('Ürün adı gerekli');
        if (!price || price <= 0) return alert('Geçerli bir fiyat giriniz');

        try {
            const meRes = await fetch('/api/me');
            const meData = await meRes.json();

            const payload = {
                name,
                price,
                description: description || undefined,
                actions: state.tempActions
            };

            let res, data;
            if (editId) {
                res = await fetch(`/api/pos/products/${editId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': meData.csrfToken
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/pos/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': meData.csrfToken
                    },
                    body: JSON.stringify(payload)
                });
            }

            data = await res.json();

            if (data.ok) {
                posCloseProductModal();
                loadProducts();
                if (window.showToast) window.showToast(editId ? 'Ürün güncellendi' : 'Ürün eklendi', 'success');
            } else {
                alert(data.error || 'Hata oluştu');
            }
        } catch (error) {
            alert('Bağlantı hatası');
        }
    };

    window.posDeleteProduct = async function(id) {
        if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

        try {
            const meRes = await fetch('/api/me');
            const meData = await meRes.json();

            const res = await fetch(`/api/pos/products/${id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-Token': meData.csrfToken }
            });
            const data = await res.json();

            if (data.ok) {
                loadProducts();
                if (window.showToast) window.showToast('Ürün silindi', 'success');
            } else {
                alert(data.error || 'Hata oluştu');
            }
        } catch (error) {
            alert('Bağlantı hatası');
        }
    };

    // ═══════════════════════════════════════════════════════════
    // ACTIONS - ACTION MODAL
    // ═══════════════════════════════════════════════════════════
    window.posShowActionModal = async function() {
        await loadFunctions();
        
        // Fonksiyon varsa göster
        const funcOption = document.getElementById('action-type-function');
        if (state.functions.length === 0) {
            funcOption.style.display = 'none';
            document.getElementById('action-type').value = 'command';
        } else {
            funcOption.style.display = 'block';
            
            // Fonksiyon listesini doldur
            const funcSelect = document.getElementById('action-function');
            funcSelect.innerHTML = '<option value="">Fonksiyon seçiniz...</option>';
            state.functions.forEach(fn => {
                const option = document.createElement('option');
                option.value = fn.id;
                option.textContent = `${fn.name} (${fn.module})`;
                funcSelect.appendChild(option);
            });
        }

        document.getElementById('action-command').value = '';
        document.getElementById('action-function').value = '';
        posActionTypeChanged();
        document.getElementById('action-modal').style.display = 'flex';
    };

    window.posCloseActionModal = function() {
        document.getElementById('action-modal').style.display = 'none';
    };

    window.posActionTypeChanged = function() {
        const type = document.getElementById('action-type').value;
        document.getElementById('action-command-group').style.display = type === 'command' ? 'block' : 'none';
        document.getElementById('action-function-group').style.display = type === 'function' ? 'block' : 'none';
    };

    window.posAddAction = function() {
        const type = document.getElementById('action-type').value;
        let value = '';

        if (type === 'command') {
            value = document.getElementById('action-command').value.trim();
            if (!value) return alert('Komut girmelisiniz');
        } else {
            value = document.getElementById('action-function').value;
            if (!value) return alert('Fonksiyon seçmelisiniz');
        }

        state.tempActions.push({
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            value
        });

        renderActionsList();
        posCloseActionModal();
    };

    window.posRemoveAction = function(index) {
        state.tempActions.splice(index, 1);
        renderActionsList();
    };

    // ═══════════════════════════════════════════════════════════
    // ACTIONS - REFUND
    // ═══════════════════════════════════════════════════════════
    window.posShowRefundModal = function(paymentId) {
        const payment = state.historyPayments.find(p => p.id === paymentId);
        if (!payment) return;

        const paidAmount = payment.sendedMoney || payment.amount;
        const alreadyRefunded = payment.totalRefunded || 0;
        const availableAmount = paidAmount - alreadyRefunded;

        document.getElementById('refund-payment-id').value = paymentId;
        document.getElementById('refund-info').innerHTML = `
            <div><strong>Oyuncu:</strong> ${payment.username}</div>
            <div><strong>Ödenen:</strong> ${formatAmount(paidAmount)}⛁</div>
            ${alreadyRefunded > 0 ? `<div><strong>İade Edilmiş:</strong> ${formatAmount(alreadyRefunded)}⛁</div>` : ''}
            <div><strong>İade Edilebilir:</strong> ${formatAmount(availableAmount)}⛁</div>
        `;
        document.getElementById('refund-type').value = 'amount';
        document.getElementById('refund-amount').value = '';
        document.getElementById('refund-reason').value = '';
        document.getElementById('refund-modal').style.display = 'flex';
    };

    window.posCloseRefundModal = function() {
        document.getElementById('refund-modal').style.display = 'none';
    };

    window.posProcessRefund = async function() {
        const paymentId = document.getElementById('refund-payment-id').value;
        const type = document.getElementById('refund-type').value;
        const amount = parseFloat(document.getElementById('refund-amount').value);
        const reason = document.getElementById('refund-reason').value.trim();

        if (!amount || amount <= 0) return alert('Geçerli bir miktar giriniz');

        try {
            const meRes = await fetch('/api/me');
            const meData = await meRes.json();

            const res = await fetch(`/api/pos/payments/${paymentId}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': meData.csrfToken
                },
                body: JSON.stringify({
                    amount,
                    isPercentage: type === 'percentage',
                    reason
                })
            });
            const data = await res.json();

            if (data.ok) {
                posCloseRefundModal();
                loadHistoryPayments();
                if (window.showToast) window.showToast(`${formatAmount(data.refundAmount)}⛁ iade edildi`, 'success');
            } else {
                alert(data.error || 'Hata oluştu');
            }
        } catch (error) {
            alert('Bağlantı hatası');
        }
    };

    // ═══════════════════════════════════════════════════════════
    // SSE
    // ═══════════════════════════════════════════════════════════
    function connectSSE() {
        if (state.eventSource) state.eventSource.close();

        state.eventSource = new EventSource('/api/pos/stream');

        state.eventSource.addEventListener('pos_new', () => {
            loadActivePayments();
        });

        state.eventSource.addEventListener('pos_complete', () => {
            loadActivePayments();
            loadHistoryPayments();
            loadBalance();
        });

        state.eventSource.addEventListener('pos_cancel', () => {
            loadActivePayments();
        });

        state.eventSource.onerror = () => {
            setTimeout(connectSSE, 3000);
        };
    }

    // ═══════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════
    function init() {
        loadBalance();
        loadProducts();
        loadActivePayments();
        connectSSE();

        // Update timers
        setInterval(() => {
            if (state.activeTab === 'active') {
                renderActivePayments();
            }
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
