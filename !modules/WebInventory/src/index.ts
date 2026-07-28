import "../typings/xady";
import type { WebPanelApi } from "../../WebPanel/types/types/types";

export default class WebInventoryModule extends Xady.Module {
    private static instance: WebInventoryModule;

    static getInstance(): WebInventoryModule {
        return this.instance;
    }

    onLoad(): void {
        WebInventoryModule.instance = this;
    }

    onEnable(): void {
        console.log("[WebInventory] Modül yüklendi.");
        
        setTimeout(() => {
            const WebPanelModule = WebInventoryModule.getModule<any>("WebPanel");
            if (!WebPanelModule) {
                console.error("[WebInventory] WebPanel modülü bulunamadı!");
                return;
            }

            const webApi: WebPanelApi = WebPanelModule.webApi;
            if (!webApi) {
                console.error("[WebInventory] WebPanel API bulunamadı!");
                return;
            }

            webApi.registerView("/inventory", async (req: any, ctx: any) => {
                return this.renderInventory();
            });

            webApi.registerNav({
                id: "inventory",
                title: "Envanter",
                path: "/inventory",
                permission: "inventory.view",
                scope: "app"
            });

            webApi.registerPermission({
                id: "inventory.view",
                description: "Envanter görüntüleme",
                defaultRole: "user"
            });

            webApi.registerHttp(async (req: any, res: any, ctx: any) => {
                if (req.url?.startsWith("/api/inventory/toss") && req.method === "POST") {
                    return this.handleToss(req, res, ctx);
                }
                if (req.url?.startsWith("/api/inventory/eat") && req.method === "POST") {
                    return this.handleEat(req, res, ctx);
                }
                if (req.url?.startsWith("/api/inventory/swap") && req.method === "POST") {
                    return this.handleSwap(req, res, ctx);
                }
                if (req.url?.startsWith("/api/inventory/check") && req.method === "GET") {
                    return this.handleCheck(req, res, ctx);
                }
                return false;
            });

            console.log("[WebInventory] WebPanel'e envanter sayfası eklendi.");
        }, 1000);
    }

    onDisable(): void {
        console.log("[WebInventory] Modül kapatıldı.");
    }

    private async handleToss(req: any, res: any, ctx: any): Promise<boolean> {
        const bot = this.getBot();
        if (!bot) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: "Bot aktif değil" }));
            return true;
        }

        let body = "";
        for await (const chunk of req) {
            body += chunk.toString();
        }

        const data = JSON.parse(body);
        const { slot, count } = data;

        try {
            const item = bot.inventory.slots[slot];
            if (!item) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: false, error: "Slot boş" }));
                return true;
            }

            if (count === "all") {
                await bot.tossStack(item);
            } else {
                await bot.toss(item.type, null, parseInt(count));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
        } catch (error: any) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: error.message }));
        }

        return true;
    }

    private async handleEat(req: any, res: any, ctx: any): Promise<boolean> {
        const bot = this.getBot();
        if (!bot) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: "Bot aktif değil" }));
            return true;
        }

        let body = "";
        for await (const chunk of req) {
            body += chunk.toString();
        }

        const data = JSON.parse(body);
        const { slot } = data;

        try {
            const item = bot.inventory.slots[slot];
            if (!item) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: false, error: "Slot boş" }));
                return true;
            }

            await bot.equip(item, "hand");
            await bot.consume();

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
        } catch (error: any) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: error.message }));
        }

        return true;
    }

    private async handleSwap(req: any, res: any, ctx: any): Promise<boolean> {
        const bot = this.getBot();
        if (!bot) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: "Bot aktif değil" }));
            return true;
        }

        let body = "";
        for await (const chunk of req) {
            body += chunk.toString();
        }

        const data = JSON.parse(body);
        const { fromSlot, toSlot } = data;

        try {
            await bot.moveSlotItem(fromSlot, toSlot);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
        } catch (error: any) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: error.message }));
        }

        return true;
    }

    private lastInventoryHash: string = "";

    private async handleCheck(req: any, res: any, ctx: any): Promise<boolean> {
        const bot = this.getBot();
        if (!bot) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ changed: false }));
            return true;
        }

        const currentHash = JSON.stringify(bot.inventory.slots.map((s: any) => s ? `${s.name}:${s.count}` : null));
        const changed = currentHash !== this.lastInventoryHash;
        
        if (changed) {
            this.lastInventoryHash = currentHash;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ changed }));
        return true;
    }

    private renderInventory(): string {
        const bot = this.getBot();
        if (!bot) {
            return `
                <div style="padding: 20px;">
                    <div style="background: rgba(255, 0, 0, 0.1); border: 2px solid #dc3545; border-radius: 8px; padding: 20px; text-align: center;">
                        <h3 style="color: #dc3545; margin: 0;">Bot Aktif Değil!</h3>
                    </div>
                </div>
            `;
        }

        const inventory = bot.inventory;
        const slots = inventory.slots;

        let html = `
            <style>
                * { box-sizing: border-box; }
                body { background: #3b3b3b; margin: 0; padding: 0; }
                
                .mc-inventory-container {
                    max-width: 100%;
                    margin: 0;
                    font-family: 'Minecraft', 'Courier New', monospace;
                    background: #212121;
                    padding: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .mc-inventory {
                    background: #c6c6c6;
                    border: 4px solid #000;
                    box-shadow: 0 0 0 1px #555 inset, 0 0 0 2px #fff inset, 0 4px 8px rgba(0,0,0,0.5);
                    padding: 12px;
                    width: 650px;
                }
                
                .mc-title {
                    color: #404040;
                    font-size: 16px;
                    font-weight: normal;
                    margin: 0 0 12px 2px;
                    text-shadow: none;
                }
                
                .mc-section {
                    margin-bottom: 8px;
                }
                
                .mc-section-title {
                    color: #404040;
                    font-size: 13px;
                    margin: 12px 0 6px 2px;
                    font-weight: normal;
                }
                
                .mc-grid {
                    display: grid;
                    gap: 2px;
                }
                
                .mc-hotbar, .mc-main {
                    grid-template-columns: repeat(9, 64px);
                }
                
                .mc-armor {
                    grid-template-columns: repeat(4, 64px);
                }
                
                .mc-offhand {
                    grid-template-columns: 64px;
                }
                
                .mc-slot {
                    width: 64px;
                    height: 64px;
                    background: #8b8b8b;
                    border: 2px solid #000;
                    box-shadow: inset 2px 2px 0px #373737, inset -2px -2px 0px #fff;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.05s;
                }
                
                .mc-slot:hover {
                    background: #9d9d9d;
                }

                .mc-slot.dragging {
                    opacity: 0.5;
                    background: #6b6b6b;
                }

                .mc-slot.drag-over {
                    background: #adb;
                    box-shadow: inset 0 0 0 2px #4a4;
                }
                
                .mc-slot-empty {
                    opacity: 0.7;
                }
                
                .mc-slot-number {
                    position: absolute;
                    top: 2px;
                    left: 4px;
                    font-size: 11px;
                    color: #fff;
                    text-shadow: 1px 1px 0px #000;
                    font-weight: normal;
                    pointer-events: none;
                    z-index: 10;
                }
                
                .mc-item-icon {
                    width: 48px;
                    height: 48px;
                    image-rendering: pixelated;
                    image-rendering: -moz-crisp-edges;
                    image-rendering: crisp-edges;
                    pointer-events: none;
                }
                
                .mc-item-count {
                    position: absolute;
                    bottom: 2px;
                    right: 4px;
                    font-size: 14px;
                    color: #fff;
                    text-shadow: 2px 2px 0px #3f3f3f;
                    font-weight: bold;
                    pointer-events: none;
                    z-index: 10;
                }
                
                .mc-slot-label {
                    position: absolute;
                    bottom: 2px;
                    left: 4px;
                    font-size: 9px;
                    color: #404040;
                    font-weight: normal;
                    pointer-events: none;
                }

                .mc-tooltip {
                    position: fixed;
                    background: rgba(16, 0, 16, 0.94);
                    border: 2px solid rgba(80, 0, 160, 0.5);
                    border-top-color: rgba(100, 0, 200, 0.5);
                    border-left-color: rgba(100, 0, 200, 0.5);
                    padding: 6px 8px;
                    color: #fff;
                    font-size: 13px;
                    font-weight: normal;
                    text-shadow: 1px 1px 0px #000;
                    pointer-events: none;
                    z-index: 99999;
                    display: none;
                    white-space: nowrap;
                    box-shadow: 0 0 4px rgba(0,0,0,0.8);
                }

                .context-menu {
                    position: fixed;
                    background: #333;
                    border: 2px solid #000;
                    box-shadow: 2px 2px 8px rgba(0,0,0,0.5);
                    padding: 4px;
                    z-index: 9999;
                    display: none;
                    min-width: 180px;
                }

                .context-menu-item {
                    color: #fff;
                    padding: 6px 12px;
                    cursor: pointer;
                    font-size: 12px;
                    border-bottom: 1px solid #555;
                }

                .context-menu-item:last-child {
                    border-bottom: none;
                }

                .context-menu-item:hover {
                    background: #555;
                }

                .context-menu-disabled {
                    color: #888;
                    cursor: not-allowed;
                }

                .context-menu-disabled:hover {
                    background: transparent;
                }
            </style>
            
            <div class="mc-inventory-container">
                <div class="mc-inventory">
                    <div class="mc-title">Envanter</div>
                    
                    <div class="mc-section">
                        <div class="mc-section-title">Hızlı Erişim Çubuğu</div>
                        <div class="mc-grid mc-hotbar">
        `;

        for (let i = 36; i < 45; i++) {
            const item = slots[i];
            html += this.renderMinecraftSlot(i, item, i - 36);
        }

        html += `
                        </div>
                    </div>

                    <div class="mc-section">
                        <div class="mc-section-title">Ana Envanter</div>
                        <div class="mc-grid mc-main">
        `;

        for (let i = 9; i < 36; i++) {
            const item = slots[i];
            html += this.renderMinecraftSlot(i, item, null);
        }

        html += `
                        </div>
                    </div>

                    <div class="mc-section">
                        <div class="mc-section-title">Zırh</div>
                        <div class="mc-grid mc-armor">
        `;

        const armorSlots = [5, 6, 7, 8];
        const armorNames = ["Kask", "Göğ", "Pant", "Bot"];
        
        for (let i = 0; i < armorSlots.length; i++) {
            const item = slots[armorSlots[i]];
            html += this.renderMinecraftSlot(armorSlots[i], item, null, armorNames[i]);
        }

        html += `
                        </div>
                    </div>

                    <div class="mc-section">
                        <div class="mc-section-title">Sol El</div>
                        <div class="mc-grid mc-offhand">
        `;

        const offhand = slots[45];
        html += this.renderMinecraftSlot(45, offhand, null, "Sol");

        html += `
                        </div>
                    </div>
                </div>
            </div>

            <div id="contextMenu" class="context-menu"></div>
            <div id="mcTooltip" class="mc-tooltip"></div>

            <script>
                const contextMenu = document.getElementById('contextMenu');
                const mcTooltip = document.getElementById('mcTooltip');
                let currentSlot = null;
                let draggedSlot = null;

                // Auto-refresh every 2 seconds
                setInterval(() => {
                    fetch('/api/inventory/check')
                        .then(res => res.json())
                        .then(data => {
                            if (data.changed) {
                                window.location.reload();
                            }
                        })
                        .catch(() => {});
                }, 2000);

                document.addEventListener('click', () => {
                    contextMenu.style.display = 'none';
                });

                document.addEventListener('mousemove', (e) => {
                    if (mcTooltip.style.display === 'block') {
                        mcTooltip.style.left = (e.pageX + 12) + 'px';
                        mcTooltip.style.top = (e.pageY + 12) + 'px';
                    }
                });

                // Setup drag and drop for all slots
                document.querySelectorAll('.mc-slot').forEach(slot => {
                    slot.addEventListener('dragstart', (e) => {
                        if (slot.classList.contains('mc-slot-empty')) {
                            e.preventDefault();
                            return;
                        }
                        draggedSlot = slot;
                        slot.classList.add('dragging');
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('slot', slot.dataset.slot);
                        mcTooltip.style.display = 'none';
                    });

                    slot.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        if (draggedSlot && slot !== draggedSlot) {
                            slot.classList.add('drag-over');
                        }
                        e.dataTransfer.dropEffect = 'move';
                    });

                    slot.addEventListener('dragleave', () => {
                        slot.classList.remove('drag-over');
                    });

                    slot.addEventListener('dragend', () => {
                        document.querySelectorAll('.mc-slot').forEach(s => {
                            s.classList.remove('dragging');
                            s.classList.remove('drag-over');
                        });
                        draggedSlot = null;
                    });

                    slot.addEventListener('drop', async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        
                        slot.classList.remove('drag-over');
                        
                        if (draggedSlot && slot && draggedSlot !== slot) {
                            const fromSlot = parseInt(draggedSlot.dataset.slot);
                            const toSlot = parseInt(slot.dataset.slot);
                            
                            try {
                                const res = await fetch('/api/inventory/swap', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ fromSlot, toSlot })
                                });
                                const data = await res.json();
                                if (data.ok) {
                                    setTimeout(() => window.location.reload(), 200);
                                } else {
                                    alert('Hata: ' + data.error);
                                }
                            } catch (err) {
                                alert('İstek hatası: ' + err.message);
                            }
                        }
                        
                        if (draggedSlot) {
                            draggedSlot.classList.remove('dragging');
                        }
                        draggedSlot = null;
                    });
                    
                    slot.addEventListener('mouseenter', (e) => {
                        const itemDisplay = slot.dataset.itemDisplay;
                        if (itemDisplay && !slot.classList.contains('mc-slot-empty')) {
                            mcTooltip.textContent = itemDisplay;
                            mcTooltip.style.display = 'block';
                            mcTooltip.style.left = (e.pageX + 12) + 'px';
                            mcTooltip.style.top = (e.pageY + 12) + 'px';
                        }
                    });

                    slot.addEventListener('mouseleave', () => {
                        mcTooltip.style.display = 'none';
                    });

                    slot.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        
                        const slotIndex = slot.dataset.slot;
                        const isEmpty = slot.classList.contains('mc-slot-empty');
                        const itemNameStr = slot.dataset.itemName || '';
                        const isFood = itemNameStr.includes('apple') || itemNameStr.includes('bread') || 
                                     itemNameStr.includes('carrot') || itemNameStr.includes('potato') || 
                                     itemNameStr.includes('beef') || itemNameStr.includes('pork') || 
                                     itemNameStr.includes('chicken') || itemNameStr.includes('mutton') ||
                                     itemNameStr.includes('fish') || itemNameStr.includes('salmon') ||
                                     itemNameStr.includes('cookie') || itemNameStr.includes('melon') ||
                                     itemNameStr.includes('stew') || itemNameStr.includes('soup') ||
                                     itemNameStr.includes('berry') || itemNameStr.includes('chorus');

                        if (isEmpty) return;

                        currentSlot = slotIndex;
                        
                        let menuHTML = '';
                        menuHTML += '<div class="context-menu-item" onclick="tossItem(1)">1x At</div>';
                        menuHTML += '<div class="context-menu-item" onclick="tossItem(16)">16x At</div>';
                        menuHTML += '<div class="context-menu-item" onclick="tossItem(64)">64x At</div>';
                        menuHTML += '<div class="context-menu-item" onclick="tossCustom()">Özel Miktar At</div>';
                        
                        if (isFood) {
                            menuHTML += '<div class="context-menu-item" onclick="eatItem()">Ye</div>';
                        }
                        
                        contextMenu.innerHTML = menuHTML;
                        contextMenu.style.display = 'block';
                        contextMenu.style.left = e.pageX + 'px';
                        contextMenu.style.top = e.pageY + 'px';
                    });
                });

                async function tossItem(count) {
                    contextMenu.style.display = 'none';
                    try {
                        const res = await fetch('/api/inventory/toss', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ slot: parseInt(currentSlot), count: count.toString() })
                        });
                        const data = await res.json();
                        if (data.ok) {
                            setTimeout(() => window.location.reload(), 500);
                        } else {
                            alert('Hata: ' + data.error);
                        }
                    } catch (err) {
                        alert('İstek hatası: ' + err.message);
                    }
                }

                function tossCustom() {
                    contextMenu.style.display = 'none';
                    const count = prompt('Kaç adet atmak istiyorsunuz?');
                    if (count && !isNaN(count) && parseInt(count) > 0) {
                        tossItem(parseInt(count));
                    }
                }

                async function eatItem() {
                    contextMenu.style.display = 'none';
                    try {
                        const res = await fetch('/api/inventory/eat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ slot: parseInt(currentSlot) })
                        });
                        const data = await res.json();
                        if (data.ok) {
                            setTimeout(() => window.location.reload(), 500);
                        } else {
                            alert('Hata: ' + data.error);
                        }
                    } catch (err) {
                        alert('İstek hatası: ' + err.message);
                    }
                }
            </script>
        `;

        return html;
    }

    private renderMinecraftSlot(slotIndex: number, item: any, displayIndex: number | null, label?: string): string {
        const slotClass = item ? "mc-slot" : "mc-slot mc-slot-empty";
        const numberDisplay = displayIndex !== null ? `<div class="mc-slot-number">${displayIndex}</div>` : "";
        const labelDisplay = label ? `<div class="mc-slot-label">${label}</div>` : "";
        
        if (!item) {
            return `
                <div class="${slotClass}" data-slot="${slotIndex}">
                    ${numberDisplay}
                    ${labelDisplay}
                </div>
            `;
        }

        const itemId = item.name;
        const displayName = item.displayName || itemId;
        const count = item.count > 1 ? `<div class="mc-item-count">${item.count}</div>` : "";

        return `
            <div class="${slotClass}" 
                 data-slot="${slotIndex}" 
                 data-item-name="${itemId}"
                 data-item-display="${displayName}"
                 draggable="true">
                ${numberDisplay}
                <img src="https://minecraftitemids.com/item/32/${itemId}.png" 
                     class="mc-item-icon" 
                     alt="${itemId}"
                     onerror="this.onerror=null; this.src='https://mc-heads.net/minecraft/item/${itemId}/48.png';">
                ${count}
                ${labelDisplay}
            </div>
        `;
    }
}
