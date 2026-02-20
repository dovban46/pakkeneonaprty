// ========================
// App State & Navigation
// ========================

const App = {
    currentView: 'dashboard',
    currentListId: null,
    currentBoxId: null,
    scannerMode: null, // 'vehicle-in', 'vehicle-out', 'add-to-list', 'add-to-box', 'report-fault', null
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

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'products') renderProducts();
    if (viewName === 'lists') renderPackingLists();
    if (viewName === 'boxes') renderBoxes();
    if (viewName === 'vehicle') renderVehicle();
    if (viewName === 'service') renderService();
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
    document.getElementById('stat-products').textContent = DB.getProducts().length;
    document.getElementById('stat-lists').textContent = DB.getPackingLists().length;
    document.getElementById('stat-boxes').textContent = DB.getBoxes().length;
    document.getElementById('stat-vehicle').textContent = DB.getAllVehicleItemCount();

    const pendingCount = DB.getPendingServiceCount();
    const alertEl = document.getElementById('dashboard-service-alert');
    const alertText = document.getElementById('dashboard-service-text');
    if (pendingCount > 0) {
        alertEl.classList.remove('hidden');
        alertText.textContent = `${pendingCount} produkt${pendingCount > 1 ? 'er' : ''} trenger service`;
    } else {
        alertEl.classList.add('hidden');
    }

    updateServiceBadge();

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
                    <div class="font-semibold truncate">${esc(p.name)}</div>
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
    openModal('Ny pakkeliste', `
        <form id="list-form" class="space-y-4">
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
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Opprett liste</button>
        </form>
    `);

    document.getElementById('lf-date').valueAsDate = new Date();

    document.getElementById('list-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('lf-name').value.trim();
        if (!name) return toast('Navn er påkrevd', 'error');
        DB.addPackingList({
            name,
            jobName: document.getElementById('lf-job').value.trim(),
            date: document.getElementById('lf-date').value,
        });
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
    if (!list) return showView('lists');

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
                    <div class="font-semibold">${esc(box.name)}</div>
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
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Opprett boks</button>
        </form>
    `);

    document.getElementById('box-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('bf-name').value.trim();
        if (!name) return toast('Navn er påkrevd', 'error');
        const box = DB.addBox({ name });
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

function renderBoxDetail() {
    const box = DB.getBox(App.currentBoxId);
    if (!box) return showView('boxes');

    document.getElementById('box-detail-name').textContent = box.name;

    const container = document.getElementById('box-items');
    if (box.items.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-gray-500">
            <p>Boksen er tom</p>
            <p class="text-sm mt-1">Trykk + for å legge til produkter</p>
        </div>`;
    } else {
        container.innerHTML = `
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
        const isActive = v.id === activeId;
        const hasItems = count > 0;
        let cls = 'shrink-0 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer';
        if (isActive) {
            cls += ' bg-neon-blue/20 text-neon-blue border-neon-blue/40';
        } else if (hasItems) {
            cls += ' bg-dark-700 text-gray-200 border-dark-500 hover:border-neon-blue/30';
        } else {
            cls += ' bg-dark-700 text-gray-500 border-dark-600 hover:border-dark-500';
        }
        const badge = hasItems ? ` <span class="text-xs opacity-70 ml-0.5">(${count})</span>` : '';
        return `<button class="${cls}" onclick="selectVehicle('${v.id}')">${esc(v.name)}${badge}</button>`;
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

    contentEl.innerHTML = `
        <div class="flex items-center justify-between">
            <h3 class="font-semibold text-lg">${esc(vehicle.name)}</h3>
            <div class="flex gap-1">
                <button onclick="renameVehiclePrompt('${vehicle.id}')" class="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors" title="Gi nytt navn">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onclick="deleteVehiclePrompt('${vehicle.id}')" class="p-1.5 rounded-lg bg-dark-700 hover:bg-red-900/30 transition-colors text-gray-400 hover:text-red-400" title="Slett bil">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
        </div>
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
                    <label class="block text-sm text-gray-400 mb-1">Navn på ny bil</label>
                    <input type="text" id="vf-name" placeholder="f.eks. Sprinter, Henger, Personbil..." class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
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
        const vehicle = DB.addVehicle({ name });
        DB.setActiveVehicle(vehicle.id);
        closeModal();
        renderVehicle();
        toast('Bil opprettet', 'success');
    });
}

function renameVehiclePrompt(id) {
    const vehicle = DB.getVehicle(id);
    if (!vehicle) return;
    openModal('Gi nytt navn', `
        <form id="rename-vehicle-form" class="space-y-4">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Nytt navn</label>
                <input type="text" id="rv-name" value="${esc(vehicle.name)}" class="w-full border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none" required>
            </div>
            <button type="submit" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Lagre</button>
        </form>
    `);

    document.getElementById('rename-vehicle-form').addEventListener('submit', e => {
        e.preventDefault();
        const newName = document.getElementById('rv-name').value.trim();
        if (!newName) return toast('Navn er påkrevd', 'error');
        DB.renameVehicle(id, newName);
        closeModal();
        renderVehicle();
        toast('Bil omdøpt', 'success');
    });
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
        renderVehicle();
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
document.getElementById('btn-back-lists').addEventListener('click', () => showView('lists'));
document.getElementById('btn-add-list-item').addEventListener('click', showAddItemToListForm);
document.getElementById('btn-pack-box').addEventListener('click', showPackBoxFromList);
document.getElementById('btn-add-box').addEventListener('click', showBoxForm);
document.getElementById('btn-back-boxes').addEventListener('click', () => showView('boxes'));
document.getElementById('btn-add-box-item').addEventListener('click', showAddItemToBoxForm);
document.getElementById('btn-print-box-label').addEventListener('click', printBoxLabel);
document.getElementById('btn-add-vehicle').addEventListener('click', showVehicleForm);
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

// Initialize
renderDashboard();
