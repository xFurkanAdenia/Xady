// POS Terminal JavaScript Module
(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════
    const state = {
        activePayments: {},
        historyPayments: [],
        eventSource: null,
        currentTab: 'active'
    };

    // ═══════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    const utils = {
        formatAmount(amount) {
            if (amount == null) return '-';
            return Number(amount).toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        formatTime(timestamp) {
            if (!timestamp) return '-';
            return new Date(timestamp).toLocaleString('tr-TR');
        },

        escape(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        getBadgeClass(status) {
            const classes = {
                'success': 'success',
                'pending': 'pending',
                'cancelled': 'cancelled',
                'timeout': 'timeout'
            };
            return classes[status] || 'pending';
        },

        getBadgeLabel(status) {
            const labels = {
                'success': '✅ Tamamlandı',
                'pending': '⏳ Bekliyor',
                'cancelled': '❌ İptal',
                'timeout': '⌛ Zaman Aşımı'
            };
            return labels[status] || '⏳ Bekliyor';
        }
    };

    // ═══════════════════════════════════════════════════════════
    // TAB MANAGEMENT
    // ═══════════════════════════════════════════════════════════
    const tabs = {
        show(tabName) {
            state.currentTab = tabName;

            // Update tab buttons
            document.querySelectorAll('.pos-tab').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });

            // Update tab content
            document.querySelectorAll('.pos-tab-content').forEach(content => {
                content.classList.toggle('active', content.id === `pos-tab-${tabName}`);
            });
        }
    };

    // ═══════════════════════════════════════════════════════════
    // RENDER FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    const render = {
        activePaymentCard(payment) {
            const card = document.createElement('div');
            card.className = 'pos-card status-pending';
            card.id = `pcard-${payment.id}`;
            card.innerHTML = `
                <div class="pos-card-header">
                    <div>
                        <div class="pos-card-user">👤 ${utils.escape(payment.username)}</div>
                        <span class="pos-badge pending">${utils.getBadgeLabel(payment.status)}</span>
                    </div>
                    <div class="pos-card-amount">${utils.formatAmount(payment.amount)}⛁</div>
                </div>
                ${payment.description ? `<div class="pos-card-description">📝 ${utils.escape(payment.description)}</div>` : ''}
                <div class="pos-card-meta">
                    <div>🕐 ${utils.formatTime(payment.createdAt)}</div>
                    <div>👤 Oluşturan: ${utils.escape(payment.createdBy)}</div>
                </div>
                <div class="pos-timer">
                    <div class="pos-timer-fill" id="timer-${payment.id}" style="width: 100%"></div>
                </div>
                <div class="pos-card-actions">
                    <button class="btn btn-danger btn-sm" onclick="posCancel('${payment.id}')">
                        ❌ İptal
                    </button>
                </div>
            `;
            return card;
        },

        historyPaymentCard(payment) {
            const card = document.createElement('div');
            card.className = `pos-card status-${payment.status}`;
            
            const totalRefunded = payment.totalRefunded || 0;
            const netAmount = payment.amount - totalRefunded;
            const hasRefunds = totalRefunded > 0;
            
            const refundBtn = payment.status === 'success' ? `
                <button class="btn btn-warning btn-sm" onclick="posShowRefundModal('${payment.id}')">
                    ↩️ İade
                </button>
            ` : '';

            const detailBtn = hasRefunds ? `
                <button class="btn btn-info btn-sm" onclick="posShowDetailModal('${payment.id}')">
                    📋 Detaylar
                </button>
            ` : '';

            const refundInfo = hasRefunds ? `
                <div class="pos-card-refund-info">
                    <div class="pos-refund-label">Net Tutar: ${utils.formatAmount(netAmount)}⛁</div>
                    <div class="pos-refund-amount">İade Edilen: ${utils.formatAmount(totalRefunded)}⛁</div>
                </div>
            ` : '';

            card.innerHTML = `
                <div class="pos-card-header">
                    <div>
                        <div class="pos-card-user">👤 ${utils.escape(payment.username)}</div>
                        <span class="pos-badge ${utils.getBadgeClass(payment.status)}">${utils.getBadgeLabel(payment.status)}</span>
                    </div>
                    <div class="pos-card-amount">${utils.formatAmount(payment.amount)}⛁</div>
                </div>
                ${payment.description ? `<div class="pos-card-description">📝 ${utils.escape(payment.description)}</div>` : ''}
                ${refundInfo}
                <div class="pos-card-meta">
                    <div>🕐 ${utils.formatTime(payment.createdAt)} → ${utils.formatTime(payment.completedAt)}</div>
                    ${payment.sendedMoney ? `<div>💸 Ödenen: ${utils.formatAmount(payment.sendedMoney)}⛁</div>` : ''}
                    ${payment.change > 0 ? `<div>🔄 Para üstü: ${utils.formatAmount(payment.change)}⛁</div>` : ''}
                </div>
                ${refundBtn || detailBtn ? `<div class="pos-card-actions">${refundBtn}${detailBtn}</div>` : ''}
            `;
            return card;
        },

        activePayments() {
            const container = document.getElementById('pos-active-grid');
            container.innerHTML = '';

            const payments = Object.values(state.activePayments);
            
            if (payments.length === 0) {
                container.innerHTML = `
                    <div class="pos-empty">
                        <div class="pos-empty-icon">💳</div>
                        <div class="pos-empty-text">Bekleyen ödeme bulunmuyor</div>
                    </div>
                `;
            } else {
                payments.forEach(payment => {
                    container.appendChild(this.activePaymentCard(payment));
                });
            }

            document.getElementById('pos-count-pending').textContent = payments.length;
        },

        historyPayments() {
            const container = document.getElementById('pos-history-grid');
            container.innerHTML = '';

            if (state.historyPayments.length === 0) {
                container.innerHTML = `
                    <div class="pos-empty">
                        <div class="pos-empty-icon">📋</div>
                        <div class="pos-empty-text">Henüz tamamlanan ödeme yok</div>
                    </div>
                `;
            } else {
                state.historyPayments.forEach(payment => {
                    container.appendChild(this.historyPaymentCard(payment));
                });
            }

            const successCount = state.historyPayments.filter(p => p.status === 'success').length;
            document.getElementById('pos-count-done').textContent = successCount;
        },

        updateTimers() {
            const now = Date.now();
            Object.values(state.activePayments).forEach(payment => {
                const timerEl = document.getElementById(`timer-${payment.id}`);
                if (!timerEl) return;

                const timeout = 15 * 60 * 1000; // 15 minutes
                const elapsed = now - payment.createdAt;
                const percentage = Math.max(0, 100 - (elapsed / timeout * 100));

                timerEl.style.width = `${percentage}%`;
                
                if (percentage < 20) {
                    timerEl.classList.add('danger');
                    timerEl.classList.remove('warning');
                } else if (percentage < 50) {
                    timerEl.classList.add('warning');
                    timerEl.classList.remove('danger');
                } else {
                    timerEl.classList.remove('warning', 'danger');
                }
            });
        }
    };

    // ═══════════════════════════════════════════════════════════
    // API FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    const api = {
        async loadPayments() {
            try {
                const [activeRes, historyRes] = await Promise.all([
                    fetch('/api/pos/payments').then(r => r.json()),
                    fetch('/api/pos/history').then(r => r.json())
                ]);

                if (activeRes.ok) {
                    state.activePayments = {};
                    activeRes.payments.forEach(p => {
                        state.activePayments[p.id] = p;
                    });
                }

                if (historyRes.ok) {
                    state.historyPayments = historyRes.payments;
                }

                render.activePayments();
                render.historyPayments();
            } catch (error) {
                console.error('[WebPos] Load payments error:', error);
            }
        },

        async createPayment(username, amount, description) {
            try {
                const res = await fetch('/api/pos/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, amount, description })
                });
                const data = await res.json();
                return data;
            } catch (error) {
                console.error('[WebPos] Create payment error:', error);
                return { ok: false, error: 'Bağlantı hatası' };
            }
        },

        async cancelPayment(id) {
            try {
                const res = await fetch(`/api/pos/payments/${id}`, {
                    method: 'DELETE'
                });
                return await res.json();
            } catch (error) {
                console.error('[WebPos] Cancel payment error:', error);
                return { ok: false, error: 'Bağlantı hatası' };
            }
        },

        async refundPayment(id, amount, isPercentage, reason) {
            try {
                const res = await fetch(`/api/pos/payments/${id}/refund`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, isPercentage, reason })
                });
                return await res.json();
            } catch (error) {
                console.error('[WebPos] Refund payment error:', error);
                return { ok: false, error: 'Bağlantı hatası' };
            }
        }
    };

    // ═══════════════════════════════════════════════════════════
    // EVENT SOURCE (SSE)
    // ═══════════════════════════════════════════════════════════
    const sse = {
        connect() {
            if (state.eventSource) {
                state.eventSource.close();
            }

            state.eventSource = new EventSource('/api/pos/stream');

            state.eventSource.addEventListener('pos_new', (e) => {
                const payment = JSON.parse(e.data);
                state.activePayments[payment.id] = payment;
                render.activePayments();
                if (window.showToast) {
                    window.showToast(`💳 Yeni ödeme: ${payment.username}`, 'info');
                }
            });

            state.eventSource.addEventListener('pos_complete', (e) => {
                const payment = JSON.parse(e.data);
                delete state.activePayments[payment.id];
                state.historyPayments.unshift(payment);
                if (state.historyPayments.length > 100) {
                    state.historyPayments.pop();
                }
                render.activePayments();
                render.historyPayments();
                if (window.showToast) {
                    window.showToast(`✅ Ödeme tamamlandı: ${payment.username}`, 'success');
                }
            });

            state.eventSource.addEventListener('pos_cancel', (e) => {
                const payment = JSON.parse(e.data);
                delete state.activePayments[payment.id];
                state.historyPayments.unshift(payment);
                if (state.historyPayments.length > 100) {
                    state.historyPayments.pop();
                }
                render.activePayments();
                render.historyPayments();
                if (window.showToast) {
                    window.showToast(`❌ Ödeme iptal edildi: ${payment.username}`, 'warning');
                }
            });

            state.eventSource.onerror = () => {
                setTimeout(() => this.connect(), 3000);
            };
        }
    };

    // ═══════════════════════════════════════════════════════════
    // MODAL MANAGEMENT
    // ═══════════════════════════════════════════════════════════
    const modal = {
        show(modalId) {
            const modalEl = document.getElementById(modalId);
            if (modalEl) {
                modalEl.classList.add('show');
            }
        },

        hide(modalId) {
            const modalEl = document.getElementById(modalId);
            if (modalEl) {
                modalEl.classList.remove('show');
            }
        }
    };

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API (Global Functions)
    // ═══════════════════════════════════════════════════════════
    window.posShowTab = (tabName) => tabs.show(tabName);

    window.posCreatePayment = async () => {
        const username = document.getElementById('pos-new-username').value.trim();
        const amount = parseFloat(document.getElementById('pos-new-amount').value);
        const description = document.getElementById('pos-new-desc').value.trim();

        if (!username) {
            if (window.showToast) window.showToast('Oyuncu adı giriniz', 'warning');
            return;
        }

        if (!amount || amount <= 0) {
            if (window.showToast) window.showToast('Geçerli bir tutar giriniz', 'warning');
            return;
        }

        const btn = document.getElementById('pos-create-btn');
        btn.disabled = true;
        btn.textContent = 'Oluşturuluyor...';

        const result = await api.createPayment(username, amount, description);

        if (result.ok) {
            document.getElementById('pos-new-username').value = '';
            document.getElementById('pos-new-amount').value = '';
            document.getElementById('pos-new-desc').value = '';
            state.activePayments[result.payment.id] = result.payment;
            render.activePayments();
            tabs.show('active');
            if (window.showToast) window.showToast('Ödeme oluşturuldu', 'success');
        } else {
            if (window.showToast) window.showToast(result.error || 'Hata oluştu', 'danger');
        }

        btn.disabled = false;
        btn.textContent = '💳 Ödeme Oluştur';
    };

    window.posCancel = async (id) => {
        if (!confirm('Bu ödemeyi iptal etmek istediğinize emin misiniz?')) return;

        const result = await api.cancelPayment(id);
        if (result.ok) {
            if (window.showToast) window.showToast('Ödeme iptal edildi', 'success');
        } else {
            if (window.showToast) window.showToast(result.error || 'Hata oluştu', 'danger');
        }
    };

    window.posShowRefundModal = (paymentId) => {
        const payment = state.historyPayments.find(p => p.id === paymentId);
        if (!payment) return;

        const totalRefunded = payment.totalRefunded || 0;
        const availableAmount = (payment.sendedMoney || payment.amount) - totalRefunded;

        document.getElementById('refund-payment-id').value = paymentId;
        document.getElementById('refund-amount').value = '';
        document.getElementById('refund-reason').value = '';
        document.getElementById('refund-max-amount').textContent = utils.formatAmount(availableAmount);
        document.getElementById('refund-username').textContent = payment.username;
        
        if (availableAmount <= 0) {
            if (window.showToast) window.showToast('Bu ödeme tamamen iade edilmiş', 'warning');
            return;
        }

        modal.show('pos-refund-modal');
    };

    window.posShowDetailModal = (paymentId) => {
        const payment = state.historyPayments.find(p => p.id === paymentId);
        if (!payment) return;

        const totalRefunded = payment.totalRefunded || 0;
        const netAmount = payment.amount - totalRefunded;
        const refunds = payment.refunds || [];

        let refundHistoryHtml = '';
        if (refunds.length > 0) {
            refundHistoryHtml = refunds.map(refund => `
                <tr>
                    <td>${utils.formatTime(refund.refundedAt)}</td>
                    <td>${utils.formatAmount(refund.amount)}⛁</td>
                    <td>${utils.escape(refund.refundedBy)}</td>
                    <td>${refund.reason ? utils.escape(refund.reason) : '-'}</td>
                </tr>
            `).join('');
        } else {
            refundHistoryHtml = '<tr><td colspan="4" class="text-center">İade geçmişi bulunamadı</td></tr>';
        }

        document.getElementById('detail-username').textContent = payment.username;
        document.getElementById('detail-original-amount').textContent = utils.formatAmount(payment.amount);
        document.getElementById('detail-total-refunded').textContent = utils.formatAmount(totalRefunded);
        document.getElementById('detail-net-amount').textContent = utils.formatAmount(netAmount);
        document.getElementById('detail-refund-history').innerHTML = refundHistoryHtml;

        modal.show('pos-detail-modal');
    };

    window.posCloseDetailModal = () => {
        modal.hide('pos-detail-modal');
    };

    window.posCloseRefundModal = () => {
        modal.hide('pos-refund-modal');
    };

    window.posToggleRefundType = (type) => {
        document.querySelectorAll('.pos-refund-toggle button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        document.getElementById('refund-type').value = type;
        
        const input = document.getElementById('refund-amount');
        if (type === 'percentage') {
            input.placeholder = '0-100';
            input.max = '100';
        } else {
            input.placeholder = '0.00';
            input.removeAttribute('max');
        }
    };

    window.posProcessRefund = async () => {
        const paymentId = document.getElementById('refund-payment-id').value;
        const amount = parseFloat(document.getElementById('refund-amount').value);
        const type = document.getElementById('refund-type').value;
        const reason = document.getElementById('refund-reason').value.trim();
        const isPercentage = type === 'percentage';

        if (!amount || amount <= 0) {
            if (window.showToast) window.showToast('Geçerli bir miktar giriniz', 'warning');
            return;
        }

        if (isPercentage && amount > 100) {
            if (window.showToast) window.showToast('Yüzde 100\'den fazla olamaz', 'warning');
            return;
        }

        const btn = document.getElementById('refund-confirm-btn');
        btn.disabled = true;
        btn.textContent = 'İşleniyor...';

        const result = await api.refundPayment(paymentId, amount, isPercentage, reason);

        if (result.ok) {
            modal.hide('pos-refund-modal');
            if (window.showToast) window.showToast('İade işlemi başarılı', 'success');
            await api.loadPayments();
        } else {
            if (window.showToast) window.showToast(result.error || 'İade işlemi başarısız', 'danger');
        }

        btn.disabled = false;
        btn.textContent = '✓ İade Et';
    };

    // ═══════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        api.loadPayments();
        sse.connect();
        setInterval(() => render.updateTimers(), 1000);
    });

    // If DOM already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            api.loadPayments();
            sse.connect();
            setInterval(() => render.updateTimers(), 1000);
        }, 1);
    }
})();
