const DB = {
    _key: 'neonparty_pakking',

    _load() {
        try {
            const raw = localStorage.getItem(this._key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    _save(data) {
        localStorage.setItem(this._key, JSON.stringify(data));
    },

    _default() {
        return {
            products: [],
            packingLists: [],
            boxes: [],
            vehicles: [],
            activeVehicleId: null,
            vehicleItems: [],
            vehicleLog: [],
            serviceReports: [],
            activityLog: [],
            nextProductBarcode: 1000,
            nextBoxBarcode: 1000,
        };
    },

    init() {
        let d = this._load();
        if (!d) {
            this._save(this._default());
            return;
        }
        if (!d.vehicles) {
            d.vehicles = [];
            d.activeVehicleId = null;
            if (d.vehicleItems && d.vehicleItems.length > 0) {
                const defaultVehicle = {
                    id: this.generateId(),
                    name: 'Bil 1',
                    createdAt: new Date().toISOString(),
                };
                d.vehicles.push(defaultVehicle);
                d.activeVehicleId = defaultVehicle.id;
                d.vehicleItems.forEach(item => { item.vehicleId = defaultVehicle.id; });
                d.vehicleLog.forEach(entry => { entry.vehicleId = defaultVehicle.id; });
            }
            this._save(d);
        }
        if (!d.serviceReports) {
            d.serviceReports = [];
            this._save(d);
        }
    },

    get data() {
        return this._load() || this._default();
    },

    generateBarcode(type = 'product') {
        const d = this.data;
        // Migrate old single counter if present
        if (d.nextBarcode && !d.nextProductBarcode) {
            d.nextProductBarcode = d.nextBarcode;
            d.nextBoxBarcode = d.nextBarcode;
            delete d.nextBarcode;
        }
        let code;
        if (type === 'box') {
            code = `BX${String(d.nextBoxBarcode).padStart(6, '0')}`;
            d.nextBoxBarcode++;
        } else {
            code = `PR${String(d.nextProductBarcode).padStart(6, '0')}`;
            d.nextProductBarcode++;
        }
        this._save(d);
        return code;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },

    // --- Products ---
    getProducts() {
        return this.data.products;
    },

    getProduct(id) {
        return this.data.products.find(p => p.id === id);
    },

    getProductByBarcode(barcode) {
        return this.data.products.find(p => p.barcode === barcode);
    },

    addProduct(product) {
        product.id = this.generateId();
        product.barcode = product.barcode || this.generateBarcode('product');
        product.createdAt = new Date().toISOString();
        const d = this.data;
        d.products.push(product);
        this._save(d);
        this.logActivity(`Produkt opprettet: ${product.name}`);
        return product;
    },

    updateProduct(id, updates) {
        const d = this.data;
        const idx = d.products.findIndex(p => p.id === id);
        if (idx === -1) return null;
        Object.assign(d.products[idx], updates);
        this._save(d);
        return d.products[idx];
    },

    deleteProduct(id) {
        const d = this.data;
        const product = d.products.find(p => p.id === id);
        d.products = d.products.filter(p => p.id !== id);
        this._save(d);
        if (product) this.logActivity(`Produkt slettet: ${product.name}`);
    },

    // --- Packing Lists ---
    getPackingLists() {
        return this.data.packingLists;
    },

    getPackingList(id) {
        return this.data.packingLists.find(l => l.id === id);
    },

    addPackingList(list) {
        const d = this.data;
        list.id = this.generateId();
        list.createdAt = new Date().toISOString();
        list.items = list.items || [];
        d.packingLists.push(list);
        this._save(d);
        this.logActivity(`Pakkeliste opprettet: ${list.name}`);
        return list;
    },

    updatePackingList(id, updates) {
        const d = this.data;
        const idx = d.packingLists.findIndex(l => l.id === id);
        if (idx === -1) return null;
        Object.assign(d.packingLists[idx], updates);
        this._save(d);
        return d.packingLists[idx];
    },

    deletePackingList(id) {
        const d = this.data;
        const list = d.packingLists.find(l => l.id === id);
        d.packingLists = d.packingLists.filter(l => l.id !== id);
        this._save(d);
        if (list) this.logActivity(`Pakkeliste slettet: ${list.name}`);
    },

    addItemToList(listId, item) {
        const d = this.data;
        const list = d.packingLists.find(l => l.id === listId);
        if (!list) return null;
        item.id = this.generateId();
        item.packed = false;
        list.items.push(item);
        this._save(d);
        return item;
    },

    toggleListItem(listId, itemId) {
        const d = this.data;
        const list = d.packingLists.find(l => l.id === listId);
        if (!list) return;
        const item = list.items.find(i => i.id === itemId);
        if (item) item.packed = !item.packed;
        this._save(d);
    },

    removeItemFromList(listId, itemId) {
        const d = this.data;
        const list = d.packingLists.find(l => l.id === listId);
        if (!list) return;
        list.items = list.items.filter(i => i.id !== itemId);
        this._save(d);
    },

    // --- Boxes ---
    getBoxes() {
        return this.data.boxes;
    },

    getBox(id) {
        return this.data.boxes.find(b => b.id === id);
    },

    getBoxByBarcode(barcode) {
        return this.data.boxes.find(b => b.barcode === barcode);
    },

    addBox(box) {
        box.id = this.generateId();
        box.barcode = box.barcode || this.generateBarcode('box');
        box.createdAt = new Date().toISOString();
        box.items = box.items || [];
        const d = this.data;
        d.boxes.push(box);
        this._save(d);
        this.logActivity(`Boks opprettet: ${box.name}`);
        return box;
    },

    updateBox(id, updates) {
        const d = this.data;
        const idx = d.boxes.findIndex(b => b.id === id);
        if (idx === -1) return null;
        Object.assign(d.boxes[idx], updates);
        this._save(d);
        return d.boxes[idx];
    },

    deleteBox(id) {
        const d = this.data;
        const box = d.boxes.find(b => b.id === id);
        d.boxes = d.boxes.filter(b => b.id !== id);
        this._save(d);
        if (box) this.logActivity(`Boks slettet: ${box.name}`);
    },

    addItemToBox(boxId, item) {
        const d = this.data;
        const box = d.boxes.find(b => b.id === boxId);
        if (!box) return null;
        item.id = this.generateId();
        box.items.push(item);
        this._save(d);
        return item;
    },

    removeItemFromBox(boxId, itemId) {
        const d = this.data;
        const box = d.boxes.find(b => b.id === boxId);
        if (!box) return;
        box.items = box.items.filter(i => i.id !== itemId);
        this._save(d);
    },

    // --- Vehicles ---
    getVehicles() {
        return this.data.vehicles || [];
    },

    getVehicle(id) {
        return (this.data.vehicles || []).find(v => v.id === id);
    },

    addVehicle(vehicle) {
        const d = this.data;
        if (!d.vehicles) d.vehicles = [];
        vehicle.id = this.generateId();
        vehicle.createdAt = new Date().toISOString();
        d.vehicles.push(vehicle);
        if (!d.activeVehicleId) d.activeVehicleId = vehicle.id;
        this._save(d);
        this.logActivity(`Bil opprettet: ${vehicle.name}`);
        return vehicle;
    },

    renameVehicle(id, newName) {
        const d = this.data;
        const vehicle = (d.vehicles || []).find(v => v.id === id);
        if (vehicle) {
            vehicle.name = newName;
            this._save(d);
        }
        return vehicle;
    },

    deleteVehicle(id) {
        const d = this.data;
        const vehicle = (d.vehicles || []).find(v => v.id === id);
        d.vehicles = (d.vehicles || []).filter(v => v.id !== id);
        d.vehicleItems = (d.vehicleItems || []).filter(i => i.vehicleId !== id);
        d.vehicleLog = (d.vehicleLog || []).filter(l => l.vehicleId !== id);
        if (d.activeVehicleId === id) {
            d.activeVehicleId = d.vehicles.length > 0 ? d.vehicles[0].id : null;
        }
        this._save(d);
        if (vehicle) this.logActivity(`Bil slettet: ${vehicle.name}`);
    },

    getActiveVehicleId() {
        return this.data.activeVehicleId;
    },

    setActiveVehicle(id) {
        const d = this.data;
        d.activeVehicleId = id;
        this._save(d);
    },

    getVehicleItemCount(vehicleId) {
        return (this.data.vehicleItems || []).filter(i => i.vehicleId === vehicleId).length;
    },

    getAllVehicleItemCount() {
        return (this.data.vehicleItems || []).length;
    },

    // --- Vehicle Items & Log ---
    getVehicleItems(vehicleId) {
        const vid = vehicleId || this.data.activeVehicleId;
        return (this.data.vehicleItems || []).filter(i => i.vehicleId === vid);
    },

    vehicleIn(item) {
        const d = this.data;
        const vid = d.activeVehicleId;
        if (!vid) return;
        const existing = d.vehicleItems.find(v =>
            v.vehicleId === vid && v.type === item.type && v.refId === item.refId
        );
        if (existing) {
            existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
        } else {
            item.id = this.generateId();
            item.vehicleId = vid;
            item.loadedAt = new Date().toISOString();
            d.vehicleItems.push(item);
        }
        d.vehicleLog.unshift({
            id: this.generateId(),
            vehicleId: vid,
            action: 'in',
            item: { ...item },
            timestamp: new Date().toISOString(),
        });
        this._save(d);
        const vehicle = (d.vehicles || []).find(v => v.id === vid);
        this.logActivity(`Lastet inn i ${vehicle?.name || 'bil'}: ${item.name}`);
    },

    vehicleOut(vehicleItemId) {
        const d = this.data;
        const item = d.vehicleItems.find(v => v.id === vehicleItemId);
        if (!item) return;
        const vid = item.vehicleId;
        d.vehicleItems = d.vehicleItems.filter(v => v.id !== vehicleItemId);
        d.vehicleLog.unshift({
            id: this.generateId(),
            vehicleId: vid,
            action: 'out',
            item: { ...item },
            timestamp: new Date().toISOString(),
        });
        this._save(d);
        const vehicle = (d.vehicles || []).find(v => v.id === vid);
        this.logActivity(`Lastet ut av ${vehicle?.name || 'bil'}: ${item.name}`);
    },

    getVehicleLog(vehicleId) {
        const vid = vehicleId || this.data.activeVehicleId;
        return (this.data.vehicleLog || []).filter(l => l.vehicleId === vid);
    },

    // --- Service Reports ---
    getServiceReports() {
        return this.data.serviceReports || [];
    },

    getServiceReport(id) {
        return (this.data.serviceReports || []).find(r => r.id === id);
    },

    getPendingServiceCount() {
        return (this.data.serviceReports || []).filter(r => r.status === 'pending').length;
    },

    addServiceReport(report) {
        const d = this.data;
        if (!d.serviceReports) d.serviceReports = [];
        report.id = this.generateId();
        report.status = 'pending';
        report.createdAt = new Date().toISOString();
        report.resolvedAt = null;
        report.removedFromBox = false;
        d.serviceReports.unshift(report);
        this._save(d);
        this.logActivity(`Feil meldt: ${report.productName}`);
        return report;
    },

    resolveServiceReport(id, resolution, removeFromBox = false) {
        const d = this.data;
        if (!d.serviceReports) return null;
        const report = d.serviceReports.find(r => r.id === id);
        if (!report) return null;
        report.status = resolution;
        report.resolvedAt = new Date().toISOString();
        report.removedFromBox = removeFromBox;

        if (resolution === 'destroyed' && removeFromBox && report.boxId) {
            const box = d.boxes.find(b => b.id === report.boxId);
            if (box) {
                const boxItem = box.items.find(i => i.productId === report.productId);
                if (boxItem) {
                    boxItem.quantity = (boxItem.quantity || 1) - 1;
                    if (boxItem.quantity <= 0) {
                        box.items = box.items.filter(i => i.id !== boxItem.id);
                    }
                }
            }
        }

        this._save(d);
        if (resolution === 'repaired') {
            this.logActivity(`Reparert: ${report.productName}`);
        } else {
            this.logActivity(`Ødelagt${removeFromBox ? ' (tatt ut av boks)' : ''}: ${report.productName}`);
        }
        return report;
    },

    // --- Activity Log ---
    logActivity(message) {
        const d = this.data;
        d.activityLog.unshift({
            message,
            timestamp: new Date().toISOString(),
        });
        if (d.activityLog.length > 50) d.activityLog = d.activityLog.slice(0, 50);
        this._save(d);
    },

    getActivityLog() {
        return this.data.activityLog;
    },

    // --- Search ---
    findByBarcode(barcode) {
        const product = this.getProductByBarcode(barcode);
        if (product) return { type: 'product', data: product };
        const box = this.getBoxByBarcode(barcode);
        if (box) return { type: 'box', data: box };
        return null;
    },
};

DB.init();
