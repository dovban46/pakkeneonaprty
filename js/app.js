// ========================
// App State & Navigation
// ========================

const App = {
    currentView: 'dashboard',
    currentListId: null,
    currentBoxId: null,
    currentVehicleProfileId: null,
    currentEventId: null,
    currentCheckInId: null,
    currentCustomerId: null,
    currentVenueId: null,
    currentInquiryId: null,
    currentOfferId: null,
    packingTab: 'products',
    salesTab: 'contracts',
    scannerMode: null,
    vehicleLoadListId: null,
    cameraStream: null,
    scanInterval: null,
};

function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const view = document.getElementById(`view-${viewName}`);
    if (view) {
        view.classList.remove('hidden');
        view.querySelector('.slide-up-enter')?.classList.remove('slide-up-enter');
    }
    App.currentView = viewName;

    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'packing') renderPacking();
    if (viewName === 'vehicle') renderVehicle();
    if (viewName === 'vehicle-profile') renderVehicleProfile();
    if (viewName === 'events') renderEvents();
    if (viewName === 'event-detail') renderEventDetail();
    if (viewName === 'checkin') renderCheckIn();
    if (viewName === 'crew') renderCrew();
    if (viewName === 'service') renderService();
    if (viewName === 'sales') renderSales();
    if (viewName === 'contracts') { showView('sales'); return; }
    if (viewName === 'contract-detail') renderContractDetail();
    if (viewName === 'vehicle-trip') renderVehicleTrip();
    if (viewName === 'customer-detail') renderCustomerDetail();
    if (viewName === 'venue-detail') renderVenueDetail();
    if (viewName === 'inquiry-detail') renderInquiryDetail();
    if (viewName === 'offer-editor') renderOfferEditor();
    if (viewName === 'offer-preview') renderOfferPreview();

    const parentViews = {
        'list-detail': 'packing', 'box-detail': 'packing',
        'vehicle-profile': 'vehicle', 'vehicle-load': 'vehicle',
        'vehicle-trip': 'vehicle',
        'event-detail': 'events', 'checkin': 'events',
        'contract-detail': 'sales', 'contract-preview': 'sales',
        'customer-detail': 'sales', 'venue-detail': 'sales',
        'inquiry-detail': 'sales', 'offer-editor': 'sales', 'offer-preview': 'sales',
    };
    const navTarget = parentViews[viewName] || viewName;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-btn[data-view="${navTarget}"]`);
    if (navBtn) navBtn.classList.add('active');
}

// ========================
// Toast Notification
// ========================

function toast(message, type = '') {
    let el = document.querySelector('.toast');
    if (!el) {
        el = document.createElement('div');
        el.className = 'toast';
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = `toast ${type}`;
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => el.classList.remove('show'), 2500);
}

// ========================
// Modal
// ========================

function openModal(title, bodyHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    stopCamera();
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// ========================
// Barcode Rendering
// ========================

function renderBarcode(svgId, code, options = {}) {
    try {
        JsBarcode(`#${svgId}`, code, {
            format: 'CODE128',
            width: options.width || 2,
            height: options.height || 60,
            displayValue: true,
            fontSize: options.fontSize || 14,
            margin: 5,
            background: 'transparent',
            lineColor: options.lineColor || '#000',
        });
    } catch {
        const el = document.getElementById(svgId);
        if (el) el.outerHTML = `<span class="text-red-400 text-xs">Ugyldig strekkode</span>`;
    }
}

// ========================
// Dashboard
// ========================

function renderDashboard() {
    const setStatSafe = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setStatSafe('stat-products', DB.getProducts().length);
    setStatSafe('stat-boxes', DB.getBoxes().length);
    setStatSafe('stat-vehicle', DB.getAllVehicleItemCount());
    setStatSafe('stat-events', DB.getEvents().length);
    setStatSafe('stat-crew', DB.getUsers().length);
    setStatSafe('stat-issues', DB.getOpenIssueReports().length);
    const newInquiries = DB.getNewInquiriesCount();
    const totalSales = newInquiries + DB.getOffers().length + (typeof DB.getContracts === 'function' ? DB.getContracts().length : 0);
    setStatSafe('stat-contracts', totalSales);

    const activeUser = DB.getActiveUser();
    const userIndicator = document.getElementById('dashboard-user-indicator');
    if (activeUser) {
        userIndicator.classList.remove('hidden');
        userIndicator.innerHTML = `<div class="flex items-center gap-3">
            <div class="user-avatar" style="background:${activeUser.avatarColor || '#ff2d95'}">${activeUser.name.charAt(0).toUpperCase()}</div>
            <div class="flex-1"><div class="text-xs text-gray-400">Aktiv bruker</div><div class="font-semibold text-sm">${esc(activeUser.name)}</div></div>
        </div>`;
    } else {
        userIndicator.classList.remove('hidden');
        userIndicator.innerHTML = `<p class="text-sm text-gray-400 text-center">Ingen bruker valgt — trykk for å velge</p>`;
    }

    const activeEvents = DB.getActiveEvents();
    const eventAlert = document.getElementById('dashboard-event-alert');
    const eventText = document.getElementById('dashboard-event-text');
    if (activeEvents.length > 0) {
        eventAlert.classList.remove('hidden');
        eventText.textContent = `${activeEvents.length} aktiv${activeEvents.length > 1 ? 'e' : 't'} arrangement`;
    } else {
        eventAlert.classList.add('hidden');
    }

    const pendingCount = DB.getPendingServiceCount();
    const alertEl = document.getElementById('dashboard-service-alert');
    const alertText = document.getElementById('dashboard-service-text');
    if (pendingCount > 0) {
        alertEl.classList.remove('hidden');
        alertText.textContent = `${pendingCount} produkt${pendingCount > 1 ? 'er' : ''} trenger service`;
    } else {
        alertEl.classList.add('hidden');
    }

    const inquiryAlert = document.getElementById('dashboard-inquiry-alert');
    const inquiryText = document.getElementById('dashboard-inquiry-text');
    if (inquiryAlert) {
        if (newInquiries > 0) {
            inquiryAlert.classList.remove('hidden');
            inquiryText.textContent = `${newInquiries} ny${newInquiries > 1 ? 'e' : ''} forespørsel${newInquiries > 1 ? 'er' : ''}`;
        } else {
            inquiryAlert.classList.add('hidden');
        }
    }

    updateServiceBadge();
    updateEventBadge();
    updateInquiryBadge();

    const logEl = document.getElementById('activity-log');
    const log = DB.getActivityLog();
    if (log.length === 0) {
        logEl.innerHTML = '<p class="italic text-gray-500">Ingen aktivitet ennå</p>';
    } else {
        logEl.innerHTML = log.slice(0, 10).map(entry => {
            const date = new Date(entry.timestamp);
            const timeStr = date.toLocaleString('nb-NO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            return `<div class="flex justify-between items-center py-1 border-b border-dark-700 last:border-0">
                <span>${entry.message}</span>
                <span class="text-gray-500 text-xs ml-2 shrink-0">${timeStr}</span>
            </div>`;
        }).join('');
    }
}

// ========================
// Packing (combined view)
// ========================

function renderPacking() {
    switchPackingTab(App.packingTab || 'products');
}

function switchPackingTab(tab) {
    App.packingTab = tab;
    document.querySelectorAll('.packing-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.packing-tab[data-packing-tab="${tab}"]`);
    if (activeTab) activeTab.classList.add('active');

    document.querySelectorAll('.packing-tab-content').forEach(c => c.classList.add('hidden'));
    const content = document.getElementById(`packing-tab-${tab}`);
    if (content) content.classList.remove('hidden');

    if (tab === 'products') renderProducts();
    if (tab === 'lists') renderPackingLists();
    if (tab === 'boxes') renderBoxes();
}

// ========================
// Products
// ========================

function renderProducts() {
    const products = DB.getProducts();
    const search = document.getElementById('search-products').value.toLowerCase();
    const filtered = search
        ? products.filter(p => p.name.toLowerCase().includes(search) || p.barcode.toLowerCase().includes(search) || (p.category || '').toLowerCase().includes(search))
        : products;

    const container = document.getElementById('products-list');
    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <p>${search ? 'Ingen treff' : 'Ingen produkter ennå'}</p>
            <p class="text-sm mt-1">${search ? 'Prøv et annet søkeord' : 'Trykk + for å legge til'}</p>
        </div>`;
        return;
    }

    container.innerHTML = filtered.map(p => `
        <div class="bg-dark-800 rounded-xl p-3 border border-dark-600 slide-up-enter">
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <div class="font-semibold truncate">${esc(p.name)}${p.alwaysInclude ? ' <span class="inline-block text-xs px-1.5 py-0.5 rounded-full bg-neon-green/15 text-neon-green font-normal align-middle ml-1">Alltid med</span>' : ''}</div>
                    <div class="text-xs text-gray-400 mt-0.5">${esc(p.category || 'Ingen kategori')}</div>
                    <div class="text-xs text-gray-500 mt-0.5">${p.unitsPerPackage > 1 ? `${p.unitsPerPackage} enheter per pakke` : '1 enhet'}</div>
                </div>
                <div class="flex gap-1 ml-2 shrink-0">
                    <button onclick="showProductLabel('${p.id}')" class="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors" title="Vis etikett">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                    </button>
                    <button onclick="editProduct('${p.id}')" class="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors" title="Rediger">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onclick="deleteProduct('${p.id}')" class="p-1.5 rounded-lg bg-dark-700 hover:bg-red-900/30 transition-colors text-gray-400 hover:text-red-400" title="Slett">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </div>
            <div class="mt-2 barcode-container">
                <svg id="barcode-${p.id}"></svg>
            </div>
        </div>
    `).join('');

    filtered.forEach(p => {
        requestAnimationFrame(() => renderBarcode(`barcode-${p.id}`, p.barcode, { height: 40, width: 1.5, fontSize: 12 }));
    });
}

function showProductForm(product = null) {
    const isEdit = !!product;
    openModal(isEdit ? 'Rediger produkt' : 'Nytt produkt', `
        <form id="product-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Produktnavn *</label>
                <input type="text" id="pf-name" value="${esc(product?.name || '')}" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Kategori</label>
                <input type="text" id="pf-category" value="${esc(product?.category || '')}" placeholder="f.eks. Lyd, Lys, Kabel..." class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Beskrivelse</label>
                <textarea id="pf-description" rows="2" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none resize-none">${esc(product?.description || '')}</textarea>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Enheter per pakke/flight</label>
                <input type="number" id="pf-units" value="${product?.unitsPerPackage || 1}" min="1" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                <p class="text-xs text-gray-500 mt-1">Hvor mange enheter er det i en pakke? F.eks. 12 for en kasse med 12 stk.</p>
            </div>
            <label class="flex items-center gap-3 p-3 rounded-lg bg-dark-700 cursor-pointer hover:bg-dark-600 transition-colors">
                <input type="checkbox" id="pf-always-include" ${product?.alwaysInclude ? 'checked' : ''} class="rounded">
                <div>
                    <div class="text-sm font-medium">Bør alltid være med</div>
                    <div class="text-xs text-gray-500">Vises som forslag når du oppretter nye pakkelister</div>
                </div>
            </label>
            ${isEdit ? `<div>
                <label class="block text-sm text-gray-400 mb-1">Strekkode</label>
                <input type="text" id="pf-barcode" value="${esc(product.barcode)}" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm bg-dark-900 text-gray-500" readonly>
            </div>` : ''}
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">${isEdit ? 'Lagre endringer' : 'Opprett produkt'}</button>
        </form>
    `);

    document.getElementById('product-form').addEventListener('submit', e => {
        e.preventDefault();
        const data = {
            name: document.getElementById('pf-name').value.trim(),
            category: document.getElementById('pf-category').value.trim(),
            description: document.getElementById('pf-description').value.trim(),
            unitsPerPackage: parseInt(document.getElementById('pf-units').value) || 1,
            alwaysInclude: document.getElementById('pf-always-include').checked,
        };
        if (!data.name) return toast('Navn er påkrevd', 'error');

        if (isEdit) {
            DB.updateProduct(product.id, data);
            toast('Produkt oppdatert', 'success');
        } else {
            DB.addProduct(data);
            toast('Produkt opprettet', 'success');
        }
        closeModal();
        renderProducts();
    });
}

function editProduct(id) {
    const product = DB.getProduct(id);
    if (product) showProductForm(product);
}

function deleteProduct(id) {
    const product = DB.getProduct(id);
    if (!product) return;
    openModal('Slett produkt', `
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette <strong>${esc(product.name)}</strong>?</p>
        <div class="flex gap-2">
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors">Avbryt</button>
            <button id="confirm-delete-product" class="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Slett</button>
        </div>
    `);
    document.getElementById('confirm-delete-product').addEventListener('click', () => {
        DB.deleteProduct(id);
        closeModal();
        renderProducts();
        toast('Produkt slettet', 'success');
    });
}

function showProductLabel(id) {
    const product = DB.getProduct(id);
    if (!product) return;
    openModal('Produktetikett', `
        <div class="label-preview" id="product-label-preview">
            <div class="label-title">${esc(product.name)}</div>
            <div class="label-subtitle">${esc(product.category || '')}</div>
            <div class="label-barcode"><svg id="label-barcode-preview"></svg></div>
            <div class="label-info">${product.unitsPerPackage > 1 ? `${product.unitsPerPackage} enheter per pakke` : '1 enhet'}</div>
            ${product.description ? `<div class="label-info" style="margin-top:2mm;color:#666">${esc(product.description)}</div>` : ''}
        </div>
        <button id="btn-print-product-label" class="w-full mt-4 py-2.5 rounded-lg font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-colors">Skriv ut A6 etikett</button>
    `);
    renderBarcode('label-barcode-preview', product.barcode, { width: 2, height: 70, fontSize: 16 });

    document.getElementById('btn-print-product-label').addEventListener('click', () => {
        printLabel(buildProductLabelHTML(product));
    });
}

function buildProductLabelHTML(product) {
    return `<div class="label-a6">
        <div class="label-title">${esc(product.name)}</div>
        <div class="label-subtitle">${esc(product.category || '')}</div>
        <div class="label-barcode"><svg id="print-barcode"></svg></div>
        <div class="label-info">${product.unitsPerPackage > 1 ? `${product.unitsPerPackage} enheter per pakke` : '1 enhet'}</div>
        ${product.description ? `<div class="label-info" style="margin-top:2mm;color:#666">${esc(product.description)}</div>` : ''}
    </div>`;
}

// ========================
// Packing Lists
// ========================

function renderPackingLists() {
    const lists = DB.getPackingLists();
    const container = document.getElementById('packing-lists');

    if (lists.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <p>Ingen pakkelister ennå</p>
            <p class="text-sm mt-1">Trykk + for å opprette en</p>
        </div>`;
        return;
    }

    container.innerHTML = lists.map(list => {
        const total = list.items.length;
        const packed = list.items.filter(i => i.packed).length;
        const pct = total > 0 ? Math.round((packed / total) * 100) : 0;
        const date = new Date(list.date || list.createdAt).toLocaleDateString('nb-NO');
        return `
        <div class="bg-dark-800 rounded-xl p-4 border border-dark-600 cursor-pointer hover:border-neon-blue/30 transition-colors slide-up-enter" onclick="openListDetail('${list.id}')">
            <div class="flex items-start justify-between">
                <div>
                    <div class="font-semibold">${esc(list.name)}</div>
                    <div class="text-sm text-gray-400">${esc(list.jobName || 'Ingen jobb')}</div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs px-2 py-1 rounded-full ${pct === 100 ? 'bg-neon-green/20 text-neon-green' : 'bg-dark-700 text-gray-400'}">${packed}/${total}</span>
                    <button onclick="event.stopPropagation(); deletePackingList('${list.id}')" class="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </div>
            <div class="mt-2">
                <div class="w-full bg-dark-700 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-neon-green' : 'bg-neon-blue'}" style="width: ${pct}%"></div>
                </div>
            </div>
            <div class="text-xs text-gray-500 mt-2">${date}</div>
        </div>`;
    }).join('');
}

function showPackingListForm() {
    const alwaysProducts = DB.getAlwaysIncludeProducts();
    const alwaysBoxes = DB.getAlwaysIncludeBoxes();
    const hasDefaults = alwaysProducts.length > 0 || alwaysBoxes.length > 0;

    openModal('Ny pakkeliste', `
        <form id="list-form" class="space-y-4">
            <div id="lf-step-1">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Navn på liste *</label>
                        <input type="text" id="lf-name" placeholder="f.eks. Festival Stavanger" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Jobb/Event</label>
                        <input type="text" id="lf-job" placeholder="f.eks. Neonparty Stavanger" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Dato</label>
                        <input type="date" id="lf-date" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                    ${hasDefaults ? `<button type="button" id="lf-next-step" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Neste</button>` : `<button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Opprett liste</button>`}
                </div>
            </div>
            <div id="lf-step-2" class="hidden">
                <div class="space-y-4">
                    <p class="text-sm text-gray-400">Velg hvilke standardprodukter og bokser som skal legges til automatisk:</p>
                    ${alwaysProducts.length > 0 ? `
                        <div>
                            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Produkter</h4>
                            <div class="space-y-2 max-h-48 overflow-y-auto">
                                ${alwaysProducts.map(p => `
                                    <label class="flex items-center gap-3 p-2 rounded-lg bg-dark-700 cursor-pointer hover:bg-dark-600 transition-colors">
                                        <input type="checkbox" checked value="${p.id}" data-type="product" data-name="${esc(p.name)}" class="lf-default-item rounded">
                                        <div class="flex-1 min-w-0">
                                            <div class="text-sm font-medium truncate">${esc(p.name)}</div>
                                            <div class="text-xs text-gray-500">${esc(p.category || 'Ingen kategori')}</div>
                                        </div>
                                        <input type="number" value="1" min="1" data-qty-for="${p.id}" class="w-16 bg-dark-600 border border-dark-600 rounded px-2 py-1 text-sm text-center focus:border-neon-blue focus:outline-none">
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${alwaysBoxes.length > 0 ? `
                        <div>
                            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bokser</h4>
                            <div class="space-y-2 max-h-48 overflow-y-auto">
                                ${alwaysBoxes.map(b => `
                                    <label class="flex items-center gap-3 p-2 rounded-lg bg-dark-700 cursor-pointer hover:bg-dark-600 transition-colors">
                                        <input type="checkbox" checked value="${b.id}" data-type="box" data-name="${esc(b.name)}" class="lf-default-item rounded">
                                        <div class="flex-1 min-w-0">
                                            <div class="text-sm font-medium truncate">${esc(b.name)}</div>
                                            <div class="text-xs text-gray-500">${b.items.length} produkt${b.items.length !== 1 ? 'er' : ''} i boksen</div>
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="flex gap-2">
                        <button type="button" id="lf-prev-step" class="flex-1 py-2.5 rounded-lg font-semibold bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors">Tilbake</button>
                        <button type="submit" class="flex-1 btn-neon py-2.5 rounded-lg font-semibold">Opprett liste</button>
                    </div>
                </div>
            </div>
        </form>
    `);

    document.getElementById('lf-date').valueAsDate = new Date();

    if (hasDefaults) {
        document.getElementById('lf-next-step').addEventListener('click', () => {
            const name = document.getElementById('lf-name').value.trim();
            if (!name) return toast('Navn er påkrevd', 'error');
            document.getElementById('lf-step-1').classList.add('hidden');
            document.getElementById('lf-step-2').classList.remove('hidden');
            document.getElementById('modal-title').textContent = 'Standardutstyr';
        });

        document.getElementById('lf-prev-step').addEventListener('click', () => {
            document.getElementById('lf-step-2').classList.add('hidden');
            document.getElementById('lf-step-1').classList.remove('hidden');
            document.getElementById('modal-title').textContent = 'Ny pakkeliste';
        });
    }

    document.getElementById('list-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('lf-name').value.trim();
        if (!name) return toast('Navn er påkrevd', 'error');

        const list = DB.addPackingList({
            name,
            jobName: document.getElementById('lf-job').value.trim(),
            date: document.getElementById('lf-date').value,
        });

        if (hasDefaults) {
            const checkedItems = document.querySelectorAll('.lf-default-item:checked');
            checkedItems.forEach(cb => {
                if (cb.dataset.type === 'product') {
                    const qtyInput = document.querySelector(`[data-qty-for="${cb.value}"]`);
                    const quantity = parseInt(qtyInput?.value) || 1;
                    const product = DB.getProduct(cb.value);
                    DB.addItemToList(list.id, {
                        productId: cb.value,
                        productName: product?.name || cb.dataset.name,
                        quantity,
                    });
                } else if (cb.dataset.type === 'box') {
                    const box = DB.getBox(cb.value);
                    if (box) {
                        box.items.forEach(item => {
                            DB.addItemToList(list.id, {
                                productId: item.productId,
                                productName: item.productName,
                                quantity: item.quantity,
                            });
                        });
                    }
                }
            });
        }

        closeModal();
        renderPackingLists();
        toast('Pakkeliste opprettet', 'success');
    });
}

function deletePackingList(id) {
    const list = DB.getPackingList(id);
    if (!list) return;
    openModal('Slett pakkeliste', `
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette <strong>${esc(list.name)}</strong>?</p>
        <div class="flex gap-2">
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors">Avbryt</button>
            <button id="confirm-delete-list" class="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Slett</button>
        </div>
    `);
    document.getElementById('confirm-delete-list').addEventListener('click', () => {
        DB.deletePackingList(id);
        closeModal();
        renderPackingLists();
        toast('Pakkeliste slettet', 'success');
    });
}

// ========================
// Packing List Detail
// ========================

function openListDetail(id) {
    App.currentListId = id;
    showView('list-detail');
    renderListDetail();
}

function renderListDetail() {
    const list = DB.getPackingList(App.currentListId);
    if (!list) return showView('packing');

    document.getElementById('list-detail-name').textContent = list.name;
    document.getElementById('list-detail-job').textContent = list.jobName || 'Ingen jobb';
    document.getElementById('list-detail-date').textContent = new Date(list.date || list.createdAt).toLocaleDateString('nb-NO');

    const total = list.items.length;
    const packed = list.items.filter(i => i.packed).length;
    document.getElementById('list-detail-progress').textContent = `${packed}/${total} pakket`;

    const container = document.getElementById('list-items');
    if (list.items.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-gray-500">
            <p>Ingen produkter i listen</p>
            <p class="text-sm mt-1">Trykk + for å legge til</p>
        </div>`;
        return;
    }

    container.innerHTML = list.items.map(item => {
        const product = DB.getProduct(item.productId);
        return `
        <div class="check-item ${item.packed ? 'checked' : ''} flex items-center gap-3 bg-dark-800 rounded-lg p-3 border border-dark-600 cursor-pointer" onclick="toggleListItem('${item.id}')">
            <div class="w-6 h-6 rounded-md border-2 ${item.packed ? 'bg-neon-green border-neon-green' : 'border-gray-500'} flex items-center justify-center shrink-0">
                ${item.packed ? '<svg class="w-4 h-4 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
            </div>
            <div class="flex-1 min-w-0">
                <div class="item-name font-medium text-sm">${esc(product?.name || item.productName || 'Ukjent produkt')}</div>
                <div class="text-xs text-gray-500">${item.quantity} stk${product?.unitsPerPackage > 1 ? ` (${item.quantity * product.unitsPerPackage} enheter totalt)` : ''}</div>
            </div>
            <button onclick="event.stopPropagation(); removeListItem('${item.id}')" class="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>`;
    }).join('');
}

function toggleListItem(itemId) {
    DB.toggleListItem(App.currentListId, itemId);
    renderListDetail();
}

function removeListItem(itemId) {
    DB.removeItemFromList(App.currentListId, itemId);
    renderListDetail();
    toast('Fjernet fra listen');
}

function showAddItemToListForm() {
    const products = DB.getProducts();
    if (products.length === 0) {
        toast('Legg til produkter først', 'error');
        return;
    }

    openModal('Legg til produkt', `
        <form id="add-item-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Produkt *</label>
                <select id="aif-product" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    ${products.map(p => `<option value="${p.id}">${esc(p.name)} ${p.unitsPerPackage > 1 ? `(${p.unitsPerPackage} enh/pk)` : ''}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Antall pakker/flights</label>
                <input type="number" id="aif-qty" value="1" min="1" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Legg til</button>
        </form>
    `);

    document.getElementById('add-item-form').addEventListener('submit', e => {
        e.preventDefault();
        const productId = document.getElementById('aif-product').value;
        const quantity = parseInt(document.getElementById('aif-qty').value) || 1;
        const product = DB.getProduct(productId);

        DB.addItemToList(App.currentListId, {
            productId,
            productName: product?.name || 'Ukjent',
            quantity,
        });
        closeModal();
        renderListDetail();
        toast('Produkt lagt til', 'success');
    });
}

// ========================
// Pack Box from List
// ========================

function showPackBoxFromList() {
    const list = DB.getPackingList(App.currentListId);
    if (!list) return;
    const unpackedItems = list.items.filter(i => !i.packed);

    if (unpackedItems.length === 0) {
        toast('Alle produkter er pakket!', 'success');
        return;
    }

    openModal('Pakk boks', `
        <form id="pack-box-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Boks-navn *</label>
                <input type="text" id="pbf-name" placeholder="f.eks. Boks 1 - Lyd" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-2">Velg produkter å legge i boksen</label>
                <div class="space-y-2 max-h-60 overflow-y-auto">
                    ${unpackedItems.map(item => {
                        const product = DB.getProduct(item.productId);
                        return `<label class="flex items-center gap-3 p-2 rounded-lg bg-dark-700 cursor-pointer hover:bg-dark-600 transition-colors">
                            <input type="checkbox" value="${item.id}" data-product-id="${item.productId}" data-product-name="${esc(product?.name || item.productName)}" data-quantity="${item.quantity}" class="pack-checkbox rounded">
                            <div>
                                <div class="text-sm font-medium">${esc(product?.name || item.productName)}</div>
                                <div class="text-xs text-gray-500">${item.quantity} stk</div>
                            </div>
                        </label>`;
                    }).join('')}
                </div>
            </div>
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Pakk boks</button>
        </form>
    `);

    document.getElementById('pack-box-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('pbf-name').value.trim();
        if (!name) return toast('Gi boksen et navn', 'error');

        const checked = document.querySelectorAll('.pack-checkbox:checked');
        if (checked.length === 0) return toast('Velg minst ett produkt', 'error');

        const boxItems = [];
        checked.forEach(cb => {
            boxItems.push({
                productId: cb.dataset.productId,
                productName: cb.dataset.productName,
                quantity: parseInt(cb.dataset.quantity) || 1,
            });
            DB.toggleListItem(App.currentListId, cb.value);
        });

        const box = DB.addBox({ name, items: [], packingListId: App.currentListId });
        boxItems.forEach(item => DB.addItemToBox(box.id, item));

        closeModal();
        renderListDetail();
        toast('Boks pakket!', 'success');

        setTimeout(() => {
            openBoxDetail(box.id);
        }, 300);
    });
}

// ========================
// Boxes
// ========================

function renderBoxes() {
    const boxes = DB.getBoxes();
    const container = document.getElementById('boxes-list');

    if (boxes.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
            <p>Ingen bokser ennå</p>
            <p class="text-sm mt-1">Pakk bokser fra pakkelister eller opprett manuelt</p>
        </div>`;
        return;
    }

    container.innerHTML = boxes.map(box => `
        <div class="bg-dark-800 rounded-xl p-4 border border-dark-600 cursor-pointer hover:border-neon-yellow/30 transition-colors slide-up-enter" onclick="openBoxDetail('${box.id}')">
            <div class="flex items-start justify-between">
                <div>
                    <div class="font-semibold">${esc(box.name)}${box.alwaysInclude ? ' <span class="inline-block text-xs px-1.5 py-0.5 rounded-full bg-neon-green/15 text-neon-green font-normal align-middle ml-1">Alltid med</span>' : ''}</div>
                    <div class="text-xs text-gray-500">${box.items.length} produkt${box.items.length !== 1 ? 'er' : ''}</div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs px-2 py-1 rounded-full bg-neon-yellow/10 text-neon-yellow font-mono">${box.barcode}</span>
                    <button onclick="event.stopPropagation(); deleteBox('${box.id}')" class="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showBoxForm() {
    openModal('Ny boks', `
        <form id="box-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Boks-navn *</label>
                <input type="text" id="bf-name" placeholder="f.eks. Boks 1 - Lys" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
            </div>
            <label class="flex items-center gap-3 p-3 rounded-lg bg-dark-700 cursor-pointer hover:bg-dark-600 transition-colors">
                <input type="checkbox" id="bf-always-include" class="rounded">
                <div>
                    <div class="text-sm font-medium">Bør alltid være med</div>
                    <div class="text-xs text-gray-500">Vises som forslag når du oppretter nye pakkelister</div>
                </div>
            </label>
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Opprett boks</button>
        </form>
    `);

    document.getElementById('box-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('bf-name').value.trim();
        if (!name) return toast('Navn er påkrevd', 'error');
        const box = DB.addBox({ name, alwaysInclude: document.getElementById('bf-always-include').checked });
        closeModal();
        renderBoxes();
        toast('Boks opprettet', 'success');
    });
}

function deleteBox(id) {
    const box = DB.getBox(id);
    if (!box) return;
    openModal('Slett boks', `
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette <strong>${esc(box.name)}</strong>?</p>
        <div class="flex gap-2">
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors">Avbryt</button>
            <button id="confirm-delete-box" class="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Slett</button>
        </div>
    `);
    document.getElementById('confirm-delete-box').addEventListener('click', () => {
        DB.deleteBox(id);
        closeModal();
        renderBoxes();
        toast('Boks slettet', 'success');
    });
}

// ========================
// Box Detail
// ========================

function openBoxDetail(id) {
    App.currentBoxId = id;
    showView('box-detail');
    renderBoxDetail();
}

function toggleBoxAlwaysInclude() {
    const box = DB.getBox(App.currentBoxId);
    if (!box) return;
    DB.updateBox(App.currentBoxId, { alwaysInclude: !box.alwaysInclude });
    renderBoxDetail();
    toast(box.alwaysInclude ? 'Fjernet fra «alltid med»' : 'Merket som «alltid med»', 'success');
}

function renderBoxDetail() {
    const box = DB.getBox(App.currentBoxId);
    if (!box) return showView('packing');

    document.getElementById('box-detail-name').textContent = box.name;

    const container = document.getElementById('box-items');

    const alwaysIncludeToggle = `
        <label class="flex items-center gap-3 p-3 rounded-lg ${box.alwaysInclude ? 'bg-neon-green/10 border border-neon-green/30' : 'bg-dark-700 border border-dark-600'} cursor-pointer hover:bg-dark-600 transition-colors" onclick="toggleBoxAlwaysInclude()">
            <div class="w-5 h-5 rounded-md border-2 ${box.alwaysInclude ? 'bg-neon-green border-neon-green' : 'border-gray-500'} flex items-center justify-center shrink-0">
                ${box.alwaysInclude ? '<svg class="w-3.5 h-3.5 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
            </div>
            <div>
                <div class="text-sm font-medium">Bør alltid være med</div>
                <div class="text-xs text-gray-500">Foreslås automatisk på nye pakkelister</div>
            </div>
        </label>`;

    if (box.items.length === 0) {
        container.innerHTML = alwaysIncludeToggle + `<div class="text-center py-8 text-gray-500">
            <p>Boksen er tom</p>
            <p class="text-sm mt-1">Trykk + for å legge til produkter</p>
        </div>`;
    } else {
        container.innerHTML = alwaysIncludeToggle + `
            <div class="barcode-container mx-auto">
                <svg id="box-barcode-detail"></svg>
            </div>
        ` + box.items.map(item => {
            const product = DB.getProduct(item.productId);
            return `
            <div class="flex items-center gap-3 bg-dark-800 rounded-lg p-3 border border-dark-600">
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm">${esc(product?.name || item.productName || 'Ukjent')}</div>
                    <div class="text-xs text-gray-500">${item.quantity} stk${product?.unitsPerPackage > 1 ? ` (${item.quantity * product.unitsPerPackage} enheter)` : ''}</div>
                </div>
                <button onclick="removeBoxItem('${item.id}')" class="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>`;
        }).join('');

        requestAnimationFrame(() => renderBarcode('box-barcode-detail', box.barcode, { height: 50, width: 2 }));
    }
}

function removeBoxItem(itemId) {
    DB.removeItemFromBox(App.currentBoxId, itemId);
    renderBoxDetail();
    toast('Fjernet fra boksen');
}

function showAddItemToBoxForm() {
    const products = DB.getProducts();
    if (products.length === 0) {
        toast('Legg til produkter først', 'error');
        return;
    }

    openModal('Legg til i boks', `
        <form id="add-box-item-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Produkt *</label>
                <select id="abif-product" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    ${products.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Antall</label>
                <input type="number" id="abif-qty" value="1" min="1" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Legg til</button>
        </form>
    `);

    document.getElementById('add-box-item-form').addEventListener('submit', e => {
        e.preventDefault();
        const productId = document.getElementById('abif-product').value;
        const quantity = parseInt(document.getElementById('abif-qty').value) || 1;
        const product = DB.getProduct(productId);

        DB.addItemToBox(App.currentBoxId, {
            productId,
            productName: product?.name || 'Ukjent',
            quantity,
        });
        closeModal();
        renderBoxDetail();
        toast('Lagt til i boksen', 'success');
    });
}

function printBoxLabel() {
    const box = DB.getBox(App.currentBoxId);
    if (!box) return;

    const itemsHTML = box.items.map(item => {
        const product = DB.getProduct(item.productId);
        const totalUnits = product?.unitsPerPackage > 1 ? ` (${item.quantity * product.unitsPerPackage} enh)` : '';
        return `<li><span class="label-qty">${item.quantity}x</span> ${esc(product?.name || item.productName)}${totalUnits}</li>`;
    }).join('');

    openModal('Boks-etikett', `
        <div class="label-preview" id="box-label-preview">
            <div class="label-title">${esc(box.name)}</div>
            <div class="label-subtitle">${box.items.length} produkt${box.items.length !== 1 ? 'er' : ''}</div>
            <div class="label-barcode"><svg id="box-label-barcode"></svg></div>
            <div class="label-info">${box.barcode}</div>
            ${box.items.length > 0 ? `<ul class="label-contents">${itemsHTML}</ul>` : ''}
        </div>
        <button id="btn-do-print-box" class="w-full mt-4 py-2.5 rounded-lg font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-colors">Skriv ut A6 etikett</button>
    `);

    renderBarcode('box-label-barcode', box.barcode, { width: 2, height: 70, fontSize: 16 });

    document.getElementById('btn-do-print-box').addEventListener('click', () => {
        const html = `<div class="label-a6">
            <div class="label-title">${esc(box.name)}</div>
            <div class="label-subtitle">${box.items.length} produkt${box.items.length !== 1 ? 'er' : ''}</div>
            <div class="label-barcode"><svg id="print-barcode"></svg></div>
            <div class="label-info">${box.barcode}</div>
            ${box.items.length > 0 ? `<ul class="label-contents">${itemsHTML}</ul>` : ''}
        </div>`;
        printLabel(html);
    });
}

// ========================
// Vehicle
// ========================

function renderVehicle() {
    const vehicles = DB.getVehicles();
    const activeId = DB.getActiveVehicleId();
    const selectorEl = document.getElementById('vehicle-selector');
    const contentEl = document.getElementById('vehicle-active-content');

    if (vehicles.length === 0) {
        selectorEl.innerHTML = '';
        contentEl.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11h18M3 11v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6"/></svg>
            <p>Ingen biler ennå</p>
            <p class="text-sm mt-1">Trykk + Ny bil for å legge til en</p>
        </div>`;
        return;
    }

    const sorted = [...vehicles].sort((a, b) => {
        const aCount = DB.getVehicleItemCount(a.id);
        const bCount = DB.getVehicleItemCount(b.id);
        if (aCount > 0 && bCount === 0) return -1;
        if (aCount === 0 && bCount > 0) return 1;
        return 0;
    });

    selectorEl.innerHTML = sorted.map(v => {
        const count = DB.getVehicleItemCount(v.id);
        const due = DB.getVehicleServicesDue(v.id);
        const isActive = v.id === activeId;
        const hasItems = count > 0;
        let cls = 'shrink-0 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer relative';
        if (isActive) {
            cls += ' bg-neon-blue/20 text-neon-blue border-neon-blue/40';
        } else if (hasItems) {
            cls += ' bg-dark-700 text-gray-200 border-dark-500 hover:border-neon-blue/30';
        } else {
            cls += ' bg-dark-700 text-gray-500 border-dark-600 hover:border-dark-500';
        }
        const badge = hasItems ? ` <span class="text-xs opacity-70 ml-0.5">(${count})</span>` : '';
        const dueDot = due.length > 0 ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-neon-pink border-2 border-dark-800"></span>' : '';
        return `<button class="${cls}" onclick="selectVehicle('${v.id}')">${esc(v.name)}${badge}${dueDot}</button>`;
    }).join('');

    if (!activeId || !vehicles.find(v => v.id === activeId)) {
        contentEl.innerHTML = `<p class="text-sm text-gray-500 italic text-center py-8">Velg en bil ovenfor</p>`;
        return;
    }

    const vehicle = DB.getVehicle(activeId);
    const items = DB.getVehicleItems(activeId);
    const log = DB.getVehicleLog(activeId);

    let contentsHTML;
    if (items.length === 0) {
        contentsHTML = '<p class="text-sm text-gray-500 italic">Bilen er tom</p>';
    } else {
        contentsHTML = items.map(item => `
            <div class="flex items-center justify-between bg-dark-700 rounded-lg p-2.5">
                <div>
                    <div class="text-sm font-medium">${esc(item.name)}</div>
                    <div class="text-xs text-gray-500">${item.type === 'box' ? 'Boks' : 'Produkt'}${item.quantity > 1 ? ` · ${item.quantity} stk` : ''}</div>
                </div>
                <button onclick="vehicleUnload('${item.id}')" class="text-xs px-2 py-1 rounded bg-neon-pink/20 text-neon-pink hover:bg-neon-pink/30 transition-colors">Last ut</button>
            </div>
        `).join('');
    }

    let logHTML;
    if (log.length === 0) {
        logHTML = '<p class="text-sm text-gray-500 italic">Ingen logg</p>';
    } else {
        logHTML = log.slice(0, 30).map(entry => {
            const time = new Date(entry.timestamp).toLocaleString('nb-NO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const icon = entry.action === 'in'
                ? '<span class="text-neon-green">↓ INN</span>'
                : '<span class="text-neon-pink">↑ UT</span>';
            return `<div class="flex items-center justify-between text-sm py-1 border-b border-dark-700 last:border-0">
                <span>${icon} ${esc(entry.item.name)}</span>
                <span class="text-xs text-gray-500">${time}</span>
            </div>`;
        }).join('');
    }

    const lists = DB.getPackingLists();
    const selectedListId = App.vehicleLoadListId;
    const selectedList = selectedListId ? DB.getPackingList(selectedListId) : null;

    let listSectionHTML = '';
    if (lists.length > 0) {
        const optionsHTML = lists.map(l => {
            const total = l.items.length;
            const packed = l.items.filter(i => i.packed).length;
            return `<option value="${l.id}" ${l.id === selectedListId ? 'selected' : ''}>${esc(l.name)} (${packed}/${total})</option>`;
        }).join('');

        let listItemsHTML = '';
        if (selectedList) {
            const total = selectedList.items.length;
            const packedCount = selectedList.items.filter(i => i.packed).length;
            const pct = total > 0 ? Math.round((packedCount / total) * 100) : 0;
            const unpacked = selectedList.items.filter(i => !i.packed);
            const packedItems = selectedList.items.filter(i => i.packed);
            const sorted = [...unpacked, ...packedItems];

            if (sorted.length === 0) {
                listItemsHTML = '<p class="text-sm text-gray-500 italic py-2">Ingen produkter i listen</p>';
            } else {
                listItemsHTML = `
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-gray-400">${packedCount}/${total} pakket</span>
                            ${packedCount === total && total > 0 ? '<span class="text-xs text-neon-green font-semibold">Alt pakket!</span>' : ''}
                        </div>
                        <button onclick="startVehicleLoad('${selectedList.id}')" class="text-xs px-2 py-1 rounded bg-dark-600 text-gray-300 hover:bg-dark-500 transition-colors" title="Bruk skanner">
                            <svg class="w-3.5 h-3.5 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                            Skann
                        </button>
                    </div>
                    <div class="w-full bg-dark-600 rounded-full h-1 mb-2">
                        <div class="h-1 rounded-full transition-all ${pct === 100 ? 'bg-neon-green' : 'bg-neon-yellow'}" style="width: ${pct}%"></div>
                    </div>
                ` + sorted.map(item => {
                    const product = DB.getProduct(item.productId);
                    return `<div class="check-item ${item.packed ? 'checked' : ''} flex items-center gap-2.5 rounded-lg p-2.5 ${item.packed ? 'bg-dark-700/50' : 'bg-dark-700 hover:bg-dark-600'} cursor-pointer transition-all" onclick="vehicleLoadItemFromList('${selectedList.id}', '${item.id}')">
                        <div class="w-5 h-5 rounded border-2 ${item.packed ? 'bg-neon-green border-neon-green' : 'border-gray-500'} flex items-center justify-center shrink-0">
                            ${item.packed ? '<svg class="w-3 h-3 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="item-name text-sm">${esc(product?.name || item.productName || 'Ukjent')}</div>
                            <div class="text-xs text-gray-500">${item.quantity} stk</div>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        listSectionHTML = `
        <div class="bg-dark-800 rounded-xl border border-neon-yellow/20">
            <div class="p-3 border-b border-dark-600 flex items-center justify-between">
                <h3 class="font-semibold text-neon-yellow text-sm">Pakkeliste</h3>
                <select id="vehicle-list-picker" class="bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm focus:border-neon-yellow focus:outline-none max-w-[60%]">
                    <option value="">Velg liste...</option>
                    ${optionsHTML}
                </select>
            </div>
            ${selectedList ? `<div class="p-3 space-y-1.5 max-h-72 overflow-y-auto">${listItemsHTML}</div>` : ''}
        </div>`;
    }

    // Compact vehicle info summary
    const dueServices = DB.getVehicleServicesDue(activeId);
    const upcomingServices = DB.getVehicleServicesUpcoming(activeId);
    let serviceAlertHTML = '';
    if (dueServices.length > 0) {
        serviceAlertHTML = `<div class="bg-neon-pink/10 border border-neon-pink/30 rounded-xl p-3 cursor-pointer" onclick="openVehicleProfile('${vehicle.id}')">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-neon-pink shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="text-sm text-neon-pink font-medium">${dueServices.length} service${dueServices.length > 1 ? 'r' : ''} forfalt!</span>
            </div>
        </div>`;
    } else if (upcomingServices.length > 0) {
        serviceAlertHTML = `<div class="bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl p-3 cursor-pointer" onclick="openVehicleProfile('${vehicle.id}')">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-neon-yellow shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="text-sm text-neon-yellow font-medium">${upcomingServices.length} service${upcomingServices.length > 1 ? 'r' : ''} snart</span>
            </div>
        </div>`;
    }

    let infoSummary = [];
    if (vehicle.licensePlate) infoSummary.push(vehicle.licensePlate);
    if (vehicle.model) infoSummary.push(vehicle.model);
    if (vehicle.mileage) infoSummary.push(`${vehicle.mileage.toLocaleString('nb-NO')} km`);
    const infoLine = infoSummary.length > 0 ? `<div class="text-xs text-gray-500">${infoSummary.map(i => esc(i)).join(' · ')}</div>` : '';

    contentEl.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-lg">${esc(vehicle.name)}</h3>
                ${infoLine}
            </div>
            <button onclick="openVehicleProfile('${vehicle.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors text-sm font-medium shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Bilprofil
            </button>
        </div>
        ${serviceAlertHTML}
        <div class="flex gap-2">
            <button onclick="vehicleScanIn()" class="flex-1 py-3 rounded-lg text-sm font-semibold bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors">
                <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14"/></svg>
                Skann INN
            </button>
            <button onclick="vehicleScanOut()" class="flex-1 py-3 rounded-lg text-sm font-semibold bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/30 transition-colors">
                <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l4 4m0 0l-4 4m4-4H3"/></svg>
                Skann UT
            </button>
        </div>
        ${(() => {
            const activeTrip = DB.getActiveTrip(activeId);
            if (activeTrip) {
                const t = activeTrip;
                const packed = t.packedItems.filter(i => i.packed).length;
                const total = t.packedItems.length;
                const pct = total > 0 ? Math.round((packed / total) * 100) : 0;
                const tripContracts = (t.contractIds || []).map(cid => DB.getContract(cid)).filter(Boolean);
                const tripEvents = (t.eventIds || []).map(eid => DB.getEvent(eid)).filter(Boolean);
                const names = [
                    ...tripContracts.map(c => esc(c.venue || c.clientName)),
                    ...tripEvents.map(ev => esc(ev.name)),
                ].join(', ');
                return `<div class="bg-dark-800 rounded-xl border border-neon-purple/30 p-3 cursor-pointer hover:border-neon-purple/50 transition-colors" onclick="ContractApp.currentTripId='${t.id}'; showView('vehicle-trip')">
                    <div class="flex items-center justify-between mb-1.5">
                        <h3 class="font-semibold text-neon-purple text-sm flex items-center gap-1.5">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                            Aktiv tur
                        </h3>
                        <span class="text-xs font-medium ${packed === total && total > 0 ? 'text-neon-green' : 'text-neon-yellow'}">${packed}/${total}</span>
                    </div>
                    <div class="text-xs text-gray-400 truncate mb-1.5">${names}</div>
                    <div class="w-full bg-dark-600 rounded-full h-1.5">
                        <div class="h-1.5 rounded-full transition-all ${packed === total && total > 0 ? 'bg-neon-green' : 'bg-neon-yellow'}" style="width: ${pct}%"></div>
                    </div>
                </div>`;
            } else {
                return `<button onclick="showTripPlanner()" class="w-full py-2.5 rounded-lg text-sm font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-colors flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    Planlegg tur fra kontrakter
                </button>`;
            }
        })()}
        ${listSectionHTML}
        <div class="bg-dark-800 rounded-xl border border-dark-600">
            <div class="p-3 border-b border-dark-600">
                <h3 class="font-semibold text-gray-300">Innhold i bilen</h3>
            </div>
            <div class="p-3 space-y-2">${contentsHTML}</div>
        </div>
        <div class="bg-dark-800 rounded-xl border border-dark-600">
            <div class="p-3 border-b border-dark-600">
                <h3 class="font-semibold text-gray-300">Logg</h3>
            </div>
            <div class="p-3 space-y-2 max-h-64 overflow-y-auto">${logHTML}</div>
        </div>
    `;

    const listPicker = document.getElementById('vehicle-list-picker');
    if (listPicker) {
        listPicker.addEventListener('change', () => {
            App.vehicleLoadListId = listPicker.value || null;
            renderVehicle();
        });
    }
}

function selectVehicle(id) {
    DB.setActiveVehicle(id);
    renderVehicle();
}

function showVehicleForm() {
    const vehicles = DB.getVehicles();

    const existingHTML = vehicles.length > 0
        ? `<div>
                <label class="block text-sm text-gray-400 mb-2">Velg en eksisterende bil</label>
                <div id="vf-existing" class="space-y-2 max-h-48 overflow-y-auto">
                    ${vehicles.map(v => {
                        const count = DB.getVehicleItemCount(v.id);
                        const badge = count > 0 ? `<span class="text-xs text-gray-500">${count} ting lastet</span>` : '<span class="text-xs text-gray-500">Tom</span>';
                        return `<button type="button" class="vf-pick w-full flex items-center justify-between p-3 rounded-lg bg-dark-700 border border-dark-600 hover:border-neon-blue/40 transition-colors text-left" data-id="${v.id}">
                            <span class="font-medium text-sm">${esc(v.name)}</span>
                            ${badge}
                        </button>`;
                    }).join('')}
                </div>
           </div>
           <div class="relative flex items-center gap-3">
                <div class="flex-1 h-px bg-dark-600"></div>
                <span class="text-xs text-gray-500 shrink-0">eller opprett ny</span>
                <div class="flex-1 h-px bg-dark-600"></div>
           </div>`
        : '';

    openModal(vehicles.length > 0 ? 'Velg eller opprett bil' : 'Ny bil', `
        <div class="space-y-4">
            ${existingHTML}
            <form id="vehicle-form" class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Navn på ny bil *</label>
                    <input type="text" id="vf-name" placeholder="f.eks. Sprinter, Henger, Personbil..." class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Skiltnummer</label>
                    <input type="text" id="vf-plate" placeholder="f.eks. AB 12345" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none uppercase">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Kilometerstand</label>
                    <input type="number" id="vf-mileage" placeholder="f.eks. 85000" min="0" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
                <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Opprett ny bil</button>
            </form>
        </div>
    `);

    document.querySelectorAll('.vf-pick').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            DB.setActiveVehicle(id);
            closeModal();
            renderVehicle();
            const v = DB.getVehicle(id);
            toast(`${v?.name || 'Bil'} valgt`, 'success');
        });
    });

    document.getElementById('vehicle-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('vf-name').value.trim();
        if (!name) return toast('Skriv inn et navn for den nye bilen', 'error');
        const vehicleData = { name };
        const plate = document.getElementById('vf-plate').value.trim().toUpperCase();
        const mileage = parseInt(document.getElementById('vf-mileage').value);
        if (plate) vehicleData.licensePlate = plate;
        if (mileage > 0) vehicleData.mileage = mileage;
        const vehicle = DB.addVehicle(vehicleData);
        DB.setActiveVehicle(vehicle.id);
        closeModal();
        renderVehicle();
        toast('Bil opprettet', 'success');
    });
}

function showEditVehicleForm(id) {
    const vehicle = DB.getVehicle(id);
    if (!vehicle) return;
    openModal('Rediger bil', `
        <form id="edit-vehicle-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Navn *</label>
                <input type="text" id="ev-name" value="${esc(vehicle.name)}" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Skiltnummer</label>
                <input type="text" id="ev-plate" value="${esc(vehicle.licensePlate || '')}" placeholder="f.eks. AB 12345" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none uppercase">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Kilometerstand</label>
                <input type="number" id="ev-mileage" value="${vehicle.mileage || ''}" placeholder="f.eks. 85000" min="0" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Merke / Modell</label>
                <input type="text" id="ev-model" value="${esc(vehicle.model || '')}" placeholder="f.eks. Mercedes Sprinter" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Årsmodell</label>
                <input type="number" id="ev-year" value="${vehicle.year || ''}" placeholder="f.eks. 2020" min="1900" max="2099" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Notater</label>
                <textarea id="ev-notes" rows="2" placeholder="Eventuell tilleggsinfo..." class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none resize-none">${esc(vehicle.notes || '')}</textarea>
            </div>
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Lagre endringer</button>
        </form>
    `);

    document.getElementById('edit-vehicle-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('ev-name').value.trim();
        if (!name) return toast('Navn er påkrevd', 'error');
        const updates = {
            name,
            licensePlate: document.getElementById('ev-plate').value.trim().toUpperCase(),
            mileage: parseInt(document.getElementById('ev-mileage').value) || null,
            model: document.getElementById('ev-model').value.trim(),
            year: parseInt(document.getElementById('ev-year').value) || null,
            notes: document.getElementById('ev-notes').value.trim(),
        };
        DB.updateVehicle(id, updates);
        closeModal();
        refreshVehicleView();
        toast('Bil oppdatert', 'success');
    });
}

function renameVehiclePrompt(id) {
    showEditVehicleForm(id);
}

function deleteVehiclePrompt(id) {
    const vehicle = DB.getVehicle(id);
    if (!vehicle) return;
    const itemCount = DB.getVehicleItemCount(id);
    const warning = itemCount > 0 ? `<p class="text-neon-yellow text-sm mb-2">Bilen har ${itemCount} ting lastet. Alt innhold slettes.</p>` : '';
    openModal('Slett bil', `
        ${warning}
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette <strong>${esc(vehicle.name)}</strong>?</p>
        <div class="flex gap-2">
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors">Avbryt</button>
            <button id="confirm-delete-vehicle" class="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Slett</button>
        </div>
    `);
    document.getElementById('confirm-delete-vehicle').addEventListener('click', () => {
        DB.deleteVehicle(id);
        closeModal();
        showView('vehicle');
        toast('Bil slettet', 'success');
    });
}

function vehicleUnload(vehicleItemId) {
    DB.vehicleOut(vehicleItemId);
    renderVehicle();
    renderDashboard();
    toast('Lastet ut av bilen', 'success');
}

function vehicleLoadItemFromList(listId, itemId) {
    const list = DB.getPackingList(listId);
    if (!list) return;
    const item = list.items.find(i => i.id === itemId);
    if (!item || item.packed) return;

    DB.toggleListItem(listId, itemId);

    const product = DB.getProduct(item.productId);
    if (product) {
        DB.vehicleIn({
            type: 'product',
            refId: product.id,
            name: product.name,
            barcode: product.barcode,
            quantity: item.quantity,
        });
        toast(`${product.name} lastet inn`, 'success');
    }

    renderVehicle();
}

function vehicleScanIn() {
    const activeId = DB.getActiveVehicleId();
    if (!activeId) {
        toast('Velg en bil først', 'error');
        return;
    }
    const vehicle = DB.getVehicle(activeId);
    App.scannerMode = 'vehicle-in';
    showView('scanner');
    document.getElementById('scanner-context').innerHTML =
        `<span class="text-neon-green font-semibold">Modus: Last INN i ${esc(vehicle?.name || 'bil')}</span> — Skann produkt eller boks for å laste inn.`;
}

function vehicleScanOut() {
    const activeId = DB.getActiveVehicleId();
    if (!activeId) {
        toast('Velg en bil først', 'error');
        return;
    }
    const vehicle = DB.getVehicle(activeId);
    App.scannerMode = 'vehicle-out';
    showView('scanner');
    document.getElementById('scanner-context').innerHTML =
        `<span class="text-neon-pink font-semibold">Modus: Last UT av ${esc(vehicle?.name || 'bil')}</span> — Skann produkt eller boks for å laste ut.`;
}

// ========================
// Vehicle Profile
// ========================

function refreshVehicleView() {
    if (App.currentView === 'vehicle-profile') renderVehicleProfile();
    else renderVehicle();
}

function openVehicleProfile(vehicleId) {
    App.currentVehicleProfileId = vehicleId;
    showView('vehicle-profile');
}

function renderVehicleProfile() {
    const id = App.currentVehicleProfileId;
    const vehicle = DB.getVehicle(id);
    if (!vehicle) return showView('vehicle');

    const container = document.getElementById('vehicle-profile-content');
    const allServices = DB.getVehicleServices(id);
    const dueServices = DB.getVehicleServicesDue(id);
    const upcomingServices = DB.getVehicleServicesUpcoming(id);
    const plannedServices = allServices.filter(s => !s.completedAt);
    const completedServices = allServices.filter(s => s.completedAt);

    // --- Info section ---
    const infoRows = [
        { label: 'Skiltnummer', value: vehicle.licensePlate, mono: true },
        { label: 'Merke / Modell', value: vehicle.model },
        { label: 'Årsmodell', value: vehicle.year },
        { label: 'Kilometerstand', value: vehicle.mileage ? `${vehicle.mileage.toLocaleString('nb-NO')} km` : null },
    ].filter(r => r.value);

    const infoHTML = infoRows.length > 0
        ? infoRows.map(r => `<div class="flex justify-between py-1.5 border-b border-dark-600 last:border-0">
            <span class="text-gray-500 text-sm">${r.label}</span>
            <span class="text-sm ${r.mono ? 'font-mono' : ''}">${esc(String(r.value))}</span>
        </div>`).join('')
        : '<p class="text-sm text-gray-500 italic py-2">Ingen info registrert</p>';

    // --- Tire section ---
    const tires = vehicle.tires || {};
    const hasTireInfo = tires.currentType || tires.size || tires.brand;
    const tireTypeLabels = { summer: 'Sommer', winter: 'Vinter', allseason: 'Helårs', studded: 'Pigg' };

    let tireHTML = '';
    if (hasTireInfo) {
        const tireRows = [
            { label: 'Type', value: tireTypeLabels[tires.currentType] || tires.currentType },
            { label: 'Dimensjon', value: tires.size },
            { label: 'Merke', value: tires.brand },
            { label: 'Byttet', value: tires.changedAt ? new Date(tires.changedAt).toLocaleDateString('nb-NO') : null },
            { label: 'Km ved bytte', value: tires.changedAtMileage ? `${tires.changedAtMileage.toLocaleString('nb-NO')} km` : null },
        ].filter(r => r.value);
        tireHTML = tireRows.map(r => `<div class="flex justify-between py-1.5 border-b border-dark-600 last:border-0">
            <span class="text-gray-500 text-sm">${r.label}</span>
            <span class="text-sm">${esc(String(r.value))}</span>
        </div>`).join('');
        if (tires.notes) tireHTML += `<div class="pt-2 text-xs text-gray-400">${esc(tires.notes)}</div>`;
    } else {
        tireHTML = '<p class="text-sm text-gray-500 italic py-2">Ingen dekkinfo registrert</p>';
    }

    // --- Service alerts ---
    let alertHTML = '';
    if (dueServices.length > 0) {
        alertHTML = `<div class="bg-neon-pink/10 border border-neon-pink/30 rounded-xl p-3">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-neon-pink shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="text-sm text-neon-pink font-medium">${dueServices.length} service${dueServices.length > 1 ? 'r' : ''} forfalt!</span>
            </div>
        </div>`;
    } else if (upcomingServices.length > 0) {
        alertHTML = `<div class="bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl p-3">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-neon-yellow shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="text-sm text-neon-yellow font-medium">${upcomingServices.length} service${upcomingServices.length > 1 ? 'r' : ''} snart</span>
            </div>
        </div>`;
    }

    // --- Planned / upcoming services ---
    let plannedHTML = '';
    if (plannedServices.length > 0) {
        plannedHTML = plannedServices.map(s => {
            const isDue = DB.isServiceDue(s, vehicle);
            const now = new Date();
            const thresholdDate = new Date(now); thresholdDate.setDate(thresholdDate.getDate() + 30);
            const currentMileage = vehicle.mileage || 0;
            const isUpcoming = !isDue && (
                (s.nextDueKm && (s.nextDueKm - currentMileage) <= 1000) ||
                (s.nextDueDate && new Date(s.nextDueDate) <= thresholdDate)
            );
            let badge = '<span class="text-xs px-2 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue">Planlagt</span>';
            let border = 'border-neon-blue/20';
            if (isDue) { badge = '<span class="text-xs px-2 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink font-medium">Forfalt</span>'; border = 'border-neon-pink/30'; }
            else if (isUpcoming) { badge = '<span class="text-xs px-2 py-0.5 rounded-full bg-neon-yellow/20 text-neon-yellow font-medium">Snart</span>'; border = 'border-neon-yellow/30'; }

            let dueParts = [];
            if (s.nextDueDate) dueParts.push(new Date(s.nextDueDate).toLocaleDateString('nb-NO'));
            if (s.nextDueKm) dueParts.push(`${s.nextDueKm.toLocaleString('nb-NO')} km`);

            return `<div class="bg-dark-700 rounded-lg p-3 border ${border}">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm">${esc(s.name)}</div>
                        ${dueParts.length > 0 ? `<div class="text-xs ${isDue ? 'text-neon-pink' : isUpcoming ? 'text-neon-yellow' : 'text-gray-400'} mt-0.5">Forfaller: ${dueParts.join(' / ')}</div>` : ''}
                        ${s.description ? `<div class="text-xs text-gray-400 mt-1">${esc(s.description)}</div>` : ''}
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        ${badge}
                        <button onclick="completeVehicleServicePrompt('${s.id}')" class="p-1 rounded hover:bg-neon-green/20 text-gray-500 hover:text-neon-green transition-colors" title="Marker som utført">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        </button>
                        <button onclick="showEditVehicleServiceForm('${s.id}')" class="p-1 rounded hover:bg-dark-600 text-gray-500 hover:text-gray-300 transition-colors" title="Rediger">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onclick="deleteVehicleServicePrompt('${s.id}')" class="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors" title="Slett">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } else {
        plannedHTML = '<p class="text-sm text-gray-500 italic py-2">Ingen kommende servicer</p>';
    }

    // --- Completed service history ---
    let historyHTML = '';
    if (completedServices.length > 0) {
        historyHTML = completedServices.map(s => {
            const serviceDate = new Date(s.completedAt).toLocaleDateString('nb-NO');
            const mileageInfo = s.mileageAtService ? `${s.mileageAtService.toLocaleString('nb-NO')} km` : '';

            const isDue = DB.isServiceDue(s, vehicle);
            const now = new Date();
            const thresholdDate = new Date(now); thresholdDate.setDate(thresholdDate.getDate() + 30);
            const currentMileage = vehicle.mileage || 0;
            const isUpcoming = !isDue && (
                (s.nextDueKm && (s.nextDueKm - currentMileage) <= 1000) ||
                (s.nextDueDate && new Date(s.nextDueDate) <= thresholdDate)
            );

            let nextBadge = '';
            if (s.nextDueKm || s.nextDueDate) {
                let nextParts = [];
                if (s.nextDueKm) nextParts.push(`${s.nextDueKm.toLocaleString('nb-NO')} km`);
                if (s.nextDueDate) nextParts.push(new Date(s.nextDueDate).toLocaleDateString('nb-NO'));
                const nextColor = isDue ? 'text-neon-pink' : isUpcoming ? 'text-neon-yellow' : 'text-gray-500';
                nextBadge = `<div class="text-xs ${nextColor} mt-0.5">Neste: ${nextParts.join(' / ')}</div>`;
            }

            return `<div class="bg-dark-700 rounded-lg p-3 border border-dark-600">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm">${esc(s.name)}</div>
                        <div class="text-xs text-gray-500 mt-0.5">${serviceDate}${mileageInfo ? ` · ${mileageInfo}` : ''}</div>
                        ${s.description ? `<div class="text-xs text-gray-400 mt-1">${esc(s.description)}</div>` : ''}
                        ${nextBadge}
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <button onclick="showEditVehicleServiceForm('${s.id}')" class="p-1 rounded hover:bg-dark-600 text-gray-500 hover:text-gray-300 transition-colors" title="Rediger">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onclick="deleteVehicleServicePrompt('${s.id}')" class="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors" title="Slett">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } else {
        historyHTML = '<p class="text-sm text-gray-500 italic py-2">Ingen utførte servicer</p>';
    }

    // --- Notes ---
    const notesHTML = vehicle.notes
        ? `<div class="text-sm text-gray-300 whitespace-pre-wrap">${esc(vehicle.notes)}</div>`
        : '<p class="text-sm text-gray-500 italic py-2">Ingen notater</p>';

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold">${esc(vehicle.name)}</h2>
                <div class="flex gap-1.5">
                    <button onclick="showEditVehicleForm('${id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm text-gray-300">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        Rediger
                    </button>
                    <button onclick="deleteVehiclePrompt('${id}')" class="p-1.5 rounded-lg bg-dark-700 hover:bg-red-900/30 transition-colors text-gray-400 hover:text-red-400" title="Slett bil">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </div>

            ${alertHTML}

            <!-- Vehicle Info -->
            <div class="bg-dark-800 rounded-xl border border-dark-600">
                <div class="p-3 border-b border-dark-600 flex items-center justify-between">
                    <h3 class="font-semibold text-gray-300 text-sm">Bilinformasjon</h3>
                    <button onclick="showEditVehicleForm('${id}')" class="text-xs text-neon-blue hover:underline">Rediger</button>
                </div>
                <div class="p-3">${infoHTML}</div>
            </div>

            <!-- Km update shortcut -->
            <button onclick="updateMileagePrompt('${id}')" class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border border-dark-600 bg-dark-800 text-gray-300 hover:border-neon-blue/30 hover:text-neon-blue transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                Oppdater kilometerstand
            </button>

            <!-- Tires -->
            <div class="bg-dark-800 rounded-xl border border-dark-600">
                <div class="p-3 border-b border-dark-600 flex items-center justify-between">
                    <h3 class="font-semibold text-gray-300 text-sm">Dekk</h3>
                    <button onclick="showEditTiresForm('${id}')" class="text-xs text-neon-blue hover:underline">${hasTireInfo ? 'Rediger' : 'Legg til'}</button>
                </div>
                <div class="p-3">${tireHTML}</div>
            </div>

            <!-- Upcoming services -->
            <div class="bg-dark-800 rounded-xl border border-dark-600">
                <div class="p-3 border-b border-dark-600 flex items-center justify-between">
                    <h3 class="font-semibold text-gray-300 text-sm">Kommende servicer</h3>
                    <button onclick="showAddVehicleServiceForm('${id}')" class="text-xs px-2.5 py-1 rounded-lg bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-colors font-medium">+ Ny</button>
                </div>
                <div class="p-3 space-y-2">${plannedHTML}</div>
            </div>

            <!-- Service history -->
            <div class="bg-dark-800 rounded-xl border border-dark-600">
                <div class="p-3 border-b border-dark-600 flex items-center justify-between">
                    <h3 class="font-semibold text-gray-300 text-sm">Servicehistorikk</h3>
                    <button onclick="showAddVehicleServiceForm('${id}')" class="text-xs px-2.5 py-1 rounded-lg bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors font-medium">+ Registrer</button>
                </div>
                <div class="p-3 space-y-2">${historyHTML}</div>
            </div>

            <!-- Notes -->
            <div class="bg-dark-800 rounded-xl border border-dark-600">
                <div class="p-3 border-b border-dark-600 flex items-center justify-between">
                    <h3 class="font-semibold text-gray-300 text-sm">Notater</h3>
                    <button onclick="showEditVehicleForm('${id}')" class="text-xs text-neon-blue hover:underline">Rediger</button>
                </div>
                <div class="p-3">${notesHTML}</div>
            </div>
        </div>
    `;
}

function showEditTiresForm(vehicleId) {
    const vehicle = DB.getVehicle(vehicleId);
    if (!vehicle) return;
    const tires = vehicle.tires || {};

    openModal('Dekkinfo', `
        <form id="tire-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Dekktype</label>
                <select id="tf-type" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    <option value="">Velg...</option>
                    <option value="summer" ${tires.currentType === 'summer' ? 'selected' : ''}>Sommerdekk</option>
                    <option value="winter" ${tires.currentType === 'winter' ? 'selected' : ''}>Vinterdekk (uten pigg)</option>
                    <option value="studded" ${tires.currentType === 'studded' ? 'selected' : ''}>Piggdekk</option>
                    <option value="allseason" ${tires.currentType === 'allseason' ? 'selected' : ''}>Helårsdekk</option>
                </select>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Dimensjon</label>
                <input type="text" id="tf-size" value="${esc(tires.size || '')}" placeholder="f.eks. 205/55 R16" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Merke / Modell</label>
                <input type="text" id="tf-brand" value="${esc(tires.brand || '')}" placeholder="f.eks. Continental WinterContact" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Sist byttet (dato)</label>
                <input type="date" id="tf-changed" value="${tires.changedAt || ''}" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Kilometerstand ved bytte</label>
                <input type="number" id="tf-changed-km" value="${tires.changedAtMileage || ''}" min="0" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Notater om dekk</label>
                <textarea id="tf-notes" rows="2" placeholder="Mønsterdybde, tilstand, lagring..." class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none resize-none">${esc(tires.notes || '')}</textarea>
            </div>
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Lagre dekkinfo</button>
        </form>
    `);

    document.getElementById('tire-form').addEventListener('submit', e => {
        e.preventDefault();
        const updatedTires = {
            currentType: document.getElementById('tf-type').value || null,
            size: document.getElementById('tf-size').value.trim() || null,
            brand: document.getElementById('tf-brand').value.trim() || null,
            changedAt: document.getElementById('tf-changed').value || null,
            changedAtMileage: parseInt(document.getElementById('tf-changed-km').value) || null,
            notes: document.getElementById('tf-notes').value.trim() || null,
        };
        DB.updateVehicle(vehicleId, { tires: updatedTires });
        closeModal();
        if (App.currentView === 'vehicle-profile') renderVehicleProfile();
        else renderVehicle();
        toast('Dekkinfo oppdatert', 'success');
    });
}

// ========================
// Vehicle Services
// ========================

function showAddVehicleServiceForm(vehicleId) {
    const vehicle = DB.getVehicle(vehicleId);
    if (!vehicle) return;

    openModal('Ny service', `
        <div class="space-y-4">
            <div class="flex rounded-lg bg-dark-700 p-1">
                <button type="button" id="vs-tab-completed" class="flex-1 py-2 rounded-md text-sm font-medium transition-colors bg-neon-green/20 text-neon-green">Utført</button>
                <button type="button" id="vs-tab-planned" class="flex-1 py-2 rounded-md text-sm font-medium transition-colors text-gray-400 hover:text-gray-200">Kommende</button>
            </div>
            <form id="add-vs-form" class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Type service *</label>
                    <input type="text" id="vs-name" placeholder="f.eks. Oljeskift, Dekkskift, EU-kontroll..." class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
                </div>
                <div id="vs-completed-fields">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Dato utført *</label>
                            <input type="date" id="vs-date" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Kilometerstand ved service</label>
                            <input type="number" id="vs-mileage" value="${vehicle.mileage || ''}" min="0" placeholder="f.eks. 85000" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Beskrivelse</label>
                            <textarea id="vs-description" rows="2" placeholder="Hva ble gjort..." class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none resize-none"></textarea>
                        </div>
                        <div class="bg-dark-700 rounded-lg p-3 space-y-3">
                            <h4 class="text-sm font-medium text-gray-300">Neste service-intervall</h4>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">Antall kilometer til neste</label>
                                <input type="number" id="vs-interval-km" min="0" placeholder="f.eks. 15000" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">Antall måneder til neste</label>
                                <input type="number" id="vs-interval-months" min="0" placeholder="f.eks. 12" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                            </div>
                            <p class="text-xs text-gray-500">Fyll inn km, måneder, eller begge. Forfalt når enten km eller tid er nådd.</p>
                        </div>
                    </div>
                </div>
                <div id="vs-planned-fields" class="hidden">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Beskrivelse</label>
                            <textarea id="vs-planned-description" rows="2" placeholder="Hva skal gjøres..." class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none resize-none"></textarea>
                        </div>
                        <div class="bg-dark-700 rounded-lg p-3 space-y-3">
                            <h4 class="text-sm font-medium text-gray-300">Forfaller ved</h4>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">Dato</label>
                                <input type="date" id="vs-planned-date" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">Kilometerstand</label>
                                <input type="number" id="vs-planned-km" min="0" placeholder="f.eks. 100000" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                            </div>
                            <p class="text-xs text-gray-500">Fyll inn dato, km, eller begge. Du varsles når servicen nærmer seg.</p>
                        </div>
                    </div>
                </div>
                <input type="hidden" id="vs-mode" value="completed">
                <button type="submit" id="vs-submit-btn" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Registrer service</button>
            </form>
        </div>
    `);

    document.getElementById('vs-date').valueAsDate = new Date();

    const tabCompleted = document.getElementById('vs-tab-completed');
    const tabPlanned = document.getElementById('vs-tab-planned');
    const completedFields = document.getElementById('vs-completed-fields');
    const plannedFields = document.getElementById('vs-planned-fields');
    const modeInput = document.getElementById('vs-mode');
    const submitBtn = document.getElementById('vs-submit-btn');

    tabCompleted.addEventListener('click', () => {
        tabCompleted.className = 'flex-1 py-2 rounded-md text-sm font-medium transition-colors bg-neon-green/20 text-neon-green';
        tabPlanned.className = 'flex-1 py-2 rounded-md text-sm font-medium transition-colors text-gray-400 hover:text-gray-200';
        completedFields.classList.remove('hidden');
        plannedFields.classList.add('hidden');
        modeInput.value = 'completed';
        submitBtn.textContent = 'Registrer service';
    });

    tabPlanned.addEventListener('click', () => {
        tabPlanned.className = 'flex-1 py-2 rounded-md text-sm font-medium transition-colors bg-neon-blue/20 text-neon-blue';
        tabCompleted.className = 'flex-1 py-2 rounded-md text-sm font-medium transition-colors text-gray-400 hover:text-gray-200';
        plannedFields.classList.remove('hidden');
        completedFields.classList.add('hidden');
        modeInput.value = 'planned';
        submitBtn.textContent = 'Legg til kommende service';
    });

    document.getElementById('add-vs-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('vs-name').value.trim();
        if (!name) return toast('Fyll inn type service', 'error');
        const mode = document.getElementById('vs-mode').value;

        if (mode === 'completed') {
            const completedAt = document.getElementById('vs-date').value;
            if (!completedAt) return toast('Fyll inn dato', 'error');
            const mileageAtService = parseInt(document.getElementById('vs-mileage').value) || null;

            DB.addVehicleService({
                vehicleId,
                name,
                completedAt,
                mileageAtService,
                description: document.getElementById('vs-description').value.trim(),
                nextIntervalKm: parseInt(document.getElementById('vs-interval-km').value) || null,
                nextIntervalMonths: parseInt(document.getElementById('vs-interval-months').value) || null,
            });

            if (mileageAtService && (!vehicle.mileage || mileageAtService > vehicle.mileage)) {
                DB.updateVehicle(vehicleId, { mileage: mileageAtService });
            }
            toast('Service registrert', 'success');
        } else {
            const plannedDate = document.getElementById('vs-planned-date').value || null;
            const plannedKm = parseInt(document.getElementById('vs-planned-km').value) || null;
            if (!plannedDate && !plannedKm) return toast('Fyll inn dato eller kilometerstand', 'error');

            DB.addVehicleService({
                vehicleId,
                name,
                completedAt: null,
                mileageAtService: null,
                description: document.getElementById('vs-planned-description').value.trim(),
                nextDueDate: plannedDate,
                nextDueKm: plannedKm,
                nextIntervalKm: null,
                nextIntervalMonths: null,
            });
            toast('Kommende service lagt til', 'success');
        }

        closeModal();
        refreshVehicleView();
    });
}

function showEditVehicleServiceForm(serviceId) {
    const service = DB.getVehicleService(serviceId);
    if (!service) return;
    const vehicle = DB.getVehicle(service.vehicleId);
    const isPlanned = !service.completedAt;

    if (isPlanned) {
        openModal('Rediger kommende service', `
            <form id="edit-vs-form" class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Type service *</label>
                    <input type="text" id="evs-name" value="${esc(service.name)}" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Beskrivelse</label>
                    <textarea id="evs-description" rows="2" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none resize-none">${esc(service.description || '')}</textarea>
                </div>
                <div class="bg-dark-700 rounded-lg p-3 space-y-3">
                    <h4 class="text-sm font-medium text-gray-300">Forfaller ved</h4>
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">Dato</label>
                        <input type="date" id="evs-planned-date" value="${service.nextDueDate || ''}" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">Kilometerstand</label>
                        <input type="number" id="evs-planned-km" value="${service.nextDueKm || ''}" min="0" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                </div>
                <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Lagre endringer</button>
            </form>
        `);

        document.getElementById('edit-vs-form').addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('evs-name').value.trim();
            if (!name) return toast('Fyll inn type', 'error');
            const plannedDate = document.getElementById('evs-planned-date').value || null;
            const plannedKm = parseInt(document.getElementById('evs-planned-km').value) || null;
            if (!plannedDate && !plannedKm) return toast('Fyll inn dato eller km', 'error');

            DB.updateVehicleService(serviceId, {
                name,
                description: document.getElementById('evs-description').value.trim(),
                nextDueDate: plannedDate,
                nextDueKm: plannedKm,
            });

            closeModal();
            refreshVehicleView();
            toast('Service oppdatert', 'success');
        });
    } else {
        openModal('Rediger service', `
            <form id="edit-vs-form" class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Type service *</label>
                    <input type="text" id="evs-name" value="${esc(service.name)}" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Dato utført *</label>
                    <input type="date" id="evs-date" value="${service.completedAt}" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Kilometerstand ved service</label>
                    <input type="number" id="evs-mileage" value="${service.mileageAtService || ''}" min="0" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Beskrivelse</label>
                    <textarea id="evs-description" rows="2" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none resize-none">${esc(service.description || '')}</textarea>
                </div>
                <div class="bg-dark-700 rounded-lg p-3 space-y-3">
                    <h4 class="text-sm font-medium text-gray-300">Neste service-intervall</h4>
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">Antall kilometer til neste</label>
                        <input type="number" id="evs-interval-km" value="${service.nextIntervalKm || ''}" min="0" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">Antall måneder til neste</label>
                        <input type="number" id="evs-interval-months" value="${service.nextIntervalMonths || ''}" min="0" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                </div>
                <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Lagre endringer</button>
            </form>
        `);

        document.getElementById('edit-vs-form').addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('evs-name').value.trim();
            const completedAt = document.getElementById('evs-date').value;
            if (!name || !completedAt) return toast('Fyll inn type og dato', 'error');

            DB.updateVehicleService(serviceId, {
                name,
                completedAt,
                mileageAtService: parseInt(document.getElementById('evs-mileage').value) || null,
                description: document.getElementById('evs-description').value.trim(),
                nextIntervalKm: parseInt(document.getElementById('evs-interval-km').value) || null,
                nextIntervalMonths: parseInt(document.getElementById('evs-interval-months').value) || null,
            });

            closeModal();
            refreshVehicleView();
            toast('Service oppdatert', 'success');
        });
    }
}

function completeVehicleServicePrompt(serviceId) {
    const service = DB.getVehicleService(serviceId);
    if (!service) return;
    const vehicle = DB.getVehicle(service.vehicleId);

    openModal('Marker som utført', `
        <form id="complete-vs-form" class="space-y-4">
            <div class="bg-dark-700 rounded-lg p-3">
                <div class="font-medium">${esc(service.name)}</div>
                ${service.description ? `<div class="text-sm text-gray-400 mt-1">${esc(service.description)}</div>` : ''}
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Dato utført</label>
                <input type="date" id="cvs-date" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Kilometerstand</label>
                <input type="number" id="cvs-mileage" value="${vehicle?.mileage || ''}" min="0" placeholder="f.eks. 95000" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Marker som utført</button>
        </form>
    `);

    document.getElementById('cvs-date').valueAsDate = new Date();

    document.getElementById('complete-vs-form').addEventListener('submit', e => {
        e.preventDefault();
        const completedAt = document.getElementById('cvs-date').value;
        if (!completedAt) return toast('Fyll inn dato', 'error');
        const mileageAtService = parseInt(document.getElementById('cvs-mileage').value) || null;

        DB.completeVehicleService(serviceId, completedAt, mileageAtService);

        if (mileageAtService && vehicle && (!vehicle.mileage || mileageAtService > vehicle.mileage)) {
            DB.updateVehicle(service.vehicleId, { mileage: mileageAtService });
        }

        closeModal();
        refreshVehicleView();
        toast('Service markert som utført', 'success');
    });
}

function deleteVehicleServicePrompt(serviceId) {
    const service = DB.getVehicleService(serviceId);
    if (!service) return;
    openModal('Slett service', `
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette <strong>${esc(service.name)}</strong>?</p>
        <div class="flex gap-2">
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors">Avbryt</button>
            <button id="confirm-delete-vs" class="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Slett</button>
        </div>
    `);
    document.getElementById('confirm-delete-vs').addEventListener('click', () => {
        DB.deleteVehicleService(serviceId);
        closeModal();
        refreshVehicleView();
        toast('Service slettet', 'success');
    });
}

function updateMileagePrompt(vehicleId) {
    const vehicle = DB.getVehicle(vehicleId);
    if (!vehicle) return;
    openModal('Oppdater kilometerstand', `
        <form id="update-mileage-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Ny kilometerstand</label>
                <input type="number" id="um-mileage" value="${vehicle.mileage || ''}" min="0" placeholder="f.eks. 90000" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
                ${vehicle.mileage ? `<p class="text-xs text-gray-500 mt-1">Nåværende: ${vehicle.mileage.toLocaleString('nb-NO')} km</p>` : ''}
            </div>
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Oppdater</button>
        </form>
    `);

    document.getElementById('update-mileage-form').addEventListener('submit', e => {
        e.preventDefault();
        const mileage = parseInt(document.getElementById('um-mileage').value);
        if (!mileage || mileage < 0) return toast('Ugyldig kilometerstand', 'error');
        DB.updateVehicle(vehicleId, { mileage });
        closeModal();
        refreshVehicleView();
        toast('Kilometerstand oppdatert', 'success');
    });
}

// ========================
// Vehicle Load from Packing List
// ========================

function showVehicleLoadListPicker() {
    const activeId = DB.getActiveVehicleId();
    if (!activeId) {
        toast('Velg en bil først', 'error');
        return;
    }
    const lists = DB.getPackingLists();
    if (lists.length === 0) {
        toast('Ingen pakkelister tilgjengelig', 'error');
        return;
    }

    openModal('Velg pakkeliste', `
        <div class="space-y-2">
            ${lists.map(list => {
                const total = list.items.length;
                const packed = list.items.filter(i => i.packed).length;
                const pct = total > 0 ? Math.round((packed / total) * 100) : 0;
                const date = new Date(list.date || list.createdAt).toLocaleDateString('nb-NO');
                return `<button class="vl-pick w-full text-left p-3 rounded-lg bg-dark-700 border border-dark-600 hover:border-neon-yellow/40 transition-colors" data-id="${list.id}">
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="font-medium text-sm">${esc(list.name)}</div>
                            <div class="text-xs text-gray-400">${esc(list.jobName || 'Ingen jobb')} · ${date}</div>
                        </div>
                        <span class="text-xs px-2 py-0.5 rounded-full ${pct === 100 ? 'bg-neon-green/20 text-neon-green' : 'bg-dark-600 text-gray-400'}">${packed}/${total}</span>
                    </div>
                    <div class="mt-1.5 w-full bg-dark-600 rounded-full h-1">
                        <div class="h-1 rounded-full transition-all ${pct === 100 ? 'bg-neon-green' : 'bg-neon-blue'}" style="width: ${pct}%"></div>
                    </div>
                </button>`;
            }).join('')}
        </div>
    `);

    document.querySelectorAll('.vl-pick').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal();
            startVehicleLoad(btn.dataset.id);
        });
    });
}

function startVehicleLoad(listId) {
    App.vehicleLoadListId = listId;
    showView('vehicle-load');
    renderVehicleLoad();
}

function renderVehicleLoad() {
    const list = DB.getPackingList(App.vehicleLoadListId);
    const activeId = DB.getActiveVehicleId();
    const vehicle = DB.getVehicle(activeId);

    if (!list || !vehicle) {
        showView('vehicle');
        return;
    }

    const headerEl = document.getElementById('vehicle-load-header');
    const total = list.items.length;
    const packed = list.items.filter(i => i.packed).length;
    const pct = total > 0 ? Math.round((packed / total) * 100) : 0;

    headerEl.innerHTML = `
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-xl font-bold">${esc(list.name)}</h2>
                <p class="text-sm text-gray-400">${esc(list.jobName || '')} &middot; Laster inn i <span class="text-neon-blue font-medium">${esc(vehicle.name)}</span></p>
            </div>
            <span class="px-2.5 py-1 rounded-lg text-sm font-semibold ${packed === total && total > 0 ? 'bg-neon-green/20 text-neon-green' : 'bg-dark-700 text-gray-300'}">${packed}/${total}</span>
        </div>
        <div class="mt-2 w-full bg-dark-700 rounded-full h-2">
            <div class="h-2 rounded-full transition-all ${packed === total && total > 0 ? 'bg-neon-green' : 'bg-neon-yellow'}" style="width: ${pct}%"></div>
        </div>
        ${packed === total && total > 0 ? '<div class="mt-2 p-2.5 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green text-sm text-center font-semibold">Alt er pakket og lastet!</div>' : ''}
    `;

    const container = document.getElementById('vehicle-load-items');
    if (list.items.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-gray-500">
            <p>Ingen produkter i listen</p>
        </div>`;
        return;
    }

    const unpacked = list.items.filter(i => !i.packed);
    const packedItems = list.items.filter(i => i.packed);
    const sorted = [...unpacked, ...packedItems];

    container.innerHTML = sorted.map(item => {
        const product = DB.getProduct(item.productId);
        return `
        <div class="check-item ${item.packed ? 'checked' : ''} flex items-center gap-3 bg-dark-800 rounded-lg p-3 border ${item.packed ? 'border-neon-green/20' : 'border-dark-600'} cursor-pointer transition-all" onclick="toggleVehicleLoadItem('${item.id}')">
            <div class="w-7 h-7 rounded-md border-2 ${item.packed ? 'bg-neon-green border-neon-green' : 'border-gray-500'} flex items-center justify-center shrink-0 transition-colors">
                ${item.packed ? '<svg class="w-4 h-4 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
            </div>
            <div class="flex-1 min-w-0">
                <div class="item-name font-medium text-sm">${esc(product?.name || item.productName || 'Ukjent produkt')}</div>
                <div class="text-xs text-gray-500">${item.quantity} stk${product?.unitsPerPackage > 1 ? ` (${item.quantity * product.unitsPerPackage} enheter totalt)` : ''}</div>
            </div>
            ${product ? `<div class="text-xs text-gray-600 font-mono shrink-0">${product.barcode}</div>` : ''}
        </div>`;
    }).join('');
}

function toggleVehicleLoadItem(itemId) {
    const list = DB.getPackingList(App.vehicleLoadListId);
    if (!list) return;
    const item = list.items.find(i => i.id === itemId);
    if (!item) return;

    const wasPacked = item.packed;
    DB.toggleListItem(App.vehicleLoadListId, itemId);

    if (!wasPacked) {
        const product = DB.getProduct(item.productId);
        if (product) {
            DB.vehicleIn({
                type: 'product',
                refId: product.id,
                name: product.name,
                barcode: product.barcode,
                quantity: item.quantity,
            });
            toast(`${product.name} lastet inn`, 'success');
        }
    }

    renderVehicleLoad();
}

function handleVehicleLoadScan(barcode) {
    const list = DB.getPackingList(App.vehicleLoadListId);
    const activeId = DB.getActiveVehicleId();
    const vehicle = DB.getVehicle(activeId);
    const resultEl = document.getElementById('vehicle-load-scan-result');

    if (!list || !vehicle) return;

    const result = DB.findByBarcode(barcode);

    if (!result) {
        resultEl.classList.remove('hidden');
        resultEl.innerHTML = `<div class="text-center py-3 px-2">
            <div class="text-neon-pink text-sm font-semibold">Ikke funnet</div>
            <div class="text-xs text-gray-400">Strekkode <strong>${esc(barcode)}</strong> finnes ikke i systemet.</div>
        </div>`;
        return;
    }

    if (result.type === 'product') {
        const listItem = list.items.find(i => i.productId === result.data.id && !i.packed);

        if (listItem) {
            DB.toggleListItem(App.vehicleLoadListId, listItem.id);
            DB.vehicleIn({
                type: 'product',
                refId: result.data.id,
                name: result.data.name,
                barcode: result.data.barcode,
                quantity: listItem.quantity,
            });
            resultEl.classList.remove('hidden');
            resultEl.innerHTML = `<div class="text-center py-3 px-2">
                <div class="text-neon-green text-sm font-semibold">${esc(result.data.name)}</div>
                <div class="text-xs text-gray-400">Avkrysset og lastet inn i ${esc(vehicle.name)}</div>
            </div>`;
            toast(`${result.data.name} lastet inn`, 'success');
        } else {
            const allMatching = list.items.filter(i => i.productId === result.data.id);
            if (allMatching.length > 0 && allMatching.every(i => i.packed)) {
                resultEl.classList.remove('hidden');
                resultEl.innerHTML = `<div class="text-center py-3 px-2">
                    <div class="text-neon-yellow text-sm font-semibold">Allerede pakket</div>
                    <div class="text-xs text-gray-400"><strong>${esc(result.data.name)}</strong> er allerede avkrysset på listen.</div>
                </div>`;
            } else {
                resultEl.classList.remove('hidden');
                resultEl.innerHTML = `<div class="text-center py-3 px-2">
                    <div class="text-neon-yellow text-sm font-semibold">Ikke på listen</div>
                    <div class="text-xs text-gray-400 mb-2"><strong>${esc(result.data.name)}</strong> er ikke på denne pakkelisten.</div>
                    <button id="vl-force-load" class="text-xs px-3 py-1.5 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors">Last inn i ${esc(vehicle.name)} likevel</button>
                </div>`;
                document.getElementById('vl-force-load')?.addEventListener('click', () => {
                    DB.vehicleIn({
                        type: 'product',
                        refId: result.data.id,
                        name: result.data.name,
                        barcode: result.data.barcode,
                        quantity: 1,
                    });
                    resultEl.innerHTML = `<div class="text-center py-3 px-2">
                        <div class="text-neon-green text-sm font-semibold">${esc(result.data.name)}</div>
                        <div class="text-xs text-gray-400">Lastet inn i ${esc(vehicle.name)}</div>
                    </div>`;
                    toast(`${result.data.name} lastet inn`, 'success');
                });
            }
        }
        renderVehicleLoad();
    } else if (result.type === 'box') {
        DB.vehicleIn({
            type: 'box',
            refId: result.data.id,
            name: result.data.name,
            barcode: result.data.barcode,
            quantity: 1,
        });

        let checkedCount = 0;
        result.data.items.forEach(boxItem => {
            const listItem = list.items.find(i => i.productId === boxItem.productId && !i.packed);
            if (listItem) {
                DB.toggleListItem(App.vehicleLoadListId, listItem.id);
                checkedCount++;
            }
        });

        resultEl.classList.remove('hidden');
        resultEl.innerHTML = `<div class="text-center py-3 px-2">
            <div class="text-neon-green text-sm font-semibold">Boks: ${esc(result.data.name)}</div>
            <div class="text-xs text-gray-400">Lastet inn i ${esc(vehicle.name)}${checkedCount > 0 ? ` · ${checkedCount} punkt${checkedCount > 1 ? 'er' : ''} avkrysset` : ''}</div>
        </div>`;
        toast(`${result.data.name} lastet inn`, 'success');
        renderVehicleLoad();
    }
}

// ========================
// Service / Fault Reports
// ========================

function updateServiceBadge() {
    const badge = document.getElementById('service-badge');
    if (badge) {
        const count = DB.getPendingServiceCount();
        if (count > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
}

function renderService() {
    const reports = DB.getServiceReports();
    const pending = reports.filter(r => r.status === 'pending');
    const resolved = reports.filter(r => r.status !== 'pending');
    const container = document.getElementById('service-list');

    updateServiceBadge();

    if (reports.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p>Ingen feilmeldinger</p>
            <p class="text-sm mt-1">Trykk + Meld feil eller Skann for å rapportere</p>
        </div>`;
        return;
    }

    let html = '';

    if (pending.length > 0) {
        html += `<div>
            <h3 class="font-semibold text-neon-yellow mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Trenger service (${pending.length})
            </h3>
            <div class="space-y-2">${pending.map(r => {
                const date = new Date(r.createdAt).toLocaleDateString('nb-NO');
                return `<div class="bg-dark-800 rounded-xl p-3 border border-neon-yellow/20 slide-up-enter">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex-1 min-w-0">
                            <div class="font-semibold">${esc(r.productName)}</div>
                            <div class="text-sm text-gray-400 mt-1">${esc(r.description)}</div>
                            ${r.boxName ? `<div class="text-xs text-gray-500 mt-1">Boks: ${esc(r.boxName)}</div>` : ''}
                            <div class="text-xs text-gray-600 mt-1">${date}</div>
                        </div>
                        <button onclick="showResolveOptions('${r.id}')" class="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-neon-yellow/20 text-neon-yellow hover:bg-neon-yellow/30 transition-colors font-medium">Løs</button>
                    </div>
                </div>`;
            }).join('')}</div>
        </div>`;
    }

    if (resolved.length > 0) {
        html += `<div class="${pending.length > 0 ? 'mt-4' : ''}">
            <h3 class="font-semibold text-gray-500 mb-2">Historikk</h3>
            <div class="space-y-2">${resolved.slice(0, 20).map(r => {
                const statusBadge = r.status === 'repaired'
                    ? '<span class="text-xs px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green">Reparert</span>'
                    : `<span class="text-xs px-2 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink">Ødelagt${r.removedFromBox ? ' (tatt ut)' : ''}</span>`;
                const date = new Date(r.resolvedAt || r.createdAt).toLocaleDateString('nb-NO');
                return `<div class="bg-dark-800 rounded-xl p-3 border border-dark-600 opacity-60">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-sm">${esc(r.productName)}</div>
                            <div class="text-xs text-gray-500 mt-0.5">${esc(r.description)}</div>
                        </div>
                        <div class="shrink-0 text-right">
                            ${statusBadge}
                            <div class="text-xs text-gray-600 mt-1">${date}</div>
                        </div>
                    </div>
                </div>`;
            }).join('')}</div>
        </div>`;
    }

    container.innerHTML = html;
}

function showReportFaultForm(preselected = null) {
    const products = DB.getProducts();
    if (products.length === 0) {
        toast('Legg til produkter først', 'error');
        return;
    }

    let selectedProductId = preselected ? preselected.id : null;

    openModal('Meld feil', `
        <div class="space-y-4">
            <div id="rf-search-area" ${preselected ? 'class="hidden"' : ''}>
                <label class="block text-sm text-gray-400 mb-1">Søk produkt (navn eller strekkode)</label>
                <input type="text" id="rf-search" placeholder="Skriv for å søke..." class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                <div id="rf-results" class="mt-2 space-y-1 max-h-40 overflow-y-auto"></div>
            </div>
            <div id="rf-selected-info" class="${preselected ? '' : 'hidden'} bg-neon-green/10 border border-neon-green/20 rounded-lg p-3">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-medium text-neon-green" id="rf-selected-name">${preselected ? esc(preselected.name) : ''}</div>
                        <div class="text-xs text-gray-400" id="rf-selected-barcode">${preselected ? esc(preselected.barcode) : ''}</div>
                    </div>
                    <button type="button" id="rf-change-btn" class="text-xs text-neon-blue hover:underline">Endre</button>
                </div>
            </div>
            <div id="rf-detail-fields" class="${preselected ? '' : 'hidden'} space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Beskrivelse av feilen *</label>
                    <textarea id="rf-description" rows="3" placeholder="Beskriv hva som er feil..." class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none resize-none"></textarea>
                </div>
                <div id="rf-box-area" class="hidden">
                    <label class="block text-sm text-gray-400 mb-1">Hvilken boks er produktet i?</label>
                    <select id="rf-box" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                        <option value="">Ingen boks / vet ikke</option>
                    </select>
                </div>
                <button type="button" id="rf-submit-btn" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Meld feil</button>
            </div>
        </div>
    `);

    const searchInput = document.getElementById('rf-search');
    const resultsEl = document.getElementById('rf-results');
    const searchArea = document.getElementById('rf-search-area');
    const selectedInfo = document.getElementById('rf-selected-info');
    const detailFields = document.getElementById('rf-detail-fields');

    function selectProduct(pid) {
        selectedProductId = pid;
        const product = DB.getProduct(pid);
        if (!product) return;
        document.getElementById('rf-selected-name').textContent = product.name;
        document.getElementById('rf-selected-barcode').textContent = product.barcode;
        searchArea.classList.add('hidden');
        selectedInfo.classList.remove('hidden');
        detailFields.classList.remove('hidden');

        const boxes = DB.getBoxes().filter(b => b.items.some(i => i.productId === pid));
        const boxArea = document.getElementById('rf-box-area');
        if (boxes.length > 0) {
            boxArea.classList.remove('hidden');
            document.getElementById('rf-box').innerHTML = '<option value="">Ingen boks / vet ikke</option>' +
                boxes.map(b => `<option value="${b.id}">${esc(b.name)} (${b.barcode})</option>`).join('');
        } else {
            boxArea.classList.add('hidden');
        }
    }

    window._rfSelect = selectProduct;

    searchInput?.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) { resultsEl.innerHTML = ''; return; }
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.barcode.toLowerCase().includes(query) ||
            (p.category || '').toLowerCase().includes(query)
        );
        if (filtered.length === 0) {
            resultsEl.innerHTML = '<p class="text-sm text-gray-500 py-2">Ingen treff</p>';
        } else {
            resultsEl.innerHTML = filtered.slice(0, 10).map(p =>
                `<button type="button" class="w-full text-left p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors" onclick="_rfSelect('${p.id}')">
                    <div class="text-sm font-medium">${esc(p.name)}</div>
                    <div class="text-xs text-gray-500">${esc(p.barcode)} · ${esc(p.category || 'Ingen kategori')}</div>
                </button>`
            ).join('');
        }
    });

    document.getElementById('rf-change-btn')?.addEventListener('click', () => {
        selectedProductId = null;
        searchArea.classList.remove('hidden');
        selectedInfo.classList.add('hidden');
        detailFields.classList.add('hidden');
        if (searchInput) { searchInput.value = ''; searchInput.focus(); }
    });

    document.getElementById('rf-submit-btn')?.addEventListener('click', () => {
        if (!selectedProductId) return toast('Velg et produkt', 'error');
        const description = document.getElementById('rf-description').value.trim();
        if (!description) return toast('Beskriv feilen', 'error');

        const product = DB.getProduct(selectedProductId);
        const boxId = document.getElementById('rf-box')?.value || null;
        const box = boxId ? DB.getBox(boxId) : null;

        DB.addServiceReport({
            productId: selectedProductId,
            productName: product?.name || 'Ukjent',
            barcode: product?.barcode || '',
            description,
            boxId: boxId || null,
            boxName: box?.name || null,
        });

        closeModal();
        renderService();
        toast('Feil meldt', 'success');
    });

    if (preselected) {
        selectProduct(preselected.id);
    }
}

function showResolveOptions(reportId) {
    const report = DB.getServiceReport(reportId);
    if (!report) return;

    openModal('Løs feil', `
        <div class="space-y-4">
            <div class="bg-dark-700 rounded-lg p-3">
                <div class="font-medium">${esc(report.productName)}</div>
                <div class="text-sm text-gray-400 mt-1">${esc(report.description)}</div>
                ${report.boxName ? `<div class="text-xs text-gray-500 mt-1">Boks: ${esc(report.boxName)}</div>` : ''}
            </div>
            <div class="space-y-2">
                <button onclick="resolveRepaired('${report.id}')" class="w-full py-3 rounded-lg text-sm font-semibold bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors">
                    Reparert
                </button>
                <button onclick="resolveDestroyedStart('${report.id}')" class="w-full py-3 rounded-lg text-sm font-semibold bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/30 transition-colors">
                    Ødelagt
                </button>
            </div>
            <button onclick="closeModal()" class="w-full py-2 rounded-lg text-sm text-gray-400 bg-dark-700 hover:bg-dark-600 transition-colors">Avbryt</button>
        </div>
    `);
}

function resolveRepaired(reportId) {
    DB.resolveServiceReport(reportId, 'repaired');
    closeModal();
    renderService();
    toast('Markert som reparert', 'success');
}

function resolveDestroyedStart(reportId) {
    const report = DB.getServiceReport(reportId);
    if (!report) return;

    if (report.boxId) {
        openModal('Produkt ødelagt', `
            <div class="space-y-4">
                <p class="text-gray-300"><strong>${esc(report.productName)}</strong> er i <strong>${esc(report.boxName)}</strong>.</p>
                <p class="text-gray-400 text-sm">Er produktet erstattet i boksen, eller bare tatt ut?</p>
                <div class="space-y-2">
                    <button onclick="resolveDestroyedReplaced('${report.id}')" class="w-full py-3 rounded-lg text-sm font-semibold bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors">
                        Erstattet i boksen
                    </button>
                    <button onclick="resolveDestroyedRemoved('${report.id}')" class="w-full py-3 rounded-lg text-sm font-semibold bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/30 transition-colors">
                        Tatt ut av boksen
                    </button>
                </div>
                <button onclick="closeModal()" class="w-full py-2 rounded-lg text-sm text-gray-400 bg-dark-700 hover:bg-dark-600 transition-colors">Avbryt</button>
            </div>
        `);
    } else {
        DB.resolveServiceReport(reportId, 'destroyed', false);
        closeModal();
        renderService();
        toast('Markert som ødelagt', 'success');
    }
}

function resolveDestroyedReplaced(reportId) {
    DB.resolveServiceReport(reportId, 'destroyed', false);
    closeModal();
    renderService();
    toast('Markert som ødelagt (erstattet)', 'success');
}

function resolveDestroyedRemoved(reportId) {
    DB.resolveServiceReport(reportId, 'destroyed', true);
    closeModal();
    renderService();
    toast('Ødelagt og tatt ut av boksen', 'success');
}

function serviceScan() {
    App.scannerMode = 'report-fault';
    showView('scanner');
    document.getElementById('scanner-context').innerHTML =
        '<span class="text-neon-yellow font-semibold">Modus: Meld feil</span> — Skann et produkt for å rapportere en feil.';
}

// ========================
// Scanner
// ========================

function handleScan(barcode) {
    const result = DB.findByBarcode(barcode);
    const resultEl = document.getElementById('scanner-result');

    if (!result) {
        resultEl.classList.remove('hidden');
        resultEl.innerHTML = `<div class="text-center py-4">
            <div class="text-neon-pink text-lg mb-1">Ikke funnet</div>
            <div class="text-sm text-gray-400">Strekkode <strong>${esc(barcode)}</strong> finnes ikke i systemet.</div>
        </div>`;
        return;
    }

    if (App.scannerMode === 'report-fault') {
        if (result.type === 'product') {
            stopCamera();
            showView('service');
            setTimeout(() => showReportFaultForm(result.data), 150);
        } else {
            resultEl.classList.remove('hidden');
            resultEl.innerHTML = `<div class="text-center py-4">
                <div class="text-neon-yellow text-lg mb-1">Bare produkter</div>
                <div class="text-sm text-gray-400">Du kan bare melde feil på produkter, ikke bokser. Skann et produkt.</div>
            </div>`;
        }
        return;
    }

    if (App.scannerMode === 'vehicle-in') {
        const activeId = DB.getActiveVehicleId();
        const vehicle = DB.getVehicle(activeId);
        const vName = vehicle?.name || 'bilen';
        const name = result.data.name;
        DB.vehicleIn({
            type: result.type,
            refId: result.data.id,
            name,
            barcode: result.data.barcode,
            quantity: 1,
        });
        resultEl.classList.remove('hidden');
        resultEl.innerHTML = `<div class="text-center py-4">
            <div class="text-neon-green text-lg mb-1">Lastet inn!</div>
            <div class="text-sm text-gray-400"><strong>${esc(name)}</strong> er lagt inn i ${esc(vName)}.</div>
        </div>`;
        toast(`${name} lastet inn i ${vName}`, 'success');
        return;
    }

    if (App.scannerMode === 'vehicle-out') {
        const activeId = DB.getActiveVehicleId();
        const vehicle = DB.getVehicle(activeId);
        const vName = vehicle?.name || 'bilen';
        const items = DB.getVehicleItems();
        const vehicleItem = items.find(v => v.barcode === barcode);
        if (vehicleItem) {
            DB.vehicleOut(vehicleItem.id);
            resultEl.classList.remove('hidden');
            resultEl.innerHTML = `<div class="text-center py-4">
                <div class="text-neon-pink text-lg mb-1">Lastet ut!</div>
                <div class="text-sm text-gray-400"><strong>${esc(vehicleItem.name)}</strong> er tatt ut av ${esc(vName)}.</div>
            </div>`;
            toast(`${vehicleItem.name} lastet ut av ${vName}`, 'success');
        } else {
            resultEl.classList.remove('hidden');
            resultEl.innerHTML = `<div class="text-center py-4">
                <div class="text-neon-yellow text-lg mb-1">Ikke i ${esc(vName)}</div>
                <div class="text-sm text-gray-400"><strong>${esc(result.data.name)}</strong> finnes ikke i ${esc(vName)}.</div>
            </div>`;
        }
        return;
    }

    resultEl.classList.remove('hidden');
    if (result.type === 'product') {
        const p = result.data;
        resultEl.innerHTML = `
            <div class="text-center py-2">
                <div class="text-neon-blue font-semibold mb-1">Produkt funnet</div>
                <div class="text-lg font-bold">${esc(p.name)}</div>
                <div class="text-sm text-gray-400">${esc(p.category || '')} · ${p.unitsPerPackage} enh/pk</div>
                <div class="text-xs text-gray-500 mt-1">${p.barcode}</div>
            </div>
        `;
    } else {
        const b = result.data;
        resultEl.innerHTML = `
            <div class="text-center py-2">
                <div class="text-neon-yellow font-semibold mb-1">Boks funnet</div>
                <div class="text-lg font-bold">${esc(b.name)}</div>
                <div class="text-sm text-gray-400">${b.items.length} produkter</div>
                <div class="text-xs text-gray-500 mt-1">${b.barcode}</div>
                <button onclick="openBoxDetail('${b.id}')" class="mt-2 text-sm text-neon-blue underline">Vis boks</button>
            </div>
        `;
    }
}

async function startCamera() {
    try {
        const video = document.getElementById('scanner-video');
        const placeholder = document.getElementById('scanner-placeholder');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        App.cameraStream = stream;
        video.srcObject = stream;
        video.classList.remove('hidden');
        placeholder.classList.add('hidden');
        video.play();

        document.getElementById('btn-start-camera').classList.add('hidden');
        document.getElementById('btn-stop-camera').classList.remove('hidden');

        if ('BarcodeDetector' in window) {
            const detector = new BarcodeDetector({ formats: ['code_128', 'ean_13', 'ean_8', 'code_39'] });
            App.scanInterval = setInterval(async () => {
                try {
                    const barcodes = await detector.detect(video);
                    if (barcodes.length > 0) {
                        handleScan(barcodes[0].rawValue);
                    }
                } catch {}
            }, 500);
        }
    } catch (err) {
        toast('Kunne ikke starte kamera', 'error');
    }
}

function stopCamera() {
    if (App.cameraStream) {
        App.cameraStream.getTracks().forEach(t => t.stop());
        App.cameraStream = null;
    }
    if (App.scanInterval) {
        clearInterval(App.scanInterval);
        App.scanInterval = null;
    }
    const video = document.getElementById('scanner-video');
    const placeholder = document.getElementById('scanner-placeholder');
    if (video) {
        video.classList.add('hidden');
        video.srcObject = null;
    }
    if (placeholder) placeholder.classList.remove('hidden');

    const startBtn = document.getElementById('btn-start-camera');
    const stopBtn = document.getElementById('btn-stop-camera');
    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
}

// ========================
// Print
// ========================

function printLabel(labelHTML) {
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = labelHTML;

    requestAnimationFrame(() => {
        const svgEl = printArea.querySelector('#print-barcode');
        if (svgEl) {
            const barcode = svgEl.closest('.label-a6')?.querySelector('.label-info')?.textContent?.trim();
            if (barcode) {
                try {
                    JsBarcode(svgEl, barcode, {
                        format: 'CODE128',
                        width: 2,
                        height: 70,
                        displayValue: true,
                        fontSize: 14,
                        margin: 5,
                        lineColor: '#000',
                    });
                } catch {}
            }
        }
        window.print();
    });
}

// ========================
// Crew (Users)
// ========================

const USER_COLORS = ['#ff2d95', '#00d4ff', '#39ff14', '#fff01f', '#b026ff', '#ff6b35', '#00e5a0', '#ff4757'];

function renderCrew() {
    const users = DB.getUsers();
    const activeUser = DB.getActiveUser();

    const indicator = document.getElementById('active-user-indicator');
    if (activeUser) {
        indicator.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="user-avatar" style="background:${activeUser.avatarColor || USER_COLORS[0]}">${activeUser.name.charAt(0).toUpperCase()}</div>
                <div class="flex-1">
                    <div class="text-sm text-gray-400">Aktiv bruker</div>
                    <div class="font-bold">${esc(activeUser.name)}</div>
                </div>
                <span class="text-xs px-2 py-1 rounded-full bg-neon-blue/20 text-neon-blue">Aktiv</span>
            </div>`;
    } else {
        indicator.innerHTML = `<p class="text-sm text-gray-400 text-center py-2">Ingen aktiv bruker — legg til en bruker for å komme i gang</p>`;
    }

    const container = document.getElementById('crew-list');
    if (users.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p>Ingen brukere ennå</p><p class="text-xs mt-1">Trykk "+ Ny bruker" for å legge til</p>
        </div>`;
        return;
    }

    container.innerHTML = users.map(u => {
        const isActive = activeUser && activeUser.id === u.id;
        const activeCheckIn = DB.getActiveCheckIn(u.id);
        let statusHTML = '';
        if (activeCheckIn) {
            const event = DB.getEvent(activeCheckIn.eventId);
            statusHTML = `<span class="text-xs px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green">Sjekket inn: ${esc(event?.name || '?')}</span>`;
        }
        return `<div class="bg-dark-800 rounded-xl p-4 border ${isActive ? 'border-neon-blue/40' : 'border-dark-600'} flex items-center gap-3">
            <div class="user-avatar" style="background:${u.avatarColor || USER_COLORS[0]}">${u.name.charAt(0).toUpperCase()}</div>
            <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">${esc(u.name)}</div>
                <div class="text-xs text-gray-400">${esc(u.phone || '')}</div>
                ${statusHTML}
            </div>
            <div class="flex gap-2">
                ${!isActive ? `<button onclick="setActiveUser('${u.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors">Velg</button>` : ''}
                <button onclick="editUser('${u.id}')" class="text-xs px-2 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Rediger</button>
                <button onclick="deleteUserPrompt('${u.id}')" class="text-xs px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Slett</button>
            </div>
        </div>`;
    }).join('');
}

function showUserForm(user = null) {
    const isEdit = !!user;
    const color = user?.avatarColor || USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    openModal(isEdit ? 'Rediger bruker' : 'Ny bruker', `
        <form id="user-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Navn *</label>
                <input type="text" id="uf-name" value="${esc(user?.name || '')}" required class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Telefon</label>
                <input type="tel" id="uf-phone" value="${esc(user?.phone || '')}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Farge</label>
                <div class="flex gap-2 flex-wrap" id="uf-colors">
                    ${USER_COLORS.map(c => `<button type="button" class="w-8 h-8 rounded-full border-2 ${c === color ? 'border-white scale-110' : 'border-transparent'}" style="background:${c}" data-color="${c}"></button>`).join('')}
                </div>
            </div>
            <input type="hidden" id="uf-color" value="${color}">
            <button type="submit" class="w-full btn-neon py-2 rounded-lg font-semibold">${isEdit ? 'Lagre' : 'Opprett bruker'}</button>
        </form>
    `);

    document.querySelectorAll('#uf-colors button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#uf-colors button').forEach(b => { b.classList.remove('border-white', 'scale-110'); b.classList.add('border-transparent'); });
            btn.classList.remove('border-transparent');
            btn.classList.add('border-white', 'scale-110');
            document.getElementById('uf-color').value = btn.dataset.color;
        });
    });

    document.getElementById('user-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('uf-name').value.trim();
        if (!name) return;
        const data = {
            name,
            phone: document.getElementById('uf-phone').value.trim(),
            avatarColor: document.getElementById('uf-color').value,
        };
        if (isEdit) {
            DB.updateUser(user.id, data);
            toast('Bruker oppdatert', 'success');
        } else {
            DB.addUser(data);
            toast('Bruker opprettet', 'success');
        }
        closeModal();
        renderCrew();
    });
}

function editUser(id) {
    const user = DB.getUser(id);
    if (user) showUserForm(user);
}

function setActiveUser(id) {
    DB.setActiveUser(id);
    toast('Bruker valgt', 'success');
    renderCrew();
}

function deleteUserPrompt(id) {
    const user = DB.getUser(id);
    if (!user) return;
    openModal('Slett bruker', `
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette <strong>${esc(user.name)}</strong>?</p>
        <div class="flex gap-2">
            <button onclick="DB.deleteUser('${id}'); closeModal(); renderCrew(); toast('Bruker slettet');" class="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors font-semibold">Slett</button>
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Avbryt</button>
        </div>
    `);
}

// ========================
// Events (Arrangementer)
// ========================

function renderEvents() {
    const events = DB.getEvents();
    const container = document.getElementById('events-list');

    updateEventBadge();

    if (events.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <p>Ingen arrangementer ennå</p><p class="text-xs mt-1">Trykk "+ Nytt" for å opprette</p>
        </div>`;
        return;
    }

    const now = new Date();
    const sorted = [...events].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    container.innerHTML = sorted.map(ev => {
        const start = new Date(ev.startDate);
        const end = ev.endDate ? new Date(ev.endDate) : null;
        const isActive = ev.status === 'active' || (ev.status !== 'completed' && ev.status !== 'cancelled' && start <= now && (!end || end >= now));
        const isPast = ev.status === 'completed' || (end && end < now);
        const checkIns = DB.getCheckIns(ev.id);
        const activeCheckIns = DB.getActiveCheckIns(ev.id);
        const issues = DB.getOpenIssueReports(ev.id);
        const venue = ev.venueId ? DB.getVenue(ev.venueId) : null;

        let statusBadge = '';
        if (isActive) statusBadge = '<span class="status-badge bg-neon-green/20 text-neon-green">Aktiv</span>';
        else if (isPast) statusBadge = '<span class="status-badge bg-gray-500/20 text-gray-400">Avsluttet</span>';
        else statusBadge = '<span class="status-badge bg-neon-blue/20 text-neon-blue">Kommende</span>';

        const dateStr = start.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
        const endStr = end ? ' — ' + end.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }) : '';

        const locationLine = venue ? esc(venue.name) + (ev.location ? ' — ' + esc(ev.location) : '') : esc(ev.location || '');

        return `<div class="bg-dark-800 rounded-xl p-4 border ${isActive ? 'border-neon-green/30' : 'border-dark-600'} cursor-pointer hover:bg-dark-700 transition-colors" onclick="openEventDetail('${ev.id}')">
            <div class="flex items-start justify-between mb-2">
                <div>
                    <h3 class="font-bold text-base">${esc(ev.name)}</h3>
                    ${locationLine ? `<p class="text-sm text-gray-400">${locationLine}</p>` : ''}
                </div>
                ${statusBadge}
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-400 mt-2">
                <span>${dateStr}${endStr}</span>
                ${(ev.equipment || []).length > 0 ? `<span class="text-neon-green">${ev.equipment.length} utstyr</span>` : ''}
                <span class="text-neon-blue">${checkIns.length} innsjekk</span>
                ${activeCheckIns.length > 0 ? `<span class="text-neon-green">${activeCheckIns.length} aktive</span>` : ''}
                ${issues.length > 0 ? `<span class="text-neon-yellow">${issues.length} feil</span>` : ''}
            </div>
            ${ev.notes ? `<div class="text-xs text-neon-yellow/70 mt-1.5 truncate">${esc(ev.notes)}</div>` : ''}
        </div>`;
    }).join('');
}

function showEventForm(event = null) {
    const isEdit = event && event.id;
    const venues = DB.getVenues();
    const currentVenueId = event?.venueId || '';

    const eqRows = (event?.equipment || []).map((e, i) =>
        `<div class="flex gap-2 items-center ev-eq-row" data-idx="${i}">
            <input type="number" value="${e.quantity || 1}" min="1" class="w-16 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ev-eq-qty">
            <input type="text" value="${esc(e.name)}" placeholder="Utstyrsnavn..." class="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ev-eq-name">
            <button type="button" onclick="this.closest('.ev-eq-row').remove()" class="text-neon-pink text-lg px-1 hover:text-neon-pink/70">&times;</button>
        </div>`
    ).join('');

    const conRows = (event?.consumables || []).map((c, i) =>
        `<div class="flex gap-2 items-center ev-con-row" data-idx="${i}">
            <input type="number" value="${c.quantity || 0}" min="0" class="w-16 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ev-con-qty">
            <input type="text" value="${esc(c.name)}" placeholder="Forbruksmateriell..." class="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ev-con-name">
            <button type="button" onclick="this.closest('.ev-con-row').remove()" class="text-neon-pink text-lg px-1 hover:text-neon-pink/70">&times;</button>
        </div>`
    ).join('');

    const venueOptions = venues.map(v => `<option value="${v.id}" ${v.id === currentVenueId ? 'selected' : ''}>${esc(v.name)}${v.address ? ' — ' + esc(v.address) : ''}</option>`).join('');

    openModal(isEdit ? 'Rediger arrangement' : 'Nytt arrangement', `
        <form id="event-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Navn *</label>
                <input type="text" id="ef-name" value="${esc(event?.name || '')}" required class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>

            <div class="space-y-2">
                <label class="block text-sm text-gray-400 mb-1">Venue / Sted</label>
                <div class="flex gap-2">
                    <select id="ef-venue-select" class="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                        <option value="">— Velg venue —</option>
                        ${venueOptions}
                        <option value="__new__">+ Opprett ny venueprofil...</option>
                    </select>
                </div>
                <div id="ef-venue-info" class="hidden bg-dark-800 rounded-lg border border-dark-600 p-3 text-sm space-y-1"></div>
                <div id="ef-venue-new-form" class="hidden bg-dark-800 rounded-lg border border-neon-blue/30 p-3 space-y-2">
                    <div class="text-xs font-semibold text-neon-blue uppercase tracking-wider mb-1">Ny venueprofil</div>
                    <input type="text" id="ef-vnew-name" placeholder="Navn på venue *" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    <input type="text" id="ef-vnew-address" placeholder="Adresse" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    <textarea id="ef-vnew-description" rows="2" placeholder="Beskrivelse av lokalet (kapasitet, strøm, etc.)" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none"></textarea>
                    <input type="text" id="ef-vnew-contact" placeholder="Kontaktperson / telefon" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Sted (fritekst)</label>
                    <input type="text" id="ef-location" value="${esc(event?.location || '')}" placeholder="F.eks. utendørs, spesifikt rom..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Startdato *</label>
                    <input type="datetime-local" id="ef-start" value="${event?.startDate ? event.startDate.slice(0, 16) : ''}" required class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Sluttdato</label>
                    <input type="datetime-local" id="ef-end" value="${event?.endDate ? event.endDate.slice(0, 16) : ''}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Beskrivelse</label>
                <textarea id="ef-desc" rows="2" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">${esc(event?.description || '')}</textarea>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Notat / spesiell info</label>
                <input type="text" id="ef-notes" value="${esc(event?.notes || '')}" placeholder="F.eks. spesielle krav, merknader..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>

            <div class="space-y-1">
                <div class="flex items-center justify-between">
                    <div class="text-xs font-semibold text-neon-green uppercase tracking-wider">Utstyr (pakkeliste)</div>
                    <button type="button" id="btn-ev-add-eq" class="text-xs text-neon-green hover:underline">+ Legg til</button>
                </div>
                <div id="ef-equipment" class="space-y-1.5">${eqRows}</div>
            </div>

            <div class="space-y-1">
                <div class="flex items-center justify-between">
                    <div class="text-xs font-semibold text-neon-pink uppercase tracking-wider">Forbruksmateriell (påminnelser)</div>
                    <button type="button" id="btn-ev-add-con" class="text-xs text-neon-pink hover:underline">+ Legg til</button>
                </div>
                <div id="ef-consumables" class="space-y-1.5">${conRows}</div>
            </div>

            <button type="submit" class="w-full btn-neon py-2 rounded-lg font-semibold">${isEdit ? 'Lagre' : 'Opprett arrangement'}</button>
        </form>
    `);

    const venueSelect = document.getElementById('ef-venue-select');
    const venueInfo = document.getElementById('ef-venue-info');
    const venueNewForm = document.getElementById('ef-venue-new-form');

    function showVenueDetails(venueId) {
        venueInfo.classList.add('hidden');
        venueNewForm.classList.add('hidden');
        if (venueId === '__new__') {
            venueNewForm.classList.remove('hidden');
            document.getElementById('ef-vnew-name').focus();
        } else if (venueId) {
            const v = DB.getVenue(venueId);
            if (v) {
                venueInfo.classList.remove('hidden');
                venueInfo.innerHTML = `
                    <div class="font-semibold text-white">${esc(v.name)}</div>
                    ${v.address ? `<div class="text-gray-400">${esc(v.address)}</div>` : ''}
                    ${v.description ? `<div class="text-gray-400 text-xs mt-1">${esc(v.description)}</div>` : ''}
                    ${v.contactInfo ? `<div class="text-gray-400 text-xs">${esc(v.contactInfo)}</div>` : ''}
                    ${(v.existingEquipment || []).length > 0 ? `<div class="text-xs text-neon-green mt-1">Utstyr på stedet: ${v.existingEquipment.map(eq => esc(eq)).join(', ')}</div>` : ''}
                `;
            }
        }
    }

    venueSelect.addEventListener('change', () => showVenueDetails(venueSelect.value));
    if (currentVenueId) showVenueDetails(currentVenueId);

    document.getElementById('btn-ev-add-eq').addEventListener('click', () => {
        const container = document.getElementById('ef-equipment');
        const div = document.createElement('div');
        div.className = 'flex gap-2 items-center ev-eq-row';
        div.innerHTML = `
            <input type="number" value="1" min="1" class="w-16 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ev-eq-qty">
            <input type="text" placeholder="Utstyrsnavn..." class="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ev-eq-name">
            <button type="button" onclick="this.closest('.ev-eq-row').remove()" class="text-neon-pink text-lg px-1 hover:text-neon-pink/70">&times;</button>
        `;
        container.appendChild(div);
        div.querySelector('.ev-eq-name').focus();
    });

    document.getElementById('btn-ev-add-con').addEventListener('click', () => {
        const container = document.getElementById('ef-consumables');
        const div = document.createElement('div');
        div.className = 'flex gap-2 items-center ev-con-row';
        div.innerHTML = `
            <input type="number" value="0" min="0" class="w-16 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ev-con-qty">
            <input type="text" placeholder="Forbruksmateriell..." class="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ev-con-name">
            <button type="button" onclick="this.closest('.ev-con-row').remove()" class="text-neon-pink text-lg px-1 hover:text-neon-pink/70">&times;</button>
        `;
        container.appendChild(div);
        div.querySelector('.ev-con-name').focus();
    });

    document.getElementById('event-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('ef-name').value.trim();
        const startDate = document.getElementById('ef-start').value;
        if (!name || !startDate) return;

        let venueId = venueSelect.value;
        if (venueId === '__new__') {
            const vName = document.getElementById('ef-vnew-name').value.trim();
            if (!vName) {
                toast('Fyll inn navn på venue', 'error');
                document.getElementById('ef-vnew-name').focus();
                return;
            }
            const newVenue = DB.addVenue({
                name: vName,
                address: document.getElementById('ef-vnew-address').value.trim(),
                description: document.getElementById('ef-vnew-description').value.trim(),
                contactInfo: document.getElementById('ef-vnew-contact').value.trim(),
            });
            venueId = newVenue.id;
            toast('Venueprofil opprettet: ' + vName, 'success');
        }

        const equipment = [];
        document.querySelectorAll('#ef-equipment .ev-eq-row').forEach(row => {
            const eqName = row.querySelector('.ev-eq-name').value.trim();
            const qty = parseInt(row.querySelector('.ev-eq-qty').value) || 1;
            if (eqName) equipment.push({ name: eqName, quantity: qty });
        });

        const consumables = [];
        document.querySelectorAll('#ef-consumables .ev-con-row').forEach(row => {
            const conName = row.querySelector('.ev-con-name').value.trim();
            const qty = parseInt(row.querySelector('.ev-con-qty').value) || 0;
            if (conName) consumables.push({ name: conName, quantity: qty });
        });

        const data = {
            name,
            venueId: venueId || null,
            location: document.getElementById('ef-location').value.trim(),
            startDate: new Date(startDate).toISOString(),
            endDate: document.getElementById('ef-end').value ? new Date(document.getElementById('ef-end').value).toISOString() : null,
            description: document.getElementById('ef-desc').value.trim(),
            notes: document.getElementById('ef-notes').value.trim(),
            equipment,
            consumables,
        };
        if (isEdit) {
            DB.updateEvent(event.id, data);
            toast('Arrangement oppdatert', 'success');
        } else {
            DB.addEvent(data);
            toast('Arrangement opprettet', 'success');
        }
        closeModal();
        if (isEdit && App.currentEventId === event.id) {
            renderEventDetail();
        } else {
            renderEvents();
        }
    });
}

function openEventDetail(eventId) {
    App.currentEventId = eventId;
    showView('event-detail');
}

function renderEventDetail() {
    const event = DB.getEvent(App.currentEventId);
    if (!event) return showView('events');
    const container = document.getElementById('event-detail-content');
    const checkIns = DB.getCheckIns(event.id);
    const activeCheckIns = DB.getActiveCheckIns(event.id);
    const issues = DB.getIssueReports(event.id);
    const openIssues = issues.filter(i => i.status !== 'resolved');
    const activeUser = DB.getActiveUser();
    const userActiveCheckIn = activeUser ? DB.getActiveCheckIn(activeUser.id) : null;
    const isCheckedInHere = userActiveCheckIn && userActiveCheckIn.eventId === event.id;

    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : null;
    const dateStr = start.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const endStr = end ? end.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';

    let actionBtn = '';
    if (!activeUser) {
        actionBtn = `<div class="bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl p-3 text-sm text-neon-yellow">Velg en bruker under "Crew" for å sjekke inn</div>`;
    } else if (isCheckedInHere) {
        actionBtn = `<button onclick="showCheckOutFlow('${userActiveCheckIn.id}')" class="w-full py-3 rounded-xl text-sm font-bold bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/30 transition-colors">Sjekk ut — ${esc(activeUser.name)}</button>`;
    } else if (userActiveCheckIn) {
        const otherEvent = DB.getEvent(userActiveCheckIn.eventId);
        actionBtn = `<div class="bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl p-3 text-sm text-neon-yellow">${esc(activeUser.name)} er allerede sjekket inn på "${esc(otherEvent?.name || '?')}"</div>`;
    } else {
        actionBtn = `<button onclick="showCheckInFlow('${event.id}')" class="w-full py-3 rounded-xl text-sm font-bold bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors">Sjekk inn — ${esc(activeUser.name)}</button>`;
    }

    const venue = event.venueId ? DB.getVenue(event.venueId) : null;

    container.innerHTML = `
        <div class="flex items-start justify-between">
            <div>
                <h2 class="text-xl font-bold">${esc(event.name)}</h2>
                ${venue ? `<p class="text-sm text-neon-blue mt-1">${esc(venue.name)}${venue.address ? ' — ' + esc(venue.address) : ''}</p>` : ''}
                ${event.location ? `<p class="text-sm text-gray-400 mt-0.5">${esc(event.location)}</p>` : ''}
            </div>
            <div class="flex gap-2">
                <button onclick="editEventFromDetail('${event.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Rediger</button>
                <button onclick="deleteEventPrompt('${event.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Slett</button>
            </div>
        </div>

        ${venue ? `<div class="bg-dark-800 rounded-lg border border-neon-blue/20 p-3 text-sm space-y-1">
            <div class="text-xs font-semibold text-neon-blue uppercase tracking-wider mb-1">Venue</div>
            <div class="font-semibold text-white">${esc(venue.name)}</div>
            ${venue.address ? `<div class="text-gray-400">${esc(venue.address)}</div>` : ''}
            ${venue.description ? `<div class="text-gray-400 text-xs">${esc(venue.description)}</div>` : ''}
            ${venue.contactInfo ? `<div class="text-gray-400 text-xs">${esc(venue.contactInfo)}</div>` : ''}
            ${(venue.existingEquipment || []).length > 0 ? `<div class="text-xs text-neon-green mt-1">Utstyr på stedet: ${venue.existingEquipment.map(eq => esc(eq)).join(', ')}</div>` : ''}
        </div>` : ''}

        <div class="text-sm text-gray-400">
            <div>${dateStr}</div>
            ${endStr ? `<div>til ${endStr}</div>` : ''}
        </div>
        ${event.description ? `<p class="text-sm text-gray-300 bg-dark-800 rounded-lg p-3 border border-dark-600">${esc(event.description)}</p>` : ''}
        ${event.notes ? `<div class="bg-dark-800 rounded-lg border border-neon-yellow/20 p-3 text-sm"><span class="text-xs font-semibold text-neon-yellow uppercase tracking-wider">Notat:</span> <span class="text-gray-300">${esc(event.notes)}</span></div>` : ''}

        ${(event.equipment || []).length > 0 ? (() => {
            const packedCount = event.equipment.filter(e => e.packed).length;
            const totalCount = event.equipment.length;
            return `
        <div class="bg-dark-800 rounded-xl border border-neon-green/20 p-3">
            <h3 class="text-sm font-semibold text-neon-green mb-2 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    Utstyr
                </span>
                <span class="text-xs ${packedCount === totalCount ? 'text-neon-green' : 'text-gray-400'} font-medium">${packedCount}/${totalCount} med</span>
            </h3>
            <div class="space-y-1.5">
                ${event.equipment.map((e, idx) => `
                    <div class="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-dark-600 transition-colors" onclick="toggleEventEq('${event.id}', ${idx})">
                        <div class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${e.packed ? 'border-neon-green bg-neon-green/20' : 'border-gray-500'}">
                            ${e.packed ? '<svg class="w-3 h-3 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                        </div>
                        <span class="text-sm flex-1 ${e.packed ? 'text-gray-300' : ''}">${esc(e.name)}</span>
                        <span class="text-xs text-neon-green font-medium">${e.quantity} stk</span>
                    </div>
                `).join('')}
            </div>
        </div>`;
        })() : ''}

        ${(event.consumables || []).length > 0 ? (() => {
            const checkedCount = event.consumables.filter(c => c.checked).length;
            const totalCon = event.consumables.length;
            return `
        <div class="bg-dark-800 rounded-xl border border-neon-pink/20 p-3">
            <h3 class="text-sm font-semibold text-neon-pink mb-2 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Forbruksmateriell
                </span>
                <span class="text-xs ${checkedCount === totalCon ? 'text-neon-pink' : 'text-gray-400'} font-medium">${checkedCount}/${totalCon} med</span>
            </h3>
            <div class="space-y-1.5">
                ${event.consumables.map((c, idx) => `
                    <div class="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-dark-600 transition-colors" onclick="toggleEventCon('${event.id}', ${idx})">
                        <div class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${c.checked ? 'border-neon-pink bg-neon-pink/20' : 'border-gray-500'}">
                            ${c.checked ? '<svg class="w-3 h-3 text-neon-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                        </div>
                        <span class="text-sm flex-1 ${c.checked ? 'text-gray-300' : ''}">${esc(c.name)}</span>
                        ${c.quantity > 0 ? `<span class="text-xs text-neon-pink font-medium">${c.quantity} stk</span>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>`;
        })() : ''}

        ${actionBtn}

        <div class="grid grid-cols-3 gap-3">
            <div class="bg-dark-800 rounded-xl p-3 border border-dark-600 text-center">
                <div class="text-xl font-bold text-neon-blue">${checkIns.length}</div>
                <div class="text-xs text-gray-400">Innsjekkinger</div>
            </div>
            <div class="bg-dark-800 rounded-xl p-3 border border-dark-600 text-center">
                <div class="text-xl font-bold text-neon-green">${activeCheckIns.length}</div>
                <div class="text-xs text-gray-400">Aktive nå</div>
            </div>
            <div class="bg-dark-800 rounded-xl p-3 border border-dark-600 text-center">
                <div class="text-xl font-bold text-neon-yellow">${openIssues.length}</div>
                <div class="text-xs text-gray-400">Åpne feil</div>
            </div>
        </div>

        ${activeUser ? `<button onclick="showIssueReportForm('${event.id}')" class="w-full py-2 rounded-xl text-sm font-semibold bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30 hover:bg-neon-yellow/25 transition-colors">Rapporter feil / reparasjon</button>` : ''}

        <button onclick="duplicateEvent('${event.id}')" class="w-full py-2 rounded-xl text-sm font-semibold bg-neon-blue/15 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/25 transition-colors">+ Legg til ekstra arrangement med samme utgangspunkt</button>

        <div>
            <h3 class="font-semibold mb-3 text-gray-300">Feilmeldinger</h3>
            ${issues.length === 0 ? '<p class="text-sm text-gray-500 italic">Ingen feilmeldinger</p>' :
            issues.map(issue => {
                const reporter = DB.getUser(issue.userId);
                const time = new Date(issue.createdAt).toLocaleString('nb-NO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                let typeBadge = '';
                if (issue.type === 'needs-repair') typeBadge = '<span class="status-badge bg-red-500/20 text-red-400">Må repareres</span>';
                else if (issue.type === 'repaired') typeBadge = '<span class="status-badge bg-neon-green/20 text-neon-green">Reparert</span>';
                else typeBadge = '<span class="status-badge bg-neon-blue/20 text-neon-blue">Annet</span>';
                let statusBadge = issue.status === 'resolved' ? '<span class="status-badge bg-gray-500/20 text-gray-400 ml-1">Løst</span>' : '';

                return `<div class="bg-dark-800 rounded-xl p-3 border border-dark-600 mb-2">
                    <div class="flex items-start justify-between mb-1">
                        <div class="flex items-center gap-2">${typeBadge}${statusBadge}</div>
                        <span class="text-xs text-gray-500">${time}</span>
                    </div>
                    <p class="text-sm font-semibold mt-1">${esc(issue.title)}</p>
                    ${issue.description ? `<p class="text-xs text-gray-400 mt-1">${esc(issue.description)}</p>` : ''}
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-xs text-gray-500">Meldt av ${esc(reporter?.name || 'Ukjent')}</span>
                        ${issue.status !== 'resolved' ? `<button onclick="resolveIssuePrompt('${issue.id}')" class="text-xs px-2 py-1 rounded bg-neon-green/20 text-neon-green hover:bg-neon-green/30 transition-colors">Merk som løst</button>` : ''}
                    </div>
                    <div id="issue-photos-${issue.id}" class="photo-grid mt-2"></div>
                </div>`;
            }).join('')}
        </div>

        <div>
            <h3 class="font-semibold mb-3 text-gray-300">Innsjekkinger</h3>
            ${checkIns.length === 0 ? '<p class="text-sm text-gray-500 italic">Ingen innsjekkinger ennå</p>' :
            [...checkIns].reverse().map(ci => {
                const user = DB.getUser(ci.userId);
                const vehicle = DB.getVehicle(ci.vehicleId);
                const time = new Date(ci.checkedInAt).toLocaleString('nb-NO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                const isActive = ci.status === 'active';
                const kmDiff = ci.kmEnd ? ci.kmEnd - ci.kmStart : null;
                return `<div class="bg-dark-800 rounded-xl p-3 border ${isActive ? 'border-neon-green/30' : 'border-dark-600'} mb-2 cursor-pointer hover:bg-dark-700 transition-colors" onclick="viewCheckInDetail('${ci.id}')">
                    <div class="flex items-center gap-3">
                        <div class="user-avatar text-sm" style="background:${user?.avatarColor || USER_COLORS[0]}">${(user?.name || '?').charAt(0).toUpperCase()}</div>
                        <div class="flex-1 min-w-0">
                            <div class="font-semibold text-sm truncate">${esc(user?.name || 'Ukjent')}</div>
                            <div class="text-xs text-gray-400">${esc(vehicle?.name || 'Ukjent bil')} — ${time}</div>
                        </div>
                        <div class="text-right">
                            ${isActive ? '<span class="status-badge bg-neon-green/20 text-neon-green">Aktiv</span>' : '<span class="status-badge bg-gray-500/20 text-gray-400">Ferdig</span>'}
                            ${ci.kmStart ? `<div class="text-xs text-gray-400 mt-1">KM: ${ci.kmStart}${kmDiff !== null ? ` (+${kmDiff})` : ''}</div>` : ''}
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>
    `;

    loadIssuePhotos(issues);
}

function editEventFromDetail(eventId) {
    const event = DB.getEvent(eventId);
    if (event) showEventForm(event);
}

function deleteEventPrompt(eventId) {
    const event = DB.getEvent(eventId);
    if (!event) return;
    openModal('Slett arrangement', `
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette <strong>${esc(event.name)}</strong>? Alle innsjekkinger og feilmeldinger knyttet til dette arrangementet vil bli slettet.</p>
        <div class="flex gap-2">
            <button onclick="DB.deleteEvent('${eventId}'); closeModal(); showView('events'); toast('Arrangement slettet');" class="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors font-semibold">Slett</button>
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Avbryt</button>
        </div>
    `);
}

function duplicateEvent(eventId) {
    const source = DB.getEvent(eventId);
    if (!source) return;
    const duplicate = {
        name: source.name,
        venueId: source.venueId || null,
        location: source.location || '',
        startDate: source.startDate,
        endDate: source.endDate || null,
        description: source.description || '',
        notes: source.notes || '',
        equipment: (source.equipment || []).map(e => ({ name: e.name, quantity: e.quantity, packed: false })),
        consumables: (source.consumables || []).map(c => ({ name: c.name, quantity: c.quantity, checked: false })),
    };
    showEventForm(duplicate);
}

function updateEventBadge() {
    const badge = document.getElementById('event-badge');
    if (!badge) return;
    const active = DB.getActiveEvents();
    if (active.length > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
}

// ========================
// Check-in / Check-out
// ========================

function showCheckInFlow(eventId) {
    const activeUser = DB.getActiveUser();
    if (!activeUser) { toast('Velg en bruker først', 'error'); return; }
    App.currentEventId = eventId;

    const event = DB.getEvent(eventId);
    const vehicles = DB.getVehicles();

    const container = document.getElementById('checkin-content');
    container.innerHTML = `
        <h2 class="text-xl font-bold">Sjekk inn</h2>
        <div class="bg-dark-800 rounded-xl p-3 border border-dark-600 flex items-center gap-3">
            <div class="user-avatar" style="background:${activeUser.avatarColor || USER_COLORS[0]}">${activeUser.name.charAt(0).toUpperCase()}</div>
            <div>
                <div class="font-semibold">${esc(activeUser.name)}</div>
                <div class="text-xs text-gray-400">${esc(event?.name || '')} — ${esc(event?.location || '')}</div>
            </div>
        </div>

        <div class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Velg bil *</label>
                <select id="ci-vehicle" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    <option value="">— Velg bil —</option>
                    ${vehicles.map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">KM-stand ved start *</label>
                <input type="number" id="ci-km-start" placeholder="f.eks. 123456" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>

            <div>
                <label class="block text-sm text-gray-400 mb-2">Bilder utvendig</label>
                <div class="photo-grid" id="ci-photos-exterior">
                    <label class="photo-capture-btn">
                        <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span class="text-xs">Ta bilde</span>
                        <input type="file" accept="image/*" capture="environment" class="hidden" onchange="handlePhotoUpload(event, 'ci-photos-exterior')">
                    </label>
                </div>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-2">Bilder innvendig</label>
                <div class="photo-grid" id="ci-photos-interior">
                    <label class="photo-capture-btn">
                        <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span class="text-xs">Ta bilde</span>
                        <input type="file" accept="image/*" capture="environment" class="hidden" onchange="handlePhotoUpload(event, 'ci-photos-interior')">
                    </label>
                </div>
            </div>

            <div>
                <label class="block text-sm text-gray-400 mb-1">Notater</label>
                <textarea id="ci-notes" rows="2" placeholder="Eventuelle merknader..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none"></textarea>
            </div>

            <button onclick="submitCheckIn('${eventId}')" class="w-full py-3 rounded-xl font-bold bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors">Bekreft innsjekking</button>
        </div>
    `;
    showView('checkin');
}

const _pendingPhotoIds = {};

async function handlePhotoUpload(event, gridId) {
    const file = event.target.files[0];
    if (!file) return;

    const grid = document.getElementById(gridId);
    const placeholder = grid.querySelector('.photo-capture-btn');

    const tempImg = document.createElement('div');
    tempImg.className = 'aspect-[4/3] bg-dark-700 rounded-lg flex items-center justify-center';
    tempImg.innerHTML = '<svg class="w-6 h-6 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>';
    grid.insertBefore(tempImg, placeholder);

    try {
        const photoId = await PhotoDB.saveFromFile(file);
        const dataUrl = await PhotoDB.get(photoId);

        if (!_pendingPhotoIds[gridId]) _pendingPhotoIds[gridId] = [];
        _pendingPhotoIds[gridId].push(photoId);

        const img = document.createElement('img');
        img.src = dataUrl;
        img.dataset.photoId = photoId;
        img.onclick = () => showPhotoLightbox(dataUrl);
        grid.replaceChild(img, tempImg);
    } catch (err) {
        grid.removeChild(tempImg);
        toast('Kunne ikke lagre bilde', 'error');
    }

    event.target.value = '';
}

function showPhotoLightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'photo-lightbox';
    lb.innerHTML = `<img src="${src}">`;
    lb.onclick = () => lb.remove();
    document.body.appendChild(lb);
}

async function submitCheckIn(eventId) {
    const activeUser = DB.getActiveUser();
    if (!activeUser) { toast('Velg en bruker først', 'error'); return; }

    const vehicleId = document.getElementById('ci-vehicle').value;
    if (!vehicleId) { toast('Velg en bil', 'error'); return; }

    const kmStart = parseInt(document.getElementById('ci-km-start').value);
    if (!kmStart && kmStart !== 0) { toast('Skriv inn KM-stand', 'error'); return; }

    const photoIdsExterior = _pendingPhotoIds['ci-photos-exterior'] || [];
    const photoIdsInterior = _pendingPhotoIds['ci-photos-interior'] || [];
    const notes = document.getElementById('ci-notes').value.trim();

    DB.addCheckIn({
        userId: activeUser.id,
        eventId,
        vehicleId,
        kmStart,
        photoIdsExterior,
        photoIdsInterior,
        notes,
    });

    _pendingPhotoIds['ci-photos-exterior'] = [];
    _pendingPhotoIds['ci-photos-interior'] = [];

    toast('Innsjekking registrert!', 'success');
    App.currentEventId = eventId;
    showView('event-detail');
}

function showCheckOutFlow(checkInId) {
    const checkIn = DB.getCheckIn(checkInId);
    if (!checkIn) return;
    const user = DB.getUser(checkIn.userId);
    const vehicle = DB.getVehicle(checkIn.vehicleId);
    const event = DB.getEvent(checkIn.eventId);

    const container = document.getElementById('checkin-content');
    container.innerHTML = `
        <h2 class="text-xl font-bold">Sjekk ut</h2>
        <div class="bg-dark-800 rounded-xl p-3 border border-dark-600">
            <div class="flex items-center gap-3 mb-2">
                <div class="user-avatar" style="background:${user?.avatarColor || USER_COLORS[0]}">${(user?.name || '?').charAt(0).toUpperCase()}</div>
                <div>
                    <div class="font-semibold">${esc(user?.name || 'Ukjent')}</div>
                    <div class="text-xs text-gray-400">${esc(event?.name || '')} — ${esc(vehicle?.name || '')}</div>
                </div>
            </div>
            <div class="text-sm text-gray-400">KM-stand ved start: <strong class="text-gray-200">${checkIn.kmStart}</strong></div>
        </div>

        <div class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">KM-stand ved parkering *</label>
                <input type="number" id="co-km-end" placeholder="f.eks. 123500" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>

            <div>
                <label class="block text-sm text-gray-400 mb-2">Bilder utvendig</label>
                <div class="photo-grid" id="co-photos-exterior">
                    <label class="photo-capture-btn">
                        <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span class="text-xs">Ta bilde</span>
                        <input type="file" accept="image/*" capture="environment" class="hidden" onchange="handlePhotoUpload(event, 'co-photos-exterior')">
                    </label>
                </div>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-2">Bilder innvendig</label>
                <div class="photo-grid" id="co-photos-interior">
                    <label class="photo-capture-btn">
                        <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span class="text-xs">Ta bilde</span>
                        <input type="file" accept="image/*" capture="environment" class="hidden" onchange="handlePhotoUpload(event, 'co-photos-interior')">
                    </label>
                </div>
            </div>

            <button onclick="submitCheckOut('${checkInId}')" class="w-full py-3 rounded-xl font-bold bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/30 transition-colors">Bekreft utsjekking</button>
        </div>
    `;
    showView('checkin');
}

function submitCheckOut(checkInId) {
    const kmEnd = parseInt(document.getElementById('co-km-end').value);
    if (!kmEnd && kmEnd !== 0) { toast('Skriv inn KM-stand', 'error'); return; }

    const photoIdsEnd = {
        exterior: _pendingPhotoIds['co-photos-exterior'] || [],
        interior: _pendingPhotoIds['co-photos-interior'] || [],
    };

    DB.completeCheckIn(checkInId, kmEnd, photoIdsEnd);

    _pendingPhotoIds['co-photos-exterior'] = [];
    _pendingPhotoIds['co-photos-interior'] = [];

    toast('Utsjekking registrert!', 'success');
    const checkIn = DB.getCheckIn(checkInId);
    if (checkIn) {
        App.currentEventId = checkIn.eventId;
        showView('event-detail');
    } else {
        showView('events');
    }
}

function viewCheckInDetail(checkInId) {
    const ci = DB.getCheckIn(checkInId);
    if (!ci) return;
    const user = DB.getUser(ci.userId);
    const vehicle = DB.getVehicle(ci.vehicleId);
    const event = DB.getEvent(ci.eventId);
    const kmDiff = ci.kmEnd ? ci.kmEnd - ci.kmStart : null;

    let photosHTML = '';
    const allPhotoGroups = [
        { label: 'Utvendig (start)', ids: ci.photoIdsExterior || [] },
        { label: 'Innvendig (start)', ids: ci.photoIdsInterior || [] },
        { label: 'Utvendig (slutt)', ids: ci.photoIdsEnd?.exterior || [] },
        { label: 'Innvendig (slutt)', ids: ci.photoIdsEnd?.interior || [] },
    ].filter(g => g.ids.length > 0);

    photosHTML = allPhotoGroups.map(g =>
        `<div><div class="text-xs text-gray-400 mb-1">${g.label}</div><div class="photo-grid" id="ci-detail-${g.label.replace(/\s/g, '-')}">${g.ids.map(id => `<img data-photo-id="${id}" class="bg-dark-700">`).join('')}</div></div>`
    ).join('');

    openModal('Innsjekking detaljer', `
        <div class="space-y-3">
            <div class="flex items-center gap-3">
                <div class="user-avatar" style="background:${user?.avatarColor || USER_COLORS[0]}">${(user?.name || '?').charAt(0).toUpperCase()}</div>
                <div>
                    <div class="font-semibold">${esc(user?.name || 'Ukjent')}</div>
                    <div class="text-xs text-gray-400">${esc(vehicle?.name || '')} — ${esc(event?.name || '')}</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="bg-dark-700 rounded-lg p-2">
                    <div class="text-xs text-gray-400">Sjekket inn</div>
                    <div>${new Date(ci.checkedInAt).toLocaleString('nb-NO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div class="bg-dark-700 rounded-lg p-2">
                    <div class="text-xs text-gray-400">Sjekket ut</div>
                    <div>${ci.checkedOutAt ? new Date(ci.checkedOutAt).toLocaleString('nb-NO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Aktiv'}</div>
                </div>
                <div class="bg-dark-700 rounded-lg p-2">
                    <div class="text-xs text-gray-400">KM start</div>
                    <div>${ci.kmStart || '—'}</div>
                </div>
                <div class="bg-dark-700 rounded-lg p-2">
                    <div class="text-xs text-gray-400">KM slutt</div>
                    <div>${ci.kmEnd || '—'} ${kmDiff !== null ? `<span class="text-neon-green">(+${kmDiff})</span>` : ''}</div>
                </div>
            </div>
            ${ci.notes ? `<div class="bg-dark-700 rounded-lg p-2 text-sm"><div class="text-xs text-gray-400 mb-1">Notater</div>${esc(ci.notes)}</div>` : ''}
            ${photosHTML}
        </div>
    `);

    allPhotoGroups.forEach(g => {
        g.ids.forEach(async (id) => {
            try {
                const dataUrl = await PhotoDB.get(id);
                const img = document.querySelector(`img[data-photo-id="${id}"]`);
                if (img && dataUrl) {
                    img.src = dataUrl;
                    img.onclick = () => showPhotoLightbox(dataUrl);
                }
            } catch {}
        });
    });
}

function renderCheckIn() {
    // placeholder — content set dynamically by showCheckInFlow/showCheckOutFlow
}

// ========================
// Issue Reports (Event-based)
// ========================

function showIssueReportForm(eventId) {
    const activeUser = DB.getActiveUser();
    if (!activeUser) { toast('Velg en bruker først', 'error'); return; }

    openModal('Rapporter feil / reparasjon', `
        <form id="issue-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Type *</label>
                <div class="grid grid-cols-2 gap-2">
                    <label class="flex items-center gap-2 p-3 rounded-lg bg-dark-700 border border-dark-600 cursor-pointer has-[:checked]:border-red-400 has-[:checked]:bg-red-500/10">
                        <input type="radio" name="issue-type" value="needs-repair" checked class="hidden">
                        <span class="text-sm">Må repareres</span>
                    </label>
                    <label class="flex items-center gap-2 p-3 rounded-lg bg-dark-700 border border-dark-600 cursor-pointer has-[:checked]:border-neon-green has-[:checked]:bg-neon-green/10">
                        <input type="radio" name="issue-type" value="repaired" class="hidden">
                        <span class="text-sm">Har reparert</span>
                    </label>
                </div>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Tittel *</label>
                <input type="text" id="if-title" required placeholder="Kort beskrivelse..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Beskrivelse</label>
                <textarea id="if-desc" rows="3" placeholder="Detaljer om feilen eller reparasjonen..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none"></textarea>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-2">Bilder</label>
                <div class="photo-grid" id="if-photos">
                    <label class="photo-capture-btn">
                        <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span class="text-xs">Ta bilde</span>
                        <input type="file" accept="image/*" capture="environment" class="hidden" onchange="handlePhotoUpload(event, 'if-photos')">
                    </label>
                </div>
            </div>
            <button type="submit" class="w-full btn-neon py-2 rounded-lg font-semibold">Send rapport</button>
        </form>
    `);

    const radioLabels = document.querySelectorAll('#issue-form label[class*="has-"]');
    radioLabels.forEach(label => {
        const radio = label.querySelector('input[type="radio"]');
        function updateStyles() {
            radioLabels.forEach(l => {
                const r = l.querySelector('input[type="radio"]');
                if (r.checked) {
                    l.classList.add(r.value === 'needs-repair' ? 'border-red-400' : 'border-neon-green');
                    l.classList.add(r.value === 'needs-repair' ? 'bg-red-500/10' : 'bg-neon-green/10');
                    l.classList.remove(r.value === 'needs-repair' ? 'border-neon-green' : 'border-red-400');
                    l.classList.remove(r.value === 'needs-repair' ? 'bg-neon-green/10' : 'bg-red-500/10');
                    l.classList.remove('border-dark-600');
                } else {
                    l.classList.remove('border-red-400', 'border-neon-green', 'bg-red-500/10', 'bg-neon-green/10');
                    l.classList.add('border-dark-600');
                }
            });
        }
        label.addEventListener('click', () => {
            radio.checked = true;
            updateStyles();
        });
        updateStyles();
    });

    document.getElementById('issue-form').addEventListener('submit', e => {
        e.preventDefault();
        const title = document.getElementById('if-title').value.trim();
        if (!title) return;
        const type = document.querySelector('input[name="issue-type"]:checked').value;
        const description = document.getElementById('if-desc').value.trim();
        const photoIds = _pendingPhotoIds['if-photos'] || [];

        DB.addIssueReport({
            userId: activeUser.id,
            eventId,
            title,
            description,
            type,
            photoIds,
        });

        _pendingPhotoIds['if-photos'] = [];
        closeModal();
        toast('Rapport sendt', 'success');
        renderEventDetail();
    });
}

function resolveIssuePrompt(issueId) {
    const activeUser = DB.getActiveUser();
    if (!activeUser) { toast('Velg en bruker først', 'error'); return; }
    DB.resolveIssueReport(issueId, activeUser.id);
    toast('Markert som løst', 'success');
    renderEventDetail();
}

async function loadIssuePhotos(issues) {
    for (const issue of issues) {
        if (!issue.photoIds || issue.photoIds.length === 0) continue;
        const container = document.getElementById(`issue-photos-${issue.id}`);
        if (!container) continue;
        for (const photoId of issue.photoIds) {
            try {
                const dataUrl = await PhotoDB.get(photoId);
                if (dataUrl) {
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.onclick = () => showPhotoLightbox(dataUrl);
                    container.appendChild(img);
                }
            } catch {}
        }
    }
}

// ========================
// Sales View (Kontrakter, Kunder, Venues)
// ========================

function renderSales() {
    switchSalesTab(App.salesTab || 'contracts');
}

function switchSalesTab(tabName) {
    App.salesTab = tabName;
    document.querySelectorAll('.sales-tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.sales-tab').forEach(t => t.classList.remove('active'));
    const content = document.getElementById(`sales-tab-${tabName}`);
    if (content) content.classList.remove('hidden');
    const tab = document.querySelector(`.sales-tab[data-sales-tab="${tabName}"]`);
    if (tab) tab.classList.add('active');

    if (tabName === 'inquiries') renderInquiries();
    if (tabName === 'offers') renderOffers();
    if (tabName === 'contracts') renderContracts();
    if (tabName === 'customers') renderCustomers();
    if (tabName === 'venues') renderVenuesTab();
}

// ========================
// Customers
// ========================

function renderCustomers() {
    const customers = DB.getCustomers();
    const container = document.getElementById('customers-list');

    if (customers.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p>Ingen kunder ennå</p><p class="text-xs mt-1">Trykk "+ Ny kunde" for å opprette</p>
        </div>`;
        return;
    }

    const sorted = [...customers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    container.innerHTML = sorted.map(c => {
        const displayName = c.type === 'private' ? esc(c.contactName) : esc(c.companyName);
        const subtitle = c.type === 'private' ? 'Privatperson' : (c.orgNumber ? `Org.nr: ${esc(c.orgNumber)}` : '');
        return `<div class="bg-dark-800 rounded-xl p-4 border border-dark-600 cursor-pointer hover:bg-dark-700 transition-colors" onclick="openCustomerDetail('${c.id}')">
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="font-bold text-base">${displayName}</h3>
                    <p class="text-sm text-gray-400">${subtitle}</p>
                </div>
                <span class="status-badge ${c.type === 'private' ? 'bg-neon-purple/20 text-neon-purple' : 'bg-neon-blue/20 text-neon-blue'}">${c.type === 'private' ? 'Privat' : 'Firma'}</span>
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-400 mt-2">
                <span>${esc(c.contactName)}</span>
                ${c.contactPhone ? `<span>${esc(c.contactPhone)}</span>` : ''}
                ${c.contactEmail ? `<span>${esc(c.contactEmail)}</span>` : ''}
            </div>
        </div>`;
    }).join('');
}

function openCustomerDetail(customerId) {
    App.currentCustomerId = customerId;
    showView('customer-detail');
}

function renderCustomerDetail() {
    const customer = DB.getCustomer(App.currentCustomerId);
    if (!customer) return showView('sales');
    const container = document.getElementById('customer-detail-content');

    const isCompany = customer.type !== 'private';
    const displayName = isCompany ? customer.companyName : customer.contactName;

    container.innerHTML = `
        <div class="flex items-start justify-between">
            <div>
                <h2 class="text-xl font-bold">${esc(displayName)}</h2>
                <span class="status-badge ${isCompany ? 'bg-neon-blue/20 text-neon-blue' : 'bg-neon-purple/20 text-neon-purple'} mt-1 inline-block">${isCompany ? 'Firma' : 'Privatperson'}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="showCustomerForm(DB.getCustomer('${customer.id}'))" class="text-xs px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Rediger</button>
                <button onclick="deleteCustomerPrompt('${customer.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Slett</button>
            </div>
        </div>

        ${isCompany ? `
        <div class="bg-dark-800 rounded-xl border border-neon-blue/20 p-4 space-y-2">
            <h3 class="text-sm font-semibold text-neon-blue flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                Firmainformasjon
            </h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div><span class="text-gray-400">Firmanavn:</span><div class="font-medium">${esc(customer.companyName)}</div></div>
                <div><span class="text-gray-400">Org.nr:</span><div class="font-medium">${esc(customer.orgNumber || '—')}</div></div>
                <div class="col-span-2"><span class="text-gray-400">Adresse:</span><div class="font-medium">${esc(customer.address || '—')}</div></div>
                ${customer.orgForm ? `<div><span class="text-gray-400">Organisasjonsform:</span><div class="font-medium">${esc(customer.orgForm)}</div></div>` : ''}
            </div>
        </div>` : ''}

        <div class="bg-dark-800 rounded-xl border border-neon-green/20 p-4 space-y-2">
            <h3 class="text-sm font-semibold text-neon-green flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Kontaktperson
            </h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div><span class="text-gray-400">Navn:</span><div class="font-medium">${esc(customer.contactName)}</div></div>
                <div><span class="text-gray-400">Telefon:</span><div class="font-medium">${customer.contactPhone ? `<a href="tel:${esc(customer.contactPhone)}" class="text-neon-blue hover:underline">${esc(customer.contactPhone)}</a>` : '—'}</div></div>
                <div class="col-span-2"><span class="text-gray-400">E-post:</span><div class="font-medium">${customer.contactEmail ? `<a href="mailto:${esc(customer.contactEmail)}" class="text-neon-blue hover:underline">${esc(customer.contactEmail)}</a>` : '—'}</div></div>
            </div>
        </div>

        ${customer.notes ? `
        <div class="bg-dark-800 rounded-xl border border-dark-600 p-4">
            <h3 class="text-sm font-semibold text-gray-300 mb-2">Notater</h3>
            <p class="text-sm text-gray-400">${esc(customer.notes)}</p>
        </div>` : ''}
    `;
}

let _brregSearchTimeout = null;

function showCustomerForm(customer = null) {
    const isEdit = customer && customer.id;
    const isPrivate = customer?.type === 'private';

    openModal(isEdit ? 'Rediger kunde' : 'Ny kunde', `
        <form id="customer-form" class="space-y-4">
            <div class="flex items-center gap-3 mb-2">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="cf-private" ${isPrivate ? 'checked' : ''} class="w-4 h-4 rounded border-dark-600 bg-dark-700 text-neon-purple focus:ring-neon-purple">
                    <span class="text-sm text-gray-300">Registrer som privatperson</span>
                </label>
            </div>

            <div id="cf-company-section" class="${isPrivate ? 'hidden' : ''} space-y-3">
                <div class="relative">
                    <label class="block text-sm text-gray-400 mb-1">Søk firma (Brønnøysundregistrene)</label>
                    <input type="text" id="cf-brreg-search" placeholder="Søk etter firmanavn eller org.nr..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    <div id="cf-brreg-results" class="absolute z-50 left-0 right-0 top-full mt-1 bg-dark-700 border border-dark-600 rounded-lg max-h-48 overflow-y-auto hidden"></div>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Firmanavn</label>
                    <input type="text" id="cf-company-name" value="${esc(customer?.companyName || '')}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Org.nr</label>
                        <input type="text" id="cf-org-number" value="${esc(customer?.orgNumber || '')}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Org.form</label>
                        <input type="text" id="cf-org-form" value="${esc(customer?.orgForm || '')}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" readonly>
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Adresse</label>
                    <input type="text" id="cf-address" value="${esc(customer?.address || '')}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
            </div>

            <div class="border-t border-dark-600 pt-3">
                <h4 class="text-sm font-semibold text-neon-green mb-3">Kontaktperson</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Navn *</label>
                        <input type="text" id="cf-contact-name" value="${esc(customer?.contactName || '')}" required class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Telefon</label>
                            <input type="tel" id="cf-contact-phone" value="${esc(customer?.contactPhone || '')}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">E-post</label>
                            <input type="email" id="cf-contact-email" value="${esc(customer?.contactEmail || '')}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm text-gray-400 mb-1">Notater</label>
                <textarea id="cf-notes" rows="2" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">${esc(customer?.notes || '')}</textarea>
            </div>

            <button type="submit" class="w-full btn-neon py-2 rounded-lg font-semibold">${isEdit ? 'Lagre' : 'Opprett kunde'}</button>
        </form>
    `);

    const privateCheck = document.getElementById('cf-private');
    const companySection = document.getElementById('cf-company-section');
    privateCheck.addEventListener('change', () => {
        companySection.classList.toggle('hidden', privateCheck.checked);
    });

    const brregInput = document.getElementById('cf-brreg-search');
    const brregResults = document.getElementById('cf-brreg-results');
    brregInput.addEventListener('input', () => {
        clearTimeout(_brregSearchTimeout);
        const q = brregInput.value.trim();
        if (q.length < 2) { brregResults.classList.add('hidden'); return; }
        _brregSearchTimeout = setTimeout(() => searchBrreg(q), 300);
    });

    document.getElementById('customer-form').addEventListener('submit', e => {
        e.preventDefault();
        const isPrivateType = privateCheck.checked;
        const contactName = document.getElementById('cf-contact-name').value.trim();
        if (!contactName) return toast('Fyll inn kontaktperson', 'error');

        const data = {
            type: isPrivateType ? 'private' : 'company',
            companyName: isPrivateType ? '' : document.getElementById('cf-company-name').value.trim(),
            orgNumber: isPrivateType ? '' : document.getElementById('cf-org-number').value.trim(),
            orgForm: isPrivateType ? '' : document.getElementById('cf-org-form').value.trim(),
            address: isPrivateType ? '' : document.getElementById('cf-address').value.trim(),
            contactName,
            contactPhone: document.getElementById('cf-contact-phone').value.trim(),
            contactEmail: document.getElementById('cf-contact-email').value.trim(),
            notes: document.getElementById('cf-notes').value.trim(),
        };

        if (!isPrivateType && !data.companyName) return toast('Fyll inn firmanavn', 'error');

        if (isEdit) {
            DB.updateCustomer(customer.id, data);
            toast('Kunde oppdatert', 'success');
        } else {
            DB.addCustomer(data);
            toast('Kunde opprettet', 'success');
        }
        closeModal();
        if (isEdit && App.currentCustomerId === customer.id) {
            renderCustomerDetail();
        } else {
            App.salesTab = 'customers';
            renderSales();
        }
    });
}

async function searchBrreg(query) {
    const resultsDiv = document.getElementById('cf-brreg-results');
    if (!resultsDiv) return;

    resultsDiv.innerHTML = '<div class="p-3 text-sm text-gray-400">Søker...</div>';
    resultsDiv.classList.remove('hidden');

    try {
        const url = `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(query)}&size=8`;
        const res = await fetch(url);
        const data = await res.json();
        const enheter = data?._embedded?.enheter || [];

        if (enheter.length === 0) {
            resultsDiv.innerHTML = '<div class="p-3 text-sm text-gray-400">Ingen treff</div>';
            return;
        }

        resultsDiv.innerHTML = enheter.map(e => {
            const addr = e.forretningsadresse || e.postadresse || {};
            const addrStr = [addr.adresse?.[0], addr.postnummer, addr.poststed].filter(Boolean).join(', ');
            return `<div class="px-3 py-2 hover:bg-dark-600 cursor-pointer border-b border-dark-600 last:border-0 transition-colors" onclick="selectBrregResult(this)" data-org="${esc(e.organisasjonsnummer)}" data-name="${esc(e.navn)}" data-addr="${esc(addrStr)}" data-form="${esc(e.organisasjonsform?.beskrivelse || '')}">
                <div class="text-sm font-medium">${esc(e.navn)}</div>
                <div class="text-xs text-gray-400">${esc(e.organisasjonsnummer)} — ${esc(e.organisasjonsform?.beskrivelse || '')} ${addrStr ? '— ' + esc(addrStr) : ''}</div>
            </div>`;
        }).join('');
    } catch (err) {
        resultsDiv.innerHTML = '<div class="p-3 text-sm text-red-400">Feil ved søk</div>';
    }
}

function selectBrregResult(el) {
    document.getElementById('cf-company-name').value = el.dataset.name || '';
    document.getElementById('cf-org-number').value = el.dataset.org || '';
    document.getElementById('cf-org-form').value = el.dataset.form || '';
    document.getElementById('cf-address').value = el.dataset.addr || '';
    document.getElementById('cf-brreg-results').classList.add('hidden');
    document.getElementById('cf-brreg-search').value = '';
}

function deleteCustomerPrompt(customerId) {
    const customer = DB.getCustomer(customerId);
    if (!customer) return;
    const name = customer.companyName || customer.contactName;
    openModal('Slett kunde', `
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette <strong>${esc(name)}</strong>?</p>
        <div class="flex gap-2">
            <button onclick="DB.deleteCustomer('${customerId}'); closeModal(); App.salesTab='customers'; showView('sales'); toast('Kunde slettet');" class="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors font-semibold">Slett</button>
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Avbryt</button>
        </div>
    `);
}

// ========================
// Inquiries (Forespørsler)
// ========================

function renderInquiries() {
    const inquiries = DB.getInquiries();
    const container = document.getElementById('inquiries-list');
    updateInquiryBadge();

    const regUrl = getRegisterUrl();
    const regLinkCard = `
        <div class="bg-dark-800 rounded-xl border border-neon-blue/30 p-4 space-y-3">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-neon-blue shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                <h3 class="text-sm font-semibold text-neon-blue">Registreringslink for kunder</h3>
            </div>
            <div class="flex items-center gap-2">
                <input type="text" readonly value="${esc(regUrl)}" class="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none cursor-text" onclick="this.select()">
                <button onclick="copyRegisterLink()" class="shrink-0 px-3 py-2 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors text-xs font-medium" title="Kopier link">Kopier</button>
            </div>
            <div class="flex gap-2">
                <a href="${esc(regUrl)}" target="_blank" class="flex-1 text-center text-xs py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 transition-colors border border-dark-600">Åpne skjema</a>
                <button onclick="showSendRegLinkModal()" class="flex-1 text-xs py-2 rounded-lg bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors font-medium">Send til kunde via e-post</button>
            </div>
        </div>`;

    if (inquiries.length === 0) {
        container.innerHTML = regLinkCard + `<div class="text-center py-8 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
            <p>Ingen forespørsler ennå</p><p class="text-xs mt-1">Del registreringsskjemaet for å motta forespørsler</p>
        </div>`;
        return;
    }

    const sorted = [...inquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    container.innerHTML = regLinkCard + `
        <div class="flex items-center justify-between mb-2 mt-2">
            <span class="text-sm text-gray-400">${inquiries.length} forespørsel${inquiries.length !== 1 ? 'er' : ''}</span>
        </div>
    ` + sorted.map(inq => {
        const name = inq.companyName || inq.privateName || inq.contactName || 'Ukjent';
        const dateStr = inq.dateFlexible ? 'Dato ikke bestemt' : (inq.desiredDate || 'Ukjent dato');
        const extraCount = (inq.events || []).length;
        let statusBadge = '';
        if (inq.status === 'new') statusBadge = '<span class="status-badge bg-neon-green/20 text-neon-green">Ny</span>';
        else if (inq.status === 'offered') statusBadge = '<span class="status-badge bg-neon-blue/20 text-neon-blue">Tilbud sendt</span>';
        else if (inq.status === 'accepted') statusBadge = '<span class="status-badge bg-neon-purple/20 text-neon-purple">Akseptert</span>';
        else if (inq.status === 'declined') statusBadge = '<span class="status-badge bg-red-500/20 text-red-400">Avslått</span>';

        return `<div class="bg-dark-800 rounded-xl p-4 border ${inq.status === 'new' ? 'border-neon-green/30' : 'border-dark-600'} cursor-pointer hover:bg-dark-700 transition-colors" onclick="openInquiryDetail('${inq.id}')">
            <div class="flex items-start justify-between mb-1">
                <h3 class="font-bold text-base">${esc(name)}</h3>
                ${statusBadge}
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-400">
                <span>${dateStr}</span>
                <span>${esc(inq.contactName)}</span>
                ${extraCount > 0 ? `<span class="text-neon-purple">+${extraCount} ekstra</span>` : ''}
            </div>
        </div>`;
    }).join('');
}

function updateInquiryBadge() {
    const badge = document.getElementById('inquiry-badge');
    if (!badge) return;
    const count = DB.getNewInquiriesCount();
    badge.classList.toggle('hidden', count === 0);
}

function getRegisterUrl() {
    return window.location.href.replace(/index\.html.*$/, '').replace(/\?.*$/, '') + 'register.html';
}

function copyRegisterLink() {
    navigator.clipboard.writeText(getRegisterUrl()).then(() => toast('Link kopiert!', 'success')).catch(() => toast('Kunne ikke kopiere', 'error'));
}

function showSendRegLinkModal(prefillEmail) {
    openModal('Send registreringslink', `
        <form id="send-reg-link-form" class="space-y-4">
            <p class="text-sm text-gray-400">Send registreringslinken til kundens e-postadresse. Kunden kan fylle ut forespørselen direkte.</p>
            <div>
                <label class="block text-sm text-gray-400 mb-1">E-post til kunden *</label>
                <input type="email" id="srl-email" required value="${esc(prefillEmail || '')}" placeholder="kunde@firma.no" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div class="bg-dark-700 rounded-lg p-3">
                <label class="block text-xs text-gray-400 mb-1">Registreringslink</label>
                <div class="text-xs text-gray-300 break-all">${esc(getRegisterUrl())}</div>
            </div>
            <div class="flex gap-2">
                <button type="submit" class="flex-1 py-2.5 rounded-lg bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors font-semibold text-sm">Send e-post</button>
                <button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm">Avbryt</button>
            </div>
        </form>
    `);

    document.getElementById('send-reg-link-form').onsubmit = (e) => {
        e.preventDefault();
        const email = document.getElementById('srl-email').value.trim();
        if (!email) return;
        const regUrl = getRegisterUrl();
        const subject = encodeURIComponent('Neonparty — Registreringsskjema');
        const body = encodeURIComponent(
            `Hei,\n\n` +
            `Her er en link til registreringsskjemaet for Neonparty:\n\n` +
            `${regUrl}\n\n` +
            `Fyll ut skjemaet med informasjon om arrangementet, så tar vi kontakt med et tilbud.\n\n` +
            `Mvh,\nNeonparty`
        );
        window.open(`mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`, '_blank');
        closeModal();
        toast('E-postklient åpnet', 'success');
    };
}

function openInquiryDetail(inquiryId) {
    App.currentInquiryId = inquiryId;
    showView('inquiry-detail');
}

function renderInquiryDetail() {
    const inq = DB.getInquiry(App.currentInquiryId);
    if (!inq) return showView('sales');
    const container = document.getElementById('inquiry-detail-content');
    const name = inq.companyName || inq.privateName || inq.contactName || 'Ukjent';

    let statusBadge = '';
    if (inq.status === 'new') statusBadge = '<span class="status-badge bg-neon-green/20 text-neon-green">Ny</span>';
    else if (inq.status === 'offered') statusBadge = '<span class="status-badge bg-neon-blue/20 text-neon-blue">Tilbud sendt</span>';
    else if (inq.status === 'accepted') statusBadge = '<span class="status-badge bg-neon-purple/20 text-neon-purple">Akseptert</span>';
    else if (inq.status === 'declined') statusBadge = '<span class="status-badge bg-red-500/20 text-red-400">Avslått</span>';

    container.innerHTML = `
        <div class="flex items-start justify-between">
            <div>
                <h2 class="text-xl font-bold">${esc(name)}</h2>
                ${statusBadge}
            </div>
            <div class="flex gap-2">
                <button onclick="deleteInquiryPrompt('${inq.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Slett</button>
            </div>
        </div>

        ${inq.type !== 'private' && inq.companyName ? `
        <div class="bg-dark-800 rounded-xl border border-neon-blue/20 p-4">
            <h3 class="text-sm font-semibold text-neon-blue mb-2">Firma</h3>
            <div class="text-sm space-y-1">
                <div class="flex justify-between"><span class="text-gray-400">Firmanavn</span><span>${esc(inq.companyName)}</span></div>
                ${inq.orgNumber ? `<div class="flex justify-between"><span class="text-gray-400">Org.nr</span><span>${esc(inq.orgNumber)}</span></div>` : ''}
                ${inq.address ? `<div class="flex justify-between"><span class="text-gray-400">Adresse</span><span>${esc(inq.address)}</span></div>` : ''}
            </div>
        </div>` : ''}

        <div class="bg-dark-800 rounded-xl border border-neon-green/20 p-4">
            <h3 class="text-sm font-semibold text-neon-green mb-2">Kontaktperson</h3>
            <div class="text-sm space-y-1">
                <div class="flex justify-between"><span class="text-gray-400">Navn</span><span>${esc(inq.contactName)}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">Telefon</span><span><a href="tel:${esc(inq.contactPhone)}" class="text-neon-blue">${esc(inq.contactPhone)}</a></span></div>
                <div class="flex justify-between items-center"><span class="text-gray-400">E-post</span><span class="flex items-center gap-1.5"><a href="mailto:${esc(inq.contactEmail)}" class="text-neon-blue">${esc(inq.contactEmail)}</a><button onclick="editInquiryEmail('${inq.id}', '${esc(inq.contactEmail)}')" class="text-gray-500 hover:text-neon-blue transition-colors" title="Endre e-post"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button></span></div>
            </div>
        </div>

        <div class="bg-dark-800 rounded-xl border border-neon-blue/20 p-4 space-y-3">
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-neon-blue shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                <h3 class="text-sm font-semibold text-neon-blue">Registreringslink</h3>
            </div>
            <div class="flex gap-2">
                <button onclick="copyRegisterLink()" class="flex-1 text-xs py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 transition-colors border border-dark-600">Kopier link</button>
                <button onclick="showSendRegLinkModal('${esc(inq.contactEmail)}')" class="flex-1 text-xs py-2 rounded-lg bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors font-medium">Send til kunde</button>
            </div>
        </div>

        <div class="bg-dark-800 rounded-xl border border-neon-pink/20 p-4">
            <h3 class="text-sm font-semibold text-neon-pink mb-2">Arrangement</h3>
            <div class="text-sm space-y-1">
                <div class="flex justify-between"><span class="text-gray-400">Dato</span><span>${inq.dateFlexible ? 'Ikke bestemt' : (esc(inq.desiredDate) + (inq.desiredTime ? ' kl. ' + esc(inq.desiredTime) : '') + (inq.desiredEndTime ? ' – ' + esc(inq.desiredEndTime) : ''))}</span></div>
                ${inq.venueAddress ? `<div class="flex justify-between"><span class="text-gray-400">Adresse lokale</span><span class="text-right max-w-[60%]">${esc(inq.venueAddress)}</span></div>` : ''}
                ${inq.venueSize ? `<div class="flex justify-between"><span class="text-gray-400">Størrelse lokale</span><span>ca. ${esc(inq.venueSize)} m²</span></div>` : ''}
                ${inq.guests ? `<div class="flex justify-between"><span class="text-gray-400">Antall gjester</span><span>${esc(inq.guests)}</span></div>` : ''}
                ${inq.venueInfo ? `<div class="flex justify-between"><span class="text-gray-400">Om lokalet</span><span class="text-right max-w-[60%]">${esc(inq.venueInfo)}</span></div>` : ''}
                ${inq.audience ? `<div class="flex justify-between"><span class="text-gray-400">Målgruppe</span><span class="text-right max-w-[60%]">${esc(inq.audience)}</span></div>` : ''}
                ${inq.wishes ? `<div class="flex justify-between"><span class="text-gray-400">Ønsker</span><span class="text-right max-w-[60%]">${esc(inq.wishes)}</span></div>` : ''}
            </div>
        </div>

        ${(inq.events || []).length > 0 ? `
        <div class="bg-dark-800 rounded-xl border border-neon-purple/20 p-4">
            <h3 class="text-sm font-semibold text-neon-purple mb-2">Ekstra arrangementer (${inq.events.length})</h3>
            <div class="space-y-2">
                ${inq.events.map((ev, i) => `
                    <div class="bg-dark-700 rounded-lg p-3">
                        <div class="text-xs text-gray-400 mb-1">#${i + 1}</div>
                        <div class="text-sm">${ev.date ? esc(ev.date) + (ev.time ? ' kl. ' + esc(ev.time) : '') + (ev.endTime ? ' – ' + esc(ev.endTime) : '') : 'Dato ikke satt'}</div>
                        ${ev.description ? `<div class="text-sm text-gray-400 mt-1">${esc(ev.description)}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        ${inq.status !== 'accepted' ? `
        <button onclick="createOfferFromInquiry('${inq.id}')" class="w-full py-3 rounded-xl text-sm font-bold bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors">Lag tilbud</button>` : ''}
    `;
}

function editInquiryEmail(inquiryId, currentEmail) {
    openModal('Endre e-post', `
        <form id="edit-email-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Ny e-postadresse</label>
                <input type="email" id="eef-email" required value="${esc(currentEmail)}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div class="flex gap-2">
                <button type="submit" class="flex-1 py-2.5 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors font-semibold text-sm">Lagre</button>
                <button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm">Avbryt</button>
            </div>
        </form>
    `);
    document.getElementById('eef-email').select();
    document.getElementById('edit-email-form').onsubmit = (e) => {
        e.preventDefault();
        const newEmail = document.getElementById('eef-email').value.trim();
        if (!newEmail) return;
        DB.updateInquiry(inquiryId, { contactEmail: newEmail });
        closeModal();
        renderInquiryDetail();
        toast('E-post oppdatert', 'success');
    };
}

function deleteInquiryPrompt(inquiryId) {
    openModal('Slett forespørsel', `
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette denne forespørselen?</p>
        <div class="flex gap-2">
            <button onclick="DB.deleteInquiry('${inquiryId}'); closeModal(); App.salesTab='inquiries'; showView('sales'); toast('Forespørsel slettet');" class="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors font-semibold">Slett</button>
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Avbryt</button>
        </div>
    `);
}

function createOfferFromInquiry(inquiryId) {
    const inq = DB.getInquiry(inquiryId);
    if (!inq) return;

    const events = [];
    if (inq.desiredDate || !inq.dateFlexible) {
        events.push({
            date: inq.desiredDate || '',
            time: inq.desiredTime || '',
            endTime: inq.desiredEndTime || '',
            description: 'Hovedarrangement',
            services: [],
            consumables: [],
            equipmentRental: [],
            eventPrice: '',
        });
    }
    (inq.events || []).forEach(ev => {
        events.push({
            date: ev.date || '',
            time: ev.time || '',
            endTime: ev.endTime || '',
            description: ev.description || 'Ekstra arrangement',
            services: [],
            consumables: [],
            equipmentRental: [],
            eventPrice: '',
        });
    });

    if (events.length === 0) {
        events.push({ date: '', time: '', endTime: '', description: 'Arrangement', services: [], consumables: [], equipmentRental: [], eventPrice: '' });
    }

    const offer = DB.addOffer({
        inquiryId,
        customerId: null,
        events,
        totalPrice: '',
        priceMode: events.length > 1 ? 'per-event' : 'total',
        validUntil: '',
        notes: '',
    });

    DB.updateInquiry(inquiryId, { status: 'offered' });
    App.currentOfferId = offer.id;
    showView('offer-editor');
}

// ========================
// Offers (Tilbud)
// ========================

function renderOffers() {
    const offers = DB.getOffers();
    const container = document.getElementById('offers-list');

    if (offers.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p>Ingen tilbud ennå</p><p class="text-xs mt-1">Lag tilbud fra en forespørsel</p>
        </div>`;
        return;
    }

    const sorted = [...offers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    container.innerHTML = sorted.map(o => {
        const inq = o.inquiryId ? DB.getInquiry(o.inquiryId) : null;
        const name = inq ? (inq.companyName || inq.privateName || inq.contactName) : 'Ukjent';
        const evCount = (o.events || []).length;
        const awaitingInfo = inq?.source === 'admin-direct' && !inq.contactName;
        let statusBadge = '';
        if (o.status === 'draft') statusBadge = '<span class="status-badge bg-gray-500/20 text-gray-400">Utkast</span>';
        else if (o.status === 'sent') statusBadge = '<span class="status-badge bg-neon-blue/20 text-neon-blue">Sendt</span>';
        else if (o.status === 'accepted') statusBadge = '<span class="status-badge bg-neon-green/20 text-neon-green">Akseptert</span>';
        else if (o.status === 'declined') statusBadge = '<span class="status-badge bg-red-500/20 text-red-400">Avslått</span>';

        const priceStr = o.totalPrice ? `kr ${o.totalPrice}` : (o.priceMode === 'per-event' ? 'Per arrangement' : 'Pris ikke satt');

        return `<div class="bg-dark-800 rounded-xl p-4 border ${awaitingInfo ? 'border-neon-yellow/30' : 'border-dark-600'} cursor-pointer hover:bg-dark-700 transition-colors" onclick="App.currentOfferId='${o.id}'; showView('offer-editor');">
            <div class="flex items-start justify-between mb-1">
                <h3 class="font-bold text-base">${esc(name)}</h3>
                ${statusBadge}
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-400">
                <span>${evCount} arrangement${evCount !== 1 ? 'er' : ''}</span>
                <span class="text-neon-yellow">${priceStr}</span>
                ${awaitingInfo ? '<span class="text-neon-yellow">Venter på kundeinfo</span>' : ''}
            </div>
        </div>`;
    }).join('');
}

let _newOfferBrregTimeout = null;

function showNewOfferForm() {
    openModal('Nytt tilbud', `
        <form id="new-offer-form" class="space-y-4">
            <div class="relative">
                <label class="block text-sm text-gray-400 mb-1">Søk firma (Brønnøysundregistrene)</label>
                <input type="text" id="nof-brreg-search" placeholder="Søk etter firmanavn eller org.nr..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                <div id="nof-brreg-results" class="absolute z-50 left-0 right-0 top-full mt-1 bg-dark-700 border border-dark-600 rounded-lg max-h-48 overflow-y-auto hidden"></div>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Firmanavn *</label>
                <input type="text" id="nof-company-name" required class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Org.nr</label>
                    <input type="text" id="nof-org-number" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Org.form</label>
                    <input type="text" id="nof-org-form" readonly class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Adresse</label>
                <input type="text" id="nof-address" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div class="border-t border-dark-600 pt-3">
                <label class="block text-sm text-gray-400 mb-1">E-post til kunde *</label>
                <input type="email" id="nof-email" required placeholder="kunde@firma.no" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <p class="text-xs text-gray-500">Kunden får en e-post med link til registreringsskjemaet der de fyller inn resten av informasjonen (kontaktperson, dato, ønsker osv.)</p>
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Opprett tilbud og send e-post</button>
        </form>
    `);

    const brregInput = document.getElementById('nof-brreg-search');
    const brregResults = document.getElementById('nof-brreg-results');
    brregInput.addEventListener('input', () => {
        clearTimeout(_newOfferBrregTimeout);
        const q = brregInput.value.trim();
        if (q.length < 2) { brregResults.classList.add('hidden'); return; }
        _newOfferBrregTimeout = setTimeout(() => searchBrregForNewOffer(q), 300);
    });

    document.getElementById('new-offer-form').addEventListener('submit', e => {
        e.preventDefault();
        createDirectOffer();
    });
}

async function searchBrregForNewOffer(query) {
    const resultsDiv = document.getElementById('nof-brreg-results');
    if (!resultsDiv) return;

    resultsDiv.innerHTML = '<div class="p-3 text-sm text-gray-400">Søker...</div>';
    resultsDiv.classList.remove('hidden');

    try {
        const url = `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(query)}&size=8`;
        const res = await fetch(url);
        const data = await res.json();
        const enheter = data?._embedded?.enheter || [];

        if (enheter.length === 0) {
            resultsDiv.innerHTML = '<div class="p-3 text-sm text-gray-400">Ingen treff</div>';
            return;
        }

        resultsDiv.innerHTML = enheter.map(e => {
            const addr = e.forretningsadresse || e.postadresse || {};
            const addrStr = [addr.adresse?.[0], addr.postnummer, addr.poststed].filter(Boolean).join(', ');
            return `<div class="px-3 py-2 hover:bg-dark-600 cursor-pointer border-b border-dark-600 last:border-0 transition-colors" onclick="selectNewOfferBrreg(this)" data-org="${esc(e.organisasjonsnummer)}" data-name="${esc(e.navn)}" data-addr="${esc(addrStr)}" data-form="${esc(e.organisasjonsform?.beskrivelse || '')}">
                <div class="text-sm font-medium">${esc(e.navn)}</div>
                <div class="text-xs text-gray-400">${esc(e.organisasjonsnummer)} — ${esc(e.organisasjonsform?.beskrivelse || '')} ${addrStr ? '— ' + esc(addrStr) : ''}</div>
            </div>`;
        }).join('');
    } catch (err) {
        resultsDiv.innerHTML = '<div class="p-3 text-sm text-red-400">Feil ved søk</div>';
    }
}

function selectNewOfferBrreg(el) {
    document.getElementById('nof-company-name').value = el.dataset.name || '';
    document.getElementById('nof-org-number').value = el.dataset.org || '';
    document.getElementById('nof-org-form').value = el.dataset.form || '';
    document.getElementById('nof-address').value = el.dataset.addr || '';
    document.getElementById('nof-brreg-results').classList.add('hidden');
    document.getElementById('nof-brreg-search').value = '';
}

function createDirectOffer() {
    const companyName = document.getElementById('nof-company-name').value.trim();
    const orgNumber = document.getElementById('nof-org-number').value.trim();
    const orgForm = document.getElementById('nof-org-form').value.trim();
    const address = document.getElementById('nof-address').value.trim();
    const email = document.getElementById('nof-email').value.trim();

    if (!companyName) { toast('Fyll inn firmanavn', 'error'); return; }
    if (!email) { toast('Fyll inn e-post', 'error'); return; }

    const inquiry = DB.addInquiry({
        type: 'company',
        companyName,
        orgNumber,
        orgForm,
        address,
        privateName: '',
        contactName: '',
        contactPhone: '',
        contactEmail: email,
        dateFlexible: true,
        desiredDate: '',
        desiredTime: '',
        desiredEndTime: '',
        venueInfo: '',
        guests: '',
        audience: '',
        wishes: '',
        events: [],
        source: 'admin-direct',
    });

    const offer = DB.addOffer({
        inquiryId: inquiry.id,
        customerId: null,
        events: [{ date: '', time: '', endTime: '', description: 'Arrangement', services: [], consumables: [], equipmentRental: [], eventPrice: '' }],
        totalPrice: '',
        priceMode: 'total',
        validUntil: '',
        notes: '',
    });

    DB.updateInquiry(inquiry.id, { status: 'offered' });

    const basePath = window.location.href.replace(/index\.html.*$/, '').replace(/\?.*$/, '');
    const prefill = btoa(unescape(encodeURIComponent(JSON.stringify({
        companyName,
        orgNumber,
        orgForm,
        address,
        contactEmail: email,
    }))));
    const registerUrl = basePath + 'register.html?prefill=' + prefill;

    const subject = encodeURIComponent(`Neonparty — Fullfør registrering for tilbud`);
    const body = encodeURIComponent(
        `Hei,\n\n` +
        `Vi har begynt å lage et tilbud til ${companyName}.\n\n` +
        `For at vi skal kunne ferdigstille tilbudet, trenger vi litt mer informasjon fra dere.\n` +
        `Vennligst fyll ut resten av registreringsskjemaet via denne lenken:\n\n` +
        `${registerUrl}\n\n` +
        `Firmainformasjonen er allerede forhåndsutfylt — dere trenger bare å legge til kontaktperson, dato, og ønsker.\n\n` +
        `Mvh,\nNeonparty`
    );

    const mailto = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
    window.open(mailto, '_blank');

    closeModal();
    toast('Tilbud opprettet — e-postklient åpnet', 'success');

    App.currentOfferId = offer.id;
    showView('offer-editor');
}

function resendDirectOfferEmail(inquiryId) {
    const inq = DB.getInquiry(inquiryId);
    if (!inq) return;

    const basePath = window.location.href.replace(/index\.html.*$/, '').replace(/\?.*$/, '');
    const prefill = btoa(unescape(encodeURIComponent(JSON.stringify({
        companyName: inq.companyName,
        orgNumber: inq.orgNumber,
        orgForm: inq.orgForm,
        address: inq.address,
        contactEmail: inq.contactEmail,
    }))));
    const registerUrl = basePath + 'register.html?prefill=' + prefill;

    const subject = encodeURIComponent('Neonparty — Fullfør registrering for tilbud');
    const body = encodeURIComponent(
        `Hei,\n\n` +
        `Vi har begynt å lage et tilbud til ${inq.companyName}.\n\n` +
        `For at vi skal kunne ferdigstille tilbudet, trenger vi litt mer informasjon fra dere.\n` +
        `Vennligst fyll ut resten av registreringsskjemaet via denne lenken:\n\n` +
        `${registerUrl}\n\n` +
        `Firmainformasjonen er allerede forhåndsutfylt — dere trenger bare å legge til kontaktperson, dato, og ønsker.\n\n` +
        `Mvh,\nNeonparty`
    );

    const mailto = `mailto:${encodeURIComponent(inq.contactEmail)}?subject=${subject}&body=${body}`;
    window.open(mailto, '_blank');
    toast('E-postklient åpnet', 'success');
}

function renderOfferEditor() {
    const offer = DB.getOffer(App.currentOfferId);
    if (!offer) return showView('sales');
    const container = document.getElementById('offer-editor-content');
    const inq = offer.inquiryId ? DB.getInquiry(offer.inquiryId) : null;
    const name = inq ? (inq.companyName || inq.privateName || inq.contactName) : 'Ukjent';
    const awaitingInfo = inq?.source === 'admin-direct' && !inq.contactName;

    let statusBadge = '';
    if (offer.status === 'draft') statusBadge = '<span class="status-badge bg-gray-500/20 text-gray-400">Utkast</span>';
    else if (offer.status === 'sent') statusBadge = '<span class="status-badge bg-neon-blue/20 text-neon-blue">Sendt</span>';
    else if (offer.status === 'accepted') statusBadge = '<span class="status-badge bg-neon-green/20 text-neon-green">Akseptert</span>';

    container.innerHTML = `
        <div class="flex items-start justify-between">
            <div>
                <h2 class="text-xl font-bold">Tilbud — ${esc(name)}</h2>
                ${statusBadge}
            </div>
            <div class="flex gap-2">
                <button onclick="deleteOfferPrompt('${offer.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Slett</button>
            </div>
        </div>

        ${awaitingInfo ? `
        <div class="bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl p-4">
            <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-neon-yellow mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <div>
                    <p class="text-sm font-medium text-neon-yellow">Venter på kunderegistrering</p>
                    <p class="text-xs text-gray-400 mt-1">E-post sendt til ${esc(inq.contactEmail)}. Kunden må fylle ut resten av informasjonen via registreringslinken.</p>
                    <button onclick="resendDirectOfferEmail('${inq.id}')" class="mt-2 text-xs px-3 py-1.5 rounded-lg bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30 hover:bg-neon-yellow/30 transition-colors">Send registreringslink på nytt</button>
                </div>
            </div>
        </div>` : ''}

        <div class="bg-dark-800 rounded-xl border border-dark-600 p-4">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-300">Prismodell</h3>
            </div>
            <div class="flex gap-2">
                <button onclick="setOfferPriceMode('${offer.id}', 'total')" class="flex-1 py-2 rounded-lg text-sm font-medium ${offer.priceMode === 'total' ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' : 'bg-dark-700 text-gray-400 border border-dark-600'}">Totalpris</button>
                <button onclick="setOfferPriceMode('${offer.id}', 'per-event')" class="flex-1 py-2 rounded-lg text-sm font-medium ${offer.priceMode === 'per-event' ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' : 'bg-dark-700 text-gray-400 border border-dark-600'}">Pris per arrangement</button>
            </div>
            ${offer.priceMode === 'total' ? `
            <div class="mt-3">
                <label class="block text-xs text-gray-400 mb-1">Totalpris (kr)</label>
                <input type="number" id="offer-total-price" value="${offer.totalPrice || ''}" placeholder="0" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" onchange="updateOfferTotalPrice('${offer.id}', this.value)">
            </div>` : ''}
        </div>

        <div class="space-y-4" id="offer-events-container">
            ${(offer.events || []).map((ev, evIdx) => renderOfferEventBlock(offer.id, ev, evIdx, offer.priceMode)).join('')}
        </div>

        <button onclick="addOfferEvent('${offer.id}')" class="w-full py-2 rounded-xl text-sm font-semibold bg-dark-800 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/10 transition-colors">+ Legg til arrangement</button>

        <div class="bg-dark-800 rounded-xl border border-dark-600 p-4">
            <label class="block text-xs text-gray-400 mb-1">Gyldig til</label>
            <input type="date" id="offer-valid-until" value="${offer.validUntil || ''}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" onchange="DB.updateOffer('${offer.id}', { validUntil: this.value })">
        </div>

        <div class="bg-dark-800 rounded-xl border border-dark-600 p-4">
            <label class="block text-xs text-gray-400 mb-1">Notater</label>
            <textarea id="offer-notes" rows="2" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" onchange="DB.updateOffer('${offer.id}', { notes: this.value })">${esc(offer.notes || '')}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <button onclick="previewOffer('${offer.id}')" class="py-2.5 rounded-xl text-sm font-semibold bg-dark-800 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/10 transition-colors">Forhåndsvisning</button>
            <button onclick="sendOfferByEmail('${offer.id}')" class="py-2.5 rounded-xl text-sm font-semibold bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors">Send på e-post</button>
        </div>

        ${offer.status !== 'accepted' ? `
        <button onclick="markOfferAccepted('${offer.id}')" class="w-full py-3 rounded-xl text-sm font-bold bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors">Marker som akseptert — Lag kontrakt</button>` : ''}
    `;

    _setupOfferLibAutocomplete(container);
}

function _offerLibType(catName) {
    if (catName === 'equipmentRental') return 'equipment';
    if (catName === 'consumables') return 'consumables';
    return 'services';
}

function _buildOfferLineRow(offerId, evIdx, catName, item, i) {
    const libType = _offerLibType(catName);
    return `
        <div class="flex gap-2 items-center offer-line" data-cat="${catName}" data-ev="${evIdx}" data-idx="${i}">
            <div class="flex-1 relative">
                <input type="text" value="${esc(item.name)}" placeholder="Navn..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ol-name" autocomplete="off" data-lib-type="${libType}">
                <div class="lib-suggestions hidden absolute z-50 left-0 right-0 top-full mt-1 bg-dark-600 border border-dark-500 rounded-lg shadow-lg max-h-36 overflow-y-auto"></div>
            </div>
            <input type="number" value="${item.quantity || 1}" min="1" class="w-14 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ol-qty">
            <input type="number" value="${item.unitPrice || ''}" placeholder="Pris" class="w-20 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ol-price">
            <button type="button" onclick="removeOfferLine('${offerId}', ${evIdx}, '${catName}', ${i})" class="text-neon-pink text-lg px-1 hover:text-neon-pink/70">&times;</button>
        </div>`;
}

function renderOfferEventBlock(offerId, ev, evIdx, priceMode) {
    const catBlock = (catName, catLabel, catColor, items) => {
        const rows = (items || []).map((item, i) => _buildOfferLineRow(offerId, evIdx, catName, item, i)).join('');
        const libType = _offerLibType(catName);
        return `
        <div class="mt-2">
            <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold ${catColor} uppercase tracking-wider">${catLabel}</span>
                <div class="flex gap-2">
                    <button type="button" onclick="showOfferLibPicker('${offerId}', ${evIdx}, '${catName}')" class="text-xs text-gray-400 hover:${catColor} hover:underline">Bibliotek</button>
                    <button type="button" onclick="addOfferLine('${offerId}', ${evIdx}, '${catName}')" class="text-xs ${catColor} hover:underline">+ Legg til</button>
                </div>
            </div>
            <div class="space-y-1.5 offer-cat-container" id="offer-${offerId}-ev${evIdx}-${catName}" data-lib-type="${libType}">${rows}</div>
        </div>`;
    };

    return `
    <div class="bg-dark-800 rounded-xl border border-neon-yellow/20 p-4 offer-event-block" data-offer-id="${offerId}" data-ev-idx="${evIdx}">
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-neon-yellow">Arrangement ${evIdx + 1}</h3>
            <button onclick="removeOfferEvent('${offerId}', ${evIdx})" class="text-xs text-red-400 hover:text-red-300">&times; Fjern</button>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
            <div>
                <label class="block text-xs text-gray-400 mb-1">Dato</label>
                <input type="date" value="${ev.date || ''}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm focus:border-neon-blue focus:outline-none" onchange="updateOfferEventField('${offerId}', ${evIdx}, 'date', this.value)">
            </div>
            <div>
                <label class="block text-xs text-gray-400 mb-1">Beskrivelse</label>
                <input type="text" value="${esc(ev.description || '')}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm focus:border-neon-blue focus:outline-none" onchange="updateOfferEventField('${offerId}', ${evIdx}, 'description', this.value)">
            </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
            <div>
                <label class="block text-xs text-gray-400 mb-1">Starttidspunkt</label>
                <input type="time" value="${ev.time || ''}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm focus:border-neon-blue focus:outline-none" onchange="updateOfferEventField('${offerId}', ${evIdx}, 'time', this.value)">
            </div>
            <div>
                <label class="block text-xs text-gray-400 mb-1">Sluttidspunkt</label>
                <input type="time" value="${ev.endTime || ''}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm focus:border-neon-blue focus:outline-none" onchange="updateOfferEventField('${offerId}', ${evIdx}, 'endTime', this.value)">
            </div>
        </div>
        ${priceMode === 'per-event' ? `
        <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Pris for dette arrangementet (kr)</label>
            <input type="number" value="${ev.eventPrice || ''}" placeholder="0" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm focus:border-neon-blue focus:outline-none" onchange="updateOfferEventField('${offerId}', ${evIdx}, 'eventPrice', this.value)">
        </div>` : ''}
        ${catBlock('services', 'Tjenester', 'text-neon-green', ev.services)}
        ${catBlock('consumables', 'Forbruksmateriell', 'text-neon-pink', ev.consumables)}
        ${catBlock('equipmentRental', 'Utstyrsleie', 'text-neon-blue', ev.equipmentRental)}
        <div class="mt-3">
            <label class="block text-xs text-gray-400 mb-1">Tilleggsinformasjon</label>
            <textarea rows="2" placeholder="Ekstra info for dette arrangementet..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm focus:border-neon-blue focus:outline-none resize-none ol-extra-info">${esc(ev.extraInfo || '')}</textarea>
        </div>
        <button onclick="saveOfferLines('${offerId}', ${evIdx})" class="mt-3 w-full py-1.5 rounded-lg text-xs font-medium bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors">Lagre linjer</button>
        <button onclick="createEventFromOffer('${offerId}', ${evIdx})" class="mt-2 w-full py-2 rounded-lg text-xs font-semibold bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20 transition-colors flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Opprett arrangement fra dette
        </button>
    </div>`;
}

function setOfferPriceMode(offerId, mode) {
    DB.updateOffer(offerId, { priceMode: mode });
    renderOfferEditor();
}

function _setupOfferLibAutocomplete(container) {
    container.addEventListener('input', (e) => {
        const input = e.target;
        if (!input.dataset.libType) return;
        const type = input.dataset.libType;
        const val = input.value.toLowerCase().trim();
        const sugBox = input.parentElement.querySelector('.lib-suggestions');
        if (!sugBox) return;
        if (!val || val.length < 1) { sugBox.classList.add('hidden'); return; }
        const lib = DB.getContractLibrary(type);
        const matches = lib.filter(i => i.name.toLowerCase().includes(val));
        if (matches.length === 0) { sugBox.classList.add('hidden'); return; }
        sugBox.innerHTML = matches.map(m =>
            `<div class="px-3 py-1.5 text-sm cursor-pointer hover:bg-dark-500 transition-colors offer-lib-sug" data-name="${esc(m.name)}" data-qty="${m.defaultQty || 1}">${esc(m.name)}</div>`
        ).join('');
        sugBox.classList.remove('hidden');
    });
    container.addEventListener('click', (e) => {
        const item = e.target.closest('.offer-lib-sug');
        if (!item) return;
        const line = item.closest('.offer-line');
        if (!line) return;
        const nameInput = line.querySelector('.ol-name');
        const qtyInput = line.querySelector('.ol-qty');
        nameInput.value = item.dataset.name;
        if (qtyInput && (!qtyInput.value || qtyInput.value === '1')) {
            qtyInput.value = item.dataset.qty;
        }
        item.closest('.lib-suggestions').classList.add('hidden');
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.lib-suggestions') && !e.target.dataset.libType) {
            container.querySelectorAll('.lib-suggestions').forEach(s => s.classList.add('hidden'));
        }
    });
}

function showOfferLibPicker(offerId, evIdx, catName) {
    const libType = _offerLibType(catName);
    const lib = DB.getContractLibrary(libType);
    const typeLabels = { services: 'Tjenester', consumables: 'Forbruksmateriell', equipment: 'Utstyr' };
    const typeColors = { services: 'text-neon-green', consumables: 'text-neon-pink', equipment: 'text-neon-blue' };
    const label = typeLabels[libType];
    const color = typeColors[libType];

    if (lib.length === 0) {
        toast(`Ingen ${label.toLowerCase()} i biblioteket ennå. Legg til elementer — de lagres automatisk ved lagring.`, 'info');
        return;
    }

    const containerId = `offer-${offerId}-ev${evIdx}-${catName}`;
    const existing = [];
    document.querySelectorAll(`#${containerId} .ol-name`).forEach(input => {
        if (input.value.trim()) existing.push(input.value.toLowerCase().trim());
    });
    const available = lib.filter(i => !existing.includes(i.name.toLowerCase().trim()));
    if (available.length === 0) {
        toast('Alle elementer fra biblioteket er allerede lagt til', 'info');
        return;
    }

    const html = `<div id="offer-lib-picker-overlay" class="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4" style="margin:0;">
        <div class="bg-dark-800 rounded-xl border border-dark-600 p-4 w-full max-w-sm max-h-[70vh] flex flex-col">
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold ${color}">${label}-bibliotek</h3>
                <button onclick="document.getElementById('offer-lib-picker-overlay').remove()" class="text-gray-500 hover:text-white text-lg">&times;</button>
            </div>
            <input type="text" id="offer-lib-picker-search" placeholder="Søk..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm mb-2 focus:border-neon-blue focus:outline-none">
            <div class="flex-1 overflow-y-auto space-y-1" id="offer-lib-picker-items">
                ${available.map(item => `
                    <label class="flex items-center gap-3 p-2 rounded-lg bg-dark-700 cursor-pointer hover:bg-dark-600 transition-colors">
                        <input type="checkbox" value="${esc(item.name)}" data-qty="${item.defaultQty || 1}" class="rounded offer-lib-pick-cb">
                        <span class="text-sm flex-1">${esc(item.name)}</span>
                        <span class="text-xs text-gray-500">${item.defaultQty || 1} stk</span>
                    </label>
                `).join('')}
            </div>
            <button id="offer-lib-picker-add" class="mt-3 w-full btn-neon py-2 rounded-lg text-sm font-semibold">Legg til valgte</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('offer-lib-picker-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#offer-lib-picker-items label').forEach(label => {
            const name = label.querySelector('.offer-lib-pick-cb').value.toLowerCase();
            label.style.display = name.includes(q) ? '' : 'none';
        });
    });

    document.getElementById('offer-lib-picker-add').addEventListener('click', () => {
        const offer = DB.getOffer(offerId);
        if (!offer || !offer.events[evIdx]) return;
        if (!offer.events[evIdx][catName]) offer.events[evIdx][catName] = [];
        document.querySelectorAll('.offer-lib-pick-cb:checked').forEach(cb => {
            offer.events[evIdx][catName].push({ name: cb.value, quantity: parseInt(cb.dataset.qty) || 1, unitPrice: '' });
        });
        DB.updateOffer(offerId, { events: offer.events });
        document.getElementById('offer-lib-picker-overlay').remove();
        renderOfferEditor();
    });

    document.getElementById('offer-lib-picker-search').focus();
}

function updateOfferTotalPrice(offerId, value) {
    DB.updateOffer(offerId, { totalPrice: value });
}

function updateOfferEventField(offerId, evIdx, field, value) {
    const offer = DB.getOffer(offerId);
    if (!offer || !offer.events[evIdx]) return;
    offer.events[evIdx][field] = value;
    DB.updateOffer(offerId, { events: offer.events });
}

function addOfferLine(offerId, evIdx, category) {
    const offer = DB.getOffer(offerId);
    if (!offer || !offer.events[evIdx]) return;
    if (!offer.events[evIdx][category]) offer.events[evIdx][category] = [];
    offer.events[evIdx][category].push({ name: '', quantity: 1, unitPrice: '' });
    DB.updateOffer(offerId, { events: offer.events });
    renderOfferEditor();
}

function removeOfferLine(offerId, evIdx, category, lineIdx) {
    const offer = DB.getOffer(offerId);
    if (!offer || !offer.events[evIdx]) return;
    offer.events[evIdx][category].splice(lineIdx, 1);
    DB.updateOffer(offerId, { events: offer.events });
    renderOfferEditor();
}

function saveOfferLines(offerId, evIdx) {
    const offer = DB.getOffer(offerId);
    if (!offer || !offer.events[evIdx]) return;

    ['services', 'consumables', 'equipmentRental'].forEach(cat => {
        const container = document.getElementById(`offer-${offerId}-ev${evIdx}-${cat}`);
        if (!container) return;
        const lines = [];
        container.querySelectorAll('.offer-line').forEach(row => {
            const name = row.querySelector('.ol-name').value.trim();
            const qty = parseInt(row.querySelector('.ol-qty').value) || 1;
            const price = row.querySelector('.ol-price').value;
            if (name) lines.push({ name, quantity: qty, unitPrice: price });
        });
        offer.events[evIdx][cat] = lines;
        const libType = _offerLibType(cat);
        DB.ensureLibraryItems(lines, libType);
    });

    const block = document.querySelector(`.offer-event-block[data-offer-id="${offerId}"][data-ev-idx="${evIdx}"]`);
    if (block) {
        const extraInfoEl = block.querySelector('.ol-extra-info');
        if (extraInfoEl) offer.events[evIdx].extraInfo = extraInfoEl.value.trim();
    }

    DB.updateOffer(offerId, { events: offer.events });
    toast('Lagret', 'success');
}

function addOfferEvent(offerId) {
    const offer = DB.getOffer(offerId);
    if (!offer) return;
    offer.events.push({ date: '', time: '', endTime: '', description: '', services: [], consumables: [], equipmentRental: [], eventPrice: '', extraInfo: '' });
    DB.updateOffer(offerId, { events: offer.events });
    renderOfferEditor();
}

function removeOfferEvent(offerId, evIdx) {
    const offer = DB.getOffer(offerId);
    if (!offer || offer.events.length <= 1) { toast('Minst ett arrangement kreves', 'error'); return; }
    offer.events.splice(evIdx, 1);
    DB.updateOffer(offerId, { events: offer.events });
    renderOfferEditor();
}

function createEventFromOffer(offerId, evIdx) {
    const offer = DB.getOffer(offerId);
    if (!offer) return;

    const inq = offer.inquiryId ? DB.getInquiry(offer.inquiryId) : null;
    const offerEv = offer.events[evIdx || 0];
    if (!offerEv) return;

    const customerName = inq ? (inq.companyName || inq.privateName || inq.contactName || '') : '';
    const eventName = offerEv.description ? (customerName ? `${customerName} — ${offerEv.description}` : offerEv.description) : (customerName || 'Arrangement fra tilbud');

    let startDate = '';
    if (offerEv.date) {
        startDate = offerEv.time ? `${offerEv.date}T${offerEv.time}` : `${offerEv.date}T00:00`;
    }
    let endDate = '';
    if (offerEv.date && offerEv.endTime) {
        endDate = `${offerEv.date}T${offerEv.endTime}`;
    }

    const equipment = (offerEv.equipmentRental || []).filter(e => e.name).map(e => ({
        name: e.name,
        quantity: parseInt(e.quantity) || 1
    }));

    const consumables = (offerEv.consumables || []).filter(c => c.name).map(c => ({
        name: c.name,
        quantity: parseInt(c.quantity) || 0
    }));

    const services = (offerEv.services || []).filter(s => s.name).map(s => s.name);
    const noteParts = [];
    if (services.length) noteParts.push('Tjenester: ' + services.join(', '));
    if (offerEv.extraInfo) noteParts.push(offerEv.extraInfo);
    if (inq?.wishes) noteParts.push('Ønsker: ' + inq.wishes);

    const prefilled = {
        name: eventName,
        location: inq?.venueAddress || '',
        startDate: startDate ? new Date(startDate).toISOString() : '',
        endDate: endDate ? new Date(endDate).toISOString() : '',
        description: [offerEv.description, inq?.audience ? 'Målgruppe: ' + inq.audience : ''].filter(Boolean).join('. '),
        notes: noteParts.join(' | '),
        equipment,
        consumables,
    };

    showEventForm(prefilled);
}

function deleteOfferPrompt(offerId) {
    openModal('Slett tilbud', `
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette dette tilbudet?</p>
        <div class="flex gap-2">
            <button onclick="DB.deleteOffer('${offerId}'); closeModal(); App.salesTab='offers'; showView('sales'); toast('Tilbud slettet');" class="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors font-semibold">Slett</button>
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Avbryt</button>
        </div>
    `);
}

function sendOfferByEmail(offerId) {
    const offer = DB.getOffer(offerId);
    if (!offer) return;
    const inq = offer.inquiryId ? DB.getInquiry(offer.inquiryId) : null;
    const name = inq ? (inq.companyName || inq.privateName || inq.contactName) : 'Kunde';
    const email = inq?.contactEmail || '';

    let body = `Hei,\n\nHer er tilbudet fra Neonparty.\n\n`;

    (offer.events || []).forEach((ev, i) => {
        body += `--- Arrangement ${i + 1}: ${ev.description || ''} ---\n`;
        if (ev.date) body += `Dato: ${ev.date}${ev.time ? ' kl. ' + ev.time : ''}${ev.endTime ? ' – ' + ev.endTime : ''}\n`;
        if (offer.priceMode === 'per-event' && ev.eventPrice) body += `Pris: kr ${ev.eventPrice}\n`;
        ['services', 'consumables', 'equipmentRental'].forEach(cat => {
            const label = cat === 'services' ? 'Tjenester' : cat === 'consumables' ? 'Forbruksmateriell' : 'Utstyrsleie';
            if ((ev[cat] || []).length > 0) {
                body += `\n${label}:\n`;
                ev[cat].forEach(item => {
                    body += `  - ${item.name} x${item.quantity}${item.unitPrice ? ' — kr ' + item.unitPrice : ''}\n`;
                });
            }
        });
        if (ev.extraInfo) body += `\n${ev.extraInfo}\n`;
        body += '\n';
    });

    if (offer.priceMode === 'total' && offer.totalPrice) body += `Totalpris: kr ${offer.totalPrice}\n`;
    if (offer.validUntil) body += `Tilbudet er gyldig til: ${offer.validUntil}\n`;
    if (offer.notes) body += `\nMerknader: ${offer.notes}\n`;
    body += `\nMvh,\nNeonparty`;

    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Tilbud fra Neonparty — ' + name)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');

    DB.updateOffer(offerId, { status: 'sent' });
    renderOfferEditor();
    toast('E-postklient åpnet', 'success');
}

function previewOffer(offerId) {
    App.currentOfferId = offerId;
    showView('offer-preview');
}

function renderOfferPreview() {
    const offer = DB.getOffer(App.currentOfferId);
    if (!offer) return showView('sales');
    const container = document.getElementById('offer-preview-content');
    const inq = offer.inquiryId ? DB.getInquiry(offer.inquiryId) : null;
    const name = inq ? (inq.companyName || inq.privateName || inq.contactName) : 'Kunde';

    let html = `
        <div class="bg-white text-gray-900 rounded-xl p-6 max-w-xl mx-auto" id="offer-preview-printable">
            <div class="flex items-center justify-between mb-6 border-b pb-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Tilbud</h1>
                    <p class="text-sm text-gray-500">Fra Neonparty</p>
                </div>
                <div class="text-right text-sm text-gray-500">
                    <div>Dato: ${new Date(offer.createdAt).toLocaleDateString('nb-NO')}</div>
                    ${offer.validUntil ? `<div>Gyldig til: ${offer.validUntil}</div>` : ''}
                </div>
            </div>
            <div class="mb-6">
                <h2 class="font-semibold text-gray-900 mb-1">Til: ${esc(name)}</h2>
                ${inq?.contactName ? `<div class="text-sm text-gray-600">v/ ${esc(inq.contactName)}</div>` : ''}
                ${inq?.contactEmail ? `<div class="text-sm text-gray-600">${esc(inq.contactEmail)}</div>` : ''}
            </div>`;

    let grandTotal = 0;

    (offer.events || []).forEach((ev, i) => {
        html += `<div class="mb-6">
            <h3 class="font-semibold text-gray-800 border-b pb-1 mb-2">Arrangement ${i + 1}${ev.description ? ': ' + esc(ev.description) : ''}</h3>
            ${ev.date ? `<p class="text-sm text-gray-500 mb-2">Dato: ${ev.date}${ev.time ? ' kl. ' + ev.time : ''}${ev.endTime ? ' – ' + ev.endTime : ''}</p>` : ''}`;

        ['services', 'consumables', 'equipmentRental'].forEach(cat => {
            const label = cat === 'services' ? 'Tjenester' : cat === 'consumables' ? 'Forbruksmateriell' : 'Utstyrsleie';
            if ((ev[cat] || []).length > 0) {
                html += `<div class="mb-3">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">${label}</h4>
                    <table class="w-full text-sm">
                        <thead><tr class="text-xs text-gray-400 border-b"><th class="text-left py-1">Beskrivelse</th><th class="text-right py-1">Antall</th><th class="text-right py-1">Pris</th><th class="text-right py-1">Sum</th></tr></thead>
                        <tbody>`;
                let catTotal = 0;
                ev[cat].forEach(item => {
                    const lineTotal = (item.quantity || 1) * (parseFloat(item.unitPrice) || 0);
                    catTotal += lineTotal;
                    html += `<tr class="border-b border-gray-100"><td class="py-1">${esc(item.name)}</td><td class="text-right py-1">${item.quantity || 1}</td><td class="text-right py-1">${item.unitPrice ? 'kr ' + item.unitPrice : '—'}</td><td class="text-right py-1">${lineTotal ? 'kr ' + lineTotal.toLocaleString('nb-NO') : '—'}</td></tr>`;
                });
                html += `</tbody></table></div>`;
            }
        });

        if (ev.extraInfo) {
            html += `<div class="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600 whitespace-pre-line">${esc(ev.extraInfo)}</div>`;
        }

        if (offer.priceMode === 'per-event' && ev.eventPrice) {
            const ep = parseFloat(ev.eventPrice) || 0;
            grandTotal += ep;
            html += `<div class="text-right font-semibold text-gray-800 mt-1">Pris: kr ${Number(ev.eventPrice).toLocaleString('nb-NO')}</div>`;
        }
        html += `</div>`;
    });

    if (offer.priceMode === 'total' && offer.totalPrice) {
        grandTotal = parseFloat(offer.totalPrice) || 0;
    }

    if (grandTotal > 0) {
        html += `<div class="border-t-2 pt-3 mt-4 text-right"><span class="text-lg font-bold text-gray-900">Totalt: kr ${grandTotal.toLocaleString('nb-NO')}</span></div>`;
    }

    if (offer.notes) {
        html += `<div class="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">${esc(offer.notes)}</div>`;
    }

    html += `</div>
    <div class="flex gap-3 mt-4 no-print">
        <button onclick="window.print()" class="flex-1 py-2 rounded-xl text-sm font-semibold bg-dark-800 text-gray-300 border border-dark-600 hover:bg-dark-700 transition-colors">Skriv ut</button>
        <button onclick="sendOfferByEmail('${offer.id}')" class="flex-1 py-2 rounded-xl text-sm font-semibold bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors">Send på e-post</button>
    </div>`;

    container.innerHTML = html;
}

function markOfferAccepted(offerId) {
    openModal('Aksepter tilbud', `
        <p class="text-gray-300 mb-4">Marker tilbudet som akseptert og generer en kontrakt?</p>
        <div class="flex gap-2">
            <button onclick="doAcceptOffer('${offerId}')" class="flex-1 py-2 rounded-lg bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors font-semibold">Aksepter & lag kontrakt</button>
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Avbryt</button>
        </div>
    `);
}

function doAcceptOffer(offerId) {
    DB.acceptOffer(offerId);
    const contract = DB.generateContractFromOffer(offerId);
    closeModal();
    if (contract) {
        toast('Kontrakt opprettet!', 'success');
        ContractApp.currentContractId = contract.id;
        showView('contract-detail');
    } else {
        toast('Feil ved oppretting av kontrakt', 'error');
        renderOfferEditor();
    }
}

// ========================
// Venues
// ========================

function renderVenuesTab() {
    const venues = DB.getVenues();
    const container = document.getElementById('venues-list');

    if (venues.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            <p>Ingen venues ennå</p><p class="text-xs mt-1">Trykk "+ Ny venue" for å opprette</p>
        </div>`;
        return;
    }

    const sorted = [...venues].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    container.innerHTML = sorted.map(v => {
        const eqCount = (v.existingEquipment || []).length;
        const photoCount = (v.photoIds || []).length;
        return `<div class="bg-dark-800 rounded-xl p-4 border border-dark-600 cursor-pointer hover:bg-dark-700 transition-colors" onclick="openVenueDetail('${v.id}')">
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="font-bold text-base">${esc(v.name)}</h3>
                    <p class="text-sm text-gray-400">${esc(v.address || '')}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-400 mt-2">
                ${v.area ? `<span>${v.area} m²</span>` : ''}
                ${eqCount > 0 ? `<span class="text-neon-green">${eqCount} eksisterende utstyr</span>` : ''}
                ${photoCount > 0 ? `<span class="text-neon-blue">${photoCount} bilder</span>` : ''}
            </div>
        </div>`;
    }).join('');
}

function openVenueDetail(venueId) {
    App.currentVenueId = venueId;
    showView('venue-detail');
}

function renderVenueDetail() {
    const venue = DB.getVenue(App.currentVenueId);
    if (!venue) return showView('sales');
    const container = document.getElementById('venue-detail-content');

    container.innerHTML = `
        <div class="flex items-start justify-between">
            <div>
                <h2 class="text-xl font-bold">${esc(venue.name)}</h2>
                <p class="text-sm text-gray-400 mt-1">${esc(venue.address || '')}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="showVenueForm(DB.getVenue('${venue.id}'))" class="text-xs px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Rediger</button>
                <button onclick="deleteVenuePrompt('${venue.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Slett</button>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
            ${venue.area ? `<div class="bg-dark-800 rounded-xl p-3 border border-dark-600 text-center">
                <div class="text-xl font-bold text-neon-blue">${venue.area}</div>
                <div class="text-xs text-gray-400">m² areal</div>
            </div>` : ''}
            <div class="bg-dark-800 rounded-xl p-3 border border-dark-600 text-center">
                <div class="text-xl font-bold text-neon-green">${(venue.existingEquipment || []).length}</div>
                <div class="text-xs text-gray-400">Eksisterende utstyr</div>
            </div>
        </div>

        ${venue.description ? `
        <div class="bg-dark-800 rounded-xl border border-dark-600 p-4">
            <h3 class="text-sm font-semibold text-gray-300 mb-2">Beskrivelse</h3>
            <p class="text-sm text-gray-400">${esc(venue.description)}</p>
        </div>` : ''}

        ${venue.facilities ? `
        <div class="bg-dark-800 rounded-xl border border-neon-purple/20 p-4">
            <h3 class="text-sm font-semibold text-neon-purple mb-2 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Anleggsinfo
            </h3>
            <p class="text-sm text-gray-400">${esc(venue.facilities)}</p>
        </div>` : ''}

        ${(venue.existingEquipment || []).length > 0 ? `
        <div class="bg-dark-800 rounded-xl border border-neon-green/20 p-4">
            <h3 class="text-sm font-semibold text-neon-green mb-2 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                Eksisterende utstyr på stedet
            </h3>
            <div class="space-y-1.5">
                ${venue.existingEquipment.map(e => `
                    <div class="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2">
                        <span class="text-sm">${esc(e.name)}</span>
                        <span class="text-xs text-neon-green font-medium">${e.quantity} stk</span>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        <div>
            <h3 class="font-semibold mb-3 text-gray-300">Bilder</h3>
            <div class="photo-grid" id="venue-photos-grid">
                <label class="photo-capture-btn">
                    <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span class="text-xs">Legg til bilde</span>
                    <input type="file" accept="image/*" capture="environment" class="hidden" onchange="handleVenuePhotoUpload(event, '${venue.id}')">
                </label>
            </div>
        </div>

        ${venue.notes ? `
        <div class="bg-dark-800 rounded-xl border border-dark-600 p-4">
            <h3 class="text-sm font-semibold text-gray-300 mb-2">Notater</h3>
            <p class="text-sm text-gray-400">${esc(venue.notes)}</p>
        </div>` : ''}
    `;

    loadVenuePhotos(venue);
}

async function loadVenuePhotos(venue) {
    const grid = document.getElementById('venue-photos-grid');
    if (!grid) return;
    const placeholder = grid.querySelector('.photo-capture-btn');
    for (const photoId of (venue.photoIds || [])) {
        try {
            const dataUrl = await PhotoDB.get(photoId);
            if (dataUrl) {
                const wrapper = document.createElement('div');
                wrapper.className = 'relative';
                const img = document.createElement('img');
                img.src = dataUrl;
                img.onclick = () => showPhotoLightbox(dataUrl);
                const delBtn = document.createElement('button');
                delBtn.className = 'absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center hover:bg-red-500';
                delBtn.innerHTML = '&times;';
                delBtn.onclick = (e) => { e.stopPropagation(); removeVenuePhoto(venue.id, photoId); };
                wrapper.appendChild(img);
                wrapper.appendChild(delBtn);
                grid.insertBefore(wrapper, placeholder);
            }
        } catch {}
    }
}

async function handleVenuePhotoUpload(event, venueId) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const photoId = await PhotoDB.saveFromFile(file);
        const venue = DB.getVenue(venueId);
        if (venue) {
            const photoIds = venue.photoIds || [];
            photoIds.push(photoId);
            DB.updateVenue(venueId, { photoIds });
        }
        toast('Bilde lagt til', 'success');
        renderVenueDetail();
    } catch {
        toast('Kunne ikke lagre bilde', 'error');
    }
    event.target.value = '';
}

function removeVenuePhoto(venueId, photoId) {
    const venue = DB.getVenue(venueId);
    if (!venue) return;
    const photoIds = (venue.photoIds || []).filter(p => p !== photoId);
    DB.updateVenue(venueId, { photoIds });
    toast('Bilde fjernet');
    renderVenueDetail();
}

function showVenueForm(venue = null) {
    const isEdit = venue && venue.id;

    const eqRows = (venue?.existingEquipment || []).map((e, i) =>
        `<div class="flex gap-2 items-center venue-eq-row" data-idx="${i}">
            <input type="number" value="${e.quantity || 1}" min="1" class="w-16 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm venue-eq-qty">
            <input type="text" value="${esc(e.name)}" placeholder="Utstyrsnavn..." class="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm venue-eq-name">
            <button type="button" onclick="this.closest('.venue-eq-row').remove()" class="text-neon-pink text-lg px-1 hover:text-neon-pink/70">&times;</button>
        </div>`
    ).join('');

    openModal(isEdit ? 'Rediger venue' : 'Ny venue', `
        <form id="venue-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Navn *</label>
                <input type="text" id="vf-name" value="${esc(venue?.name || '')}" required class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Adresse</label>
                <input type="text" id="vf-address" value="${esc(venue?.address || '')}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Areal (m²)</label>
                <input type="number" id="vf-area" value="${venue?.area || ''}" min="0" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Beskrivelse</label>
                <textarea id="vf-description" rows="2" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">${esc(venue?.description || '')}</textarea>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Anleggsinfo (strøm, lyd, etc.)</label>
                <textarea id="vf-facilities" rows="2" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">${esc(venue?.facilities || '')}</textarea>
            </div>

            <div class="space-y-1">
                <div class="flex items-center justify-between">
                    <div class="text-xs font-semibold text-neon-green uppercase tracking-wider">Eksisterende utstyr på stedet</div>
                    <button type="button" id="btn-venue-add-eq" class="text-xs text-neon-green hover:underline">+ Legg til</button>
                </div>
                <div id="vf-equipment" class="space-y-1.5">${eqRows}</div>
            </div>

            <div>
                <label class="block text-sm text-gray-400 mb-1">Notater</label>
                <textarea id="vf-notes" rows="2" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">${esc(venue?.notes || '')}</textarea>
            </div>

            <button type="submit" class="w-full btn-neon py-2 rounded-lg font-semibold">${isEdit ? 'Lagre' : 'Opprett venue'}</button>
        </form>
    `);

    document.getElementById('btn-venue-add-eq').addEventListener('click', () => {
        const container = document.getElementById('vf-equipment');
        const div = document.createElement('div');
        div.className = 'flex gap-2 items-center venue-eq-row';
        div.innerHTML = `
            <input type="number" value="1" min="1" class="w-16 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm venue-eq-qty">
            <input type="text" placeholder="Utstyrsnavn..." class="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm venue-eq-name">
            <button type="button" onclick="this.closest('.venue-eq-row').remove()" class="text-neon-pink text-lg px-1 hover:text-neon-pink/70">&times;</button>
        `;
        container.appendChild(div);
        div.querySelector('.venue-eq-name').focus();
    });

    document.getElementById('venue-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('vf-name').value.trim();
        if (!name) return;

        const existingEquipment = [];
        document.querySelectorAll('#vf-equipment .venue-eq-row').forEach(row => {
            const eqName = row.querySelector('.venue-eq-name').value.trim();
            const qty = parseInt(row.querySelector('.venue-eq-qty').value) || 1;
            if (eqName) existingEquipment.push({ name: eqName, quantity: qty });
        });

        const data = {
            name,
            address: document.getElementById('vf-address').value.trim(),
            area: parseInt(document.getElementById('vf-area').value) || null,
            description: document.getElementById('vf-description').value.trim(),
            facilities: document.getElementById('vf-facilities').value.trim(),
            existingEquipment,
            notes: document.getElementById('vf-notes').value.trim(),
        };

        if (isEdit) {
            DB.updateVenue(venue.id, data);
            toast('Venue oppdatert', 'success');
        } else {
            DB.addVenue(data);
            toast('Venue opprettet', 'success');
        }
        closeModal();
        if (isEdit && App.currentVenueId === venue.id) {
            renderVenueDetail();
        } else {
            App.salesTab = 'venues';
            renderSales();
        }
    });
}

// ========================
// Event Equipment Toggles
// ========================

function toggleEventEq(eventId, index) {
    DB.toggleEventEquipment(eventId, index);
    renderEventDetail();
}

function toggleEventCon(eventId, index) {
    DB.toggleEventConsumable(eventId, index);
    renderEventDetail();
}

function deleteVenuePrompt(venueId) {
    const venue = DB.getVenue(venueId);
    if (!venue) return;
    openModal('Slett venue', `
        <p class="text-gray-300 mb-4">Er du sikker på at du vil slette <strong>${esc(venue.name)}</strong>?</p>
        <div class="flex gap-2">
            <button onclick="DB.deleteVenue('${venueId}'); closeModal(); App.salesTab='venues'; showView('sales'); toast('Venue slettet');" class="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors font-semibold">Slett</button>
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">Avbryt</button>
        </div>
    `);
}

// ========================
// Utility
// ========================

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========================
// Event Bindings
// ========================

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        stopCamera();
        App.scannerMode = null;
        showView(btn.dataset.view);
    });
});

document.getElementById('btn-add-product').addEventListener('click', () => showProductForm());
document.getElementById('search-products').addEventListener('input', renderProducts);
document.getElementById('btn-add-list').addEventListener('click', showPackingListForm);
document.getElementById('btn-back-lists').addEventListener('click', () => { App.packingTab = 'lists'; showView('packing'); });
document.getElementById('btn-add-list-item').addEventListener('click', showAddItemToListForm);
document.getElementById('btn-pack-box').addEventListener('click', showPackBoxFromList);
document.getElementById('btn-add-box').addEventListener('click', showBoxForm);
document.getElementById('btn-back-boxes').addEventListener('click', () => { App.packingTab = 'boxes'; showView('packing'); });
document.getElementById('btn-add-box-item').addEventListener('click', showAddItemToBoxForm);
document.getElementById('btn-print-box-label').addEventListener('click', printBoxLabel);
document.getElementById('btn-add-vehicle').addEventListener('click', showVehicleForm);
document.getElementById('btn-back-vehicle-profile').addEventListener('click', () => {
    App.currentVehicleProfileId = null;
    showView('vehicle');
});
document.getElementById('btn-report-fault').addEventListener('click', () => showReportFaultForm());
document.getElementById('btn-service-scan').addEventListener('click', serviceScan);
document.getElementById('btn-back-vehicle-load').addEventListener('click', () => {
    App.vehicleLoadListId = null;
    showView('vehicle');
});
document.getElementById('btn-vl-scan').addEventListener('click', () => {
    const input = document.getElementById('vl-barcode');
    const code = input.value.trim();
    if (code) {
        handleVehicleLoadScan(code);
        input.value = '';
        input.focus();
    }
});
document.getElementById('vl-barcode').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-vl-scan').click();
    }
});
document.getElementById('btn-start-camera').addEventListener('click', startCamera);
document.getElementById('btn-stop-camera').addEventListener('click', stopCamera);
document.getElementById('btn-scanner-quick').addEventListener('click', () => {
    App.scannerMode = null;
    showView('scanner');
    document.getElementById('scanner-context').innerHTML =
        '<span class="text-gray-300">Generelt søk</span> — Skann eller skriv inn strekkode for å finne produkt eller boks.';
});
document.getElementById('btn-manual-scan').addEventListener('click', () => {
    const input = document.getElementById('manual-barcode');
    const code = input.value.trim();
    if (code) {
        handleScan(code);
        input.value = '';
    }
});
document.getElementById('manual-barcode').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-manual-scan').click();
    }
});

// Packing tabs
document.querySelectorAll('.packing-tab').forEach(tab => {
    tab.addEventListener('click', () => switchPackingTab(tab.dataset.packingTab));
});

// Events
document.getElementById('btn-add-event').addEventListener('click', () => showEventForm());
document.getElementById('btn-back-events').addEventListener('click', () => { App.currentEventId = null; showView('events'); });
document.getElementById('btn-back-checkin').addEventListener('click', () => {
    if (App.currentEventId) showView('event-detail');
    else showView('events');
});

// Crew
document.getElementById('btn-add-user').addEventListener('click', () => showUserForm());

// Sales tabs
document.querySelectorAll('.sales-tab').forEach(tab => {
    tab.addEventListener('click', () => switchSalesTab(tab.dataset.salesTab));
});

// Customers
document.getElementById('btn-add-customer').addEventListener('click', () => showCustomerForm());
document.getElementById('btn-back-customers').addEventListener('click', () => { App.currentCustomerId = null; App.salesTab = 'customers'; showView('sales'); });

// Inquiries
document.getElementById('btn-back-inquiries').addEventListener('click', () => { App.currentInquiryId = null; App.salesTab = 'inquiries'; showView('sales'); });

// Offers
document.getElementById('btn-back-offers').addEventListener('click', () => { App.currentOfferId = null; App.salesTab = 'offers'; showView('sales'); });
document.getElementById('btn-back-offer-detail').addEventListener('click', () => {
    if (App.currentOfferId) showView('offer-editor');
    else { App.salesTab = 'offers'; showView('sales'); }
});

// Venues
document.getElementById('btn-add-venue').addEventListener('click', () => showVenueForm());
document.getElementById('btn-back-venues').addEventListener('click', () => { App.currentVenueId = null; App.salesTab = 'venues'; showView('sales'); });

// Contracts
document.getElementById('btn-add-contract').addEventListener('click', () => showContractForm());
document.getElementById('btn-back-contracts').addEventListener('click', () => { ContractApp.currentContractId = null; showView('sales'); });
document.getElementById('btn-back-contract-detail').addEventListener('click', () => {
    if (ContractApp.currentContractId) showView('contract-detail');
    else showView('sales');
});
document.getElementById('btn-back-vehicle-trip').addEventListener('click', () => {
    ContractApp.currentTripId = null;
    showView('vehicle');
});

// Import inquiry from URL parameter
function checkImportParam() {
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('import');
    if (!importData) return;

    try {
        const json = decodeURIComponent(escape(atob(importData)));
        const data = JSON.parse(json);

        const incomingEmail = data.contactEmail || '';
        const incomingCompany = data.companyName || '';

        const existingInquiry = DB.getInquiries().find(i =>
            i.source === 'admin-direct' &&
            i.contactEmail === incomingEmail &&
            i.companyName === incomingCompany
        );

        if (existingInquiry) {
            const updates = {
                contactName: data.contactName || existingInquiry.contactName || '',
                contactPhone: data.contactPhone || existingInquiry.contactPhone || '',
                dateFlexible: data.dateFlexible != null ? !!data.dateFlexible : existingInquiry.dateFlexible,
                desiredDate: data.desiredDate || existingInquiry.desiredDate || '',
                desiredTime: data.desiredTime || existingInquiry.desiredTime || '',
                desiredEndTime: data.desiredEndTime || existingInquiry.desiredEndTime || '',
                venueAddress: data.venueAddress || existingInquiry.venueAddress || '',
                venueSize: data.venueSize || existingInquiry.venueSize || '',
                venueInfo: data.venueInfo || existingInquiry.venueInfo || '',
                guests: data.guests || existingInquiry.guests || '',
                audience: data.audience || existingInquiry.audience || '',
                wishes: data.wishes || existingInquiry.wishes || '',
                source: 'admin-direct-completed',
            };
            if ((data.extraEvents || []).length > 0) {
                updates.events = (data.extraEvents || []).map(e => ({
                    date: e.date || '',
                    time: e.time || '',
                    endTime: e.endTime || '',
                    description: e.description || '',
                }));
            }
            DB.updateInquiry(existingInquiry.id, updates);

            window.history.replaceState({}, '', window.location.pathname);
            toast('Forespørsel oppdatert med kundeinfo!', 'success');
            App.currentInquiryId = existingInquiry.id;
            showView('inquiry-detail');
        } else {
            const inquiry = {
                type: data.type || 'company',
                companyName: data.companyName || '',
                orgNumber: data.orgNumber || '',
                orgForm: data.orgForm || '',
                address: data.address || '',
                privateName: data.privateName || '',
                contactName: data.contactName || '',
                contactPhone: data.contactPhone || '',
                contactEmail: data.contactEmail || '',
                dateFlexible: !!data.dateFlexible,
                desiredDate: data.desiredDate || '',
                desiredTime: data.desiredTime || '',
                desiredEndTime: data.desiredEndTime || '',
                venueAddress: data.venueAddress || '',
                venueSize: data.venueSize || '',
                venueInfo: data.venueInfo || '',
                guests: data.guests || '',
                audience: data.audience || '',
                wishes: data.wishes || '',
                events: (data.extraEvents || []).map(e => ({
                    date: e.date || '',
                    time: e.time || '',
                    endTime: e.endTime || '',
                    description: e.description || '',
                })),
            };

            DB.addInquiry(inquiry);

            window.history.replaceState({}, '', window.location.pathname);
            toast('Ny forespørsel importert!', 'success');
            App.salesTab = 'inquiries';
            showView('sales');
        }
    } catch (err) {
        toast('Kunne ikke importere forespørsel', 'error');
    }
}

// Initialize
renderDashboard();
checkImportParam();
