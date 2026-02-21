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
            vehicleServices: [],
            serviceReports: [],
            activityLog: [],
            nextProductBarcode: 1000,
            nextBoxBarcode: 1000,
            users: [],
            activeUserId: null,
            events: [],
            checkIns: [],
            issueReports: [],
            contracts: [],
            vehicleTrips: [],
            customers: [],
            venues: [],
            inquiries: [],
            offers: [],
            contractLibrary: [],
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
        if (!d.vehicleServices) {
            d.vehicleServices = [];
            this._save(d);
        }
        let changed = false;
        if (!d.users) { d.users = []; changed = true; }
        if (!d.activeUserId) { d.activeUserId = null; changed = true; }
        if (!d.events) { d.events = []; changed = true; }
        if (!d.checkIns) { d.checkIns = []; changed = true; }
        if (!d.issueReports) { d.issueReports = []; changed = true; }
        if (!d.contracts) { d.contracts = []; changed = true; }
        if (!d.vehicleTrips) { d.vehicleTrips = []; changed = true; }
        if (!d.customers) { d.customers = []; changed = true; }
        if (!d.venues) { d.venues = []; changed = true; }
        if (!d.inquiries) { d.inquiries = []; changed = true; }
        if (!d.offers) { d.offers = []; changed = true; }
        if (!d.contractLibrary) { d.contractLibrary = []; changed = true; }
        if (changed) this._save(d);
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

    getAlwaysIncludeProducts() {
        return this.data.products.filter(p => p.alwaysInclude);
    },

    getAlwaysIncludeBoxes() {
        return (this.data.boxes || []).filter(b => b.alwaysInclude);
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

    updateVehicle(id, updates) {
        const d = this.data;
        const vehicle = (d.vehicles || []).find(v => v.id === id);
        if (!vehicle) return null;
        Object.assign(vehicle, updates);
        this._save(d);
        this.logActivity(`Bil oppdatert: ${vehicle.name}`);
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
        d.vehicleServices = (d.vehicleServices || []).filter(s => s.vehicleId !== id);
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

    // --- Vehicle Services ---
    getVehicleServices(vehicleId) {
        return (this.data.vehicleServices || []).filter(s => s.vehicleId === vehicleId);
    },

    getVehicleService(id) {
        return (this.data.vehicleServices || []).find(s => s.id === id);
    },

    _recalcServiceDue(service) {
        if (service.completedAt) {
            if (service.nextIntervalKm && service.mileageAtService != null) {
                service.nextDueKm = service.mileageAtService + service.nextIntervalKm;
            }
            if (service.nextIntervalMonths) {
                const due = new Date(service.completedAt);
                due.setMonth(due.getMonth() + service.nextIntervalMonths);
                service.nextDueDate = due.toISOString().split('T')[0];
            }
        }
    },

    addVehicleService(service) {
        const d = this.data;
        if (!d.vehicleServices) d.vehicleServices = [];
        service.id = this.generateId();
        service.createdAt = new Date().toISOString();
        this._recalcServiceDue(service);
        d.vehicleServices.unshift(service);
        this._save(d);
        const vehicle = (d.vehicles || []).find(v => v.id === service.vehicleId);
        const label = service.completedAt ? 'Service registrert' : 'Kommende service lagt til';
        this.logActivity(`${label} for ${vehicle?.name || 'bil'}: ${service.name}`);
        return service;
    },

    updateVehicleService(id, updates) {
        const d = this.data;
        if (!d.vehicleServices) return null;
        const service = d.vehicleServices.find(s => s.id === id);
        if (!service) return null;
        Object.assign(service, updates);
        this._recalcServiceDue(service);
        this._save(d);
        return service;
    },

    completeVehicleService(id, completedAt, mileageAtService) {
        const d = this.data;
        if (!d.vehicleServices) return null;
        const service = d.vehicleServices.find(s => s.id === id);
        if (!service) return null;
        const hadInterval = !service.completedAt;
        service.completedAt = completedAt;
        service.mileageAtService = mileageAtService || null;
        if (hadInterval && service.nextDueKm && !service.nextIntervalKm && mileageAtService) {
            service.nextIntervalKm = service.nextDueKm - (service.mileageAtService || 0);
        }
        if (hadInterval && service.nextDueDate && !service.nextIntervalMonths) {
            const dueDate = new Date(service.nextDueDate);
            const compDate = new Date(completedAt);
            service.nextIntervalMonths = Math.max(1, Math.round((dueDate - compDate) / (1000 * 60 * 60 * 24 * 30)));
        }
        this._recalcServiceDue(service);
        this._save(d);
        const vehicle = (d.vehicles || []).find(v => v.id === service.vehicleId);
        this.logActivity(`Service utført for ${vehicle?.name || 'bil'}: ${service.name}`);
        return service;
    },

    deleteVehicleService(id) {
        const d = this.data;
        if (!d.vehicleServices) return;
        const service = d.vehicleServices.find(s => s.id === id);
        d.vehicleServices = d.vehicleServices.filter(s => s.id !== id);
        this._save(d);
        if (service) {
            const vehicle = (d.vehicles || []).find(v => v.id === service.vehicleId);
            this.logActivity(`Service slettet for ${vehicle?.name || 'bil'}: ${service.name}`);
        }
    },

    isServiceDue(service, vehicle) {
        const now = new Date();
        const currentMileage = vehicle?.mileage || 0;
        if (service.nextDueKm && currentMileage >= service.nextDueKm) return true;
        if (service.nextDueDate && new Date(service.nextDueDate) <= now) return true;
        return false;
    },

    getVehicleServicesDue(vehicleId) {
        const vehicle = this.getVehicle(vehicleId);
        const services = this.getVehicleServices(vehicleId);
        return services.filter(s => this.isServiceDue(s, vehicle));
    },

    getVehicleServicesUpcoming(vehicleId, thresholdKm = 1000, thresholdDays = 30) {
        const vehicle = this.getVehicle(vehicleId);
        const services = this.getVehicleServices(vehicleId);
        const now = new Date();
        const currentMileage = vehicle?.mileage || 0;
        const thresholdDate = new Date(now);
        thresholdDate.setDate(thresholdDate.getDate() + thresholdDays);
        return services.filter(s => {
            if (this.isServiceDue(s, vehicle)) return false;
            if (s.nextDueKm && (s.nextDueKm - currentMileage) <= thresholdKm) return true;
            if (s.nextDueDate && new Date(s.nextDueDate) <= thresholdDate) return true;
            return false;
        });
    },

    // --- Users ---
    getUsers() {
        return this.data.users || [];
    },

    getUser(id) {
        return (this.data.users || []).find(u => u.id === id);
    },

    getActiveUser() {
        const d = this.data;
        if (!d.activeUserId) return null;
        return (d.users || []).find(u => u.id === d.activeUserId) || null;
    },

    setActiveUser(id) {
        const d = this.data;
        d.activeUserId = id;
        this._save(d);
    },

    addUser(user) {
        const d = this.data;
        if (!d.users) d.users = [];
        user.id = this.generateId();
        user.createdAt = new Date().toISOString();
        d.users.push(user);
        if (!d.activeUserId) d.activeUserId = user.id;
        this._save(d);
        this.logActivity(`Bruker opprettet: ${user.name}`);
        return user;
    },

    updateUser(id, updates) {
        const d = this.data;
        const user = (d.users || []).find(u => u.id === id);
        if (!user) return null;
        Object.assign(user, updates);
        this._save(d);
        return user;
    },

    deleteUser(id) {
        const d = this.data;
        const user = (d.users || []).find(u => u.id === id);
        d.users = (d.users || []).filter(u => u.id !== id);
        if (d.activeUserId === id) {
            d.activeUserId = d.users.length > 0 ? d.users[0].id : null;
        }
        this._save(d);
        if (user) this.logActivity(`Bruker slettet: ${user.name}`);
    },

    // --- Events ---
    getEvents() {
        return this.data.events || [];
    },

    getEvent(id) {
        return (this.data.events || []).find(e => e.id === id);
    },

    getActiveEvents() {
        const now = new Date();
        return (this.data.events || []).filter(e => {
            if (e.status === 'active') return true;
            if (e.status === 'completed' || e.status === 'cancelled') return false;
            const start = new Date(e.startDate);
            const end = e.endDate ? new Date(e.endDate) : null;
            if (end) return now >= start && now <= end;
            return now.toDateString() === start.toDateString();
        });
    },

    getUpcomingEvents() {
        const now = new Date();
        return (this.data.events || []).filter(e => {
            if (e.status === 'completed' || e.status === 'cancelled') return false;
            return new Date(e.startDate) > now;
        }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    },

    addEvent(event) {
        const d = this.data;
        if (!d.events) d.events = [];
        event.id = this.generateId();
        event.status = event.status || 'upcoming';
        event.createdAt = new Date().toISOString();
        event.equipment = event.equipment || [];
        event.consumables = event.consumables || [];
        d.events.push(event);
        this._save(d);
        this.logActivity(`Arrangement opprettet: ${event.name}`);
        return event;
    },

    updateEvent(id, updates) {
        const d = this.data;
        const event = (d.events || []).find(e => e.id === id);
        if (!event) return null;
        Object.assign(event, updates);
        this._save(d);
        return event;
    },

    deleteEvent(id) {
        const d = this.data;
        const event = (d.events || []).find(e => e.id === id);
        d.events = (d.events || []).filter(e => e.id !== id);
        this._save(d);
        if (event) this.logActivity(`Arrangement slettet: ${event.name}`);
    },

    // --- Check-ins ---
    getCheckIns(eventId) {
        const all = this.data.checkIns || [];
        return eventId ? all.filter(c => c.eventId === eventId) : all;
    },

    getCheckIn(id) {
        return (this.data.checkIns || []).find(c => c.id === id);
    },

    getActiveCheckIn(userId) {
        return (this.data.checkIns || []).find(c => c.userId === userId && c.status === 'active');
    },

    getActiveCheckIns(eventId) {
        return (this.data.checkIns || []).filter(c =>
            c.status === 'active' && (!eventId || c.eventId === eventId)
        );
    },

    addCheckIn(checkIn) {
        const d = this.data;
        if (!d.checkIns) d.checkIns = [];
        checkIn.id = this.generateId();
        checkIn.status = 'active';
        checkIn.checkedInAt = new Date().toISOString();
        checkIn.checkedOutAt = null;
        checkIn.kmEnd = null;
        d.checkIns.push(checkIn);
        this._save(d);
        const user = this.getUser(checkIn.userId);
        const event = this.getEvent(checkIn.eventId);
        this.logActivity(`${user?.name || 'Ukjent'} sjekket inn på ${event?.name || 'arrangement'}`);
        return checkIn;
    },

    completeCheckIn(id, kmEnd, photoIdsEnd) {
        const d = this.data;
        const checkIn = (d.checkIns || []).find(c => c.id === id);
        if (!checkIn) return null;
        checkIn.status = 'completed';
        checkIn.checkedOutAt = new Date().toISOString();
        checkIn.kmEnd = kmEnd;
        if (photoIdsEnd) checkIn.photoIdsEnd = photoIdsEnd;
        this._save(d);
        const user = this.getUser(checkIn.userId);
        const event = this.getEvent(checkIn.eventId);
        this.logActivity(`${user?.name || 'Ukjent'} sjekket ut fra ${event?.name || 'arrangement'}`);
        return checkIn;
    },

    updateCheckIn(id, updates) {
        const d = this.data;
        const checkIn = (d.checkIns || []).find(c => c.id === id);
        if (!checkIn) return null;
        Object.assign(checkIn, updates);
        this._save(d);
        return checkIn;
    },

    deleteCheckIn(id) {
        const d = this.data;
        d.checkIns = (d.checkIns || []).filter(c => c.id !== id);
        this._save(d);
    },

    // --- Issue Reports (Event-based) ---
    getIssueReports(eventId) {
        const all = this.data.issueReports || [];
        return eventId ? all.filter(r => r.eventId === eventId) : all;
    },

    getIssueReport(id) {
        return (this.data.issueReports || []).find(r => r.id === id);
    },

    getOpenIssueReports(eventId) {
        return this.getIssueReports(eventId).filter(r => r.status !== 'resolved');
    },

    addIssueReport(report) {
        const d = this.data;
        if (!d.issueReports) d.issueReports = [];
        report.id = this.generateId();
        report.status = report.status || 'open';
        report.createdAt = new Date().toISOString();
        report.resolvedAt = null;
        d.issueReports.unshift(report);
        this._save(d);
        const user = this.getUser(report.userId);
        this.logActivity(`${user?.name || 'Ukjent'} meldte: ${report.title}`);
        return report;
    },

    updateIssueReport(id, updates) {
        const d = this.data;
        const report = (d.issueReports || []).find(r => r.id === id);
        if (!report) return null;
        Object.assign(report, updates);
        this._save(d);
        return report;
    },

    resolveIssueReport(id, resolvedByUserId) {
        const d = this.data;
        const report = (d.issueReports || []).find(r => r.id === id);
        if (!report) return null;
        report.status = 'resolved';
        report.resolvedAt = new Date().toISOString();
        report.resolvedBy = resolvedByUserId;
        this._save(d);
        const user = this.getUser(resolvedByUserId);
        this.logActivity(`${user?.name || 'Ukjent'} løste: ${report.title}`);
        return report;
    },

    deleteIssueReport(id) {
        const d = this.data;
        d.issueReports = (d.issueReports || []).filter(r => r.id !== id);
        this._save(d);
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

    // --- Contracts ---
    getContracts() {
        return this.data.contracts || [];
    },

    getContract(id) {
        return (this.data.contracts || []).find(c => c.id === id);
    },

    getUpcomingContracts() {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return (this.data.contracts || [])
            .filter(c => c.status !== 'completed' && c.status !== 'cancelled')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    addContract(contract) {
        const d = this.data;
        if (!d.contracts) d.contracts = [];
        contract.id = this.generateId();
        contract.status = contract.status || 'draft';
        contract.createdAt = new Date().toISOString();
        contract.equipment = contract.equipment || [];
        contract.consumables = contract.consumables || [];
        d.contracts.push(contract);
        this._save(d);
        this.logActivity(`Kontrakt opprettet: ${contract.clientName} – ${contract.venue}`);
        return contract;
    },

    updateContract(id, updates) {
        const d = this.data;
        const contract = (d.contracts || []).find(c => c.id === id);
        if (!contract) return null;
        Object.assign(contract, updates);
        this._save(d);
        return contract;
    },

    deleteContract(id) {
        const d = this.data;
        const contract = (d.contracts || []).find(c => c.id === id);
        d.contracts = (d.contracts || []).filter(c => c.id !== id);
        d.vehicleTrips = (d.vehicleTrips || []).map(t => {
            t.contractIds = (t.contractIds || []).filter(cid => cid !== id);
            return t;
        });
        this._save(d);
        if (contract) this.logActivity(`Kontrakt slettet: ${contract.clientName}`);
    },

    // --- Vehicle Trips ---
    getVehicleTrips(vehicleId) {
        const trips = this.data.vehicleTrips || [];
        return vehicleId ? trips.filter(t => t.vehicleId === vehicleId) : trips;
    },

    getVehicleTrip(id) {
        return (this.data.vehicleTrips || []).find(t => t.id === id);
    },

    getActiveTrip(vehicleId) {
        return (this.data.vehicleTrips || []).find(t =>
            t.vehicleId === vehicleId && (t.status === 'packing' || t.status === 'ready')
        );
    },

    addVehicleTrip(trip) {
        const d = this.data;
        if (!d.vehicleTrips) d.vehicleTrips = [];
        trip.id = this.generateId();
        trip.status = 'packing';
        trip.createdAt = new Date().toISOString();
        trip.packedItems = trip.packedItems || [];
        trip.consumableChecks = trip.consumableChecks || [];
        d.vehicleTrips.push(trip);
        this._save(d);
        const vehicle = this.getVehicle(trip.vehicleId);
        this.logActivity(`Tur planlagt for ${vehicle?.name || 'bil'}`);
        return trip;
    },

    updateVehicleTrip(id, updates) {
        const d = this.data;
        const trip = (d.vehicleTrips || []).find(t => t.id === id);
        if (!trip) return null;
        Object.assign(trip, updates);
        this._save(d);
        return trip;
    },

    toggleTripItem(tripId, itemIdx) {
        const d = this.data;
        const trip = (d.vehicleTrips || []).find(t => t.id === tripId);
        if (!trip || !trip.packedItems[itemIdx]) return;
        trip.packedItems[itemIdx].packed = !trip.packedItems[itemIdx].packed;
        this._save(d);
    },

    toggleTripConsumable(tripId, itemIdx) {
        const d = this.data;
        const trip = (d.vehicleTrips || []).find(t => t.id === tripId);
        if (!trip || !trip.consumableChecks[itemIdx]) return;
        trip.consumableChecks[itemIdx].checked = !trip.consumableChecks[itemIdx].checked;
        this._save(d);
    },

    deleteVehicleTrip(id) {
        const d = this.data;
        d.vehicleTrips = (d.vehicleTrips || []).filter(t => t.id !== id);
        this._save(d);
    },

    buildTripPackingList(contractIds, eventIds) {
        const merged = {};
        const consumables = {};

        const addSource = (equipment, consumableList, label) => {
            (equipment || []).forEach(eq => {
                const key = eq.name.toLowerCase().trim();
                const qty = eq.quantity || 1;
                if (merged[key]) {
                    merged[key].quantity = Math.max(merged[key].quantity, qty);
                    merged[key].sources.push(label);
                } else {
                    merged[key] = {
                        name: eq.name,
                        quantity: qty,
                        sources: [label],
                    };
                }
            });
            (consumableList || []).forEach(con => {
                const key = con.name.toLowerCase().trim();
                if (consumables[key]) {
                    consumables[key].quantity += (con.quantity || 0);
                } else {
                    consumables[key] = { name: con.name, quantity: con.quantity || 0 };
                }
            });
        };

        (contractIds || []).forEach(cid => {
            const contract = this.getContract(cid);
            if (!contract) return;
            addSource(contract.equipment, contract.consumables, contract.venue || contract.clientName);
        });

        (eventIds || []).forEach(eid => {
            const event = this.getEvent(eid);
            if (!event) return;
            addSource(event.equipment, event.consumables, event.name);
        });

        return {
            equipment: Object.values(merged).map(e => ({ ...e, packed: false })),
            consumables: Object.values(consumables).map(c => ({ ...c, checked: false })),
        };
    },

    // --- Customers ---
    getCustomers() {
        return this.data.customers || [];
    },

    getCustomer(id) {
        return (this.data.customers || []).find(c => c.id === id);
    },

    addCustomer(customer) {
        const d = this.data;
        if (!d.customers) d.customers = [];
        customer.id = this.generateId();
        customer.createdAt = new Date().toISOString();
        d.customers.push(customer);
        this._save(d);
        this.logActivity(`Kunde opprettet: ${customer.companyName || customer.contactName}`);
        return customer;
    },

    updateCustomer(id, updates) {
        const d = this.data;
        const customer = (d.customers || []).find(c => c.id === id);
        if (!customer) return null;
        Object.assign(customer, updates);
        this._save(d);
        return customer;
    },

    deleteCustomer(id) {
        const d = this.data;
        const customer = (d.customers || []).find(c => c.id === id);
        d.customers = (d.customers || []).filter(c => c.id !== id);
        this._save(d);
        if (customer) this.logActivity(`Kunde slettet: ${customer.companyName || customer.contactName}`);
    },

    // --- Venues ---
    getVenues() {
        return this.data.venues || [];
    },

    getVenue(id) {
        return (this.data.venues || []).find(v => v.id === id);
    },

    addVenue(venue) {
        const d = this.data;
        if (!d.venues) d.venues = [];
        venue.id = this.generateId();
        venue.createdAt = new Date().toISOString();
        venue.photoIds = venue.photoIds || [];
        venue.existingEquipment = venue.existingEquipment || [];
        d.venues.push(venue);
        this._save(d);
        this.logActivity(`Venue opprettet: ${venue.name}`);
        return venue;
    },

    updateVenue(id, updates) {
        const d = this.data;
        const venue = (d.venues || []).find(v => v.id === id);
        if (!venue) return null;
        Object.assign(venue, updates);
        this._save(d);
        return venue;
    },

    deleteVenue(id) {
        const d = this.data;
        const venue = (d.venues || []).find(v => v.id === id);
        d.venues = (d.venues || []).filter(v => v.id !== id);
        this._save(d);
        if (venue) this.logActivity(`Venue slettet: ${venue.name}`);
    },

    // --- Event Equipment Toggle ---
    toggleEventEquipment(eventId, eqIndex) {
        const d = this.data;
        const event = (d.events || []).find(e => e.id === eventId);
        if (!event || !event.equipment[eqIndex]) return;
        event.equipment[eqIndex].packed = !event.equipment[eqIndex].packed;
        this._save(d);
    },

    toggleEventConsumable(eventId, conIndex) {
        const d = this.data;
        const event = (d.events || []).find(e => e.id === eventId);
        if (!event || !event.consumables[conIndex]) return;
        event.consumables[conIndex].checked = !event.consumables[conIndex].checked;
        this._save(d);
    },

    // --- Inquiries (Forespørsler) ---
    getInquiries() {
        return this.data.inquiries || [];
    },

    getInquiry(id) {
        return (this.data.inquiries || []).find(i => i.id === id);
    },

    getNewInquiriesCount() {
        return (this.data.inquiries || []).filter(i => i.status === 'new').length;
    },

    addInquiry(inquiry) {
        const d = this.data;
        if (!d.inquiries) d.inquiries = [];
        inquiry.id = this.generateId();
        inquiry.status = inquiry.status || 'new';
        inquiry.createdAt = new Date().toISOString();
        inquiry.events = inquiry.events || [];
        d.inquiries.push(inquiry);
        this._save(d);
        const label = inquiry.companyName || inquiry.contactName || 'Ukjent';
        this.logActivity(`Ny forespørsel fra ${label}`);
        return inquiry;
    },

    updateInquiry(id, updates) {
        const d = this.data;
        const inquiry = (d.inquiries || []).find(i => i.id === id);
        if (!inquiry) return null;
        Object.assign(inquiry, updates);
        this._save(d);
        return inquiry;
    },

    deleteInquiry(id) {
        const d = this.data;
        const inquiry = (d.inquiries || []).find(i => i.id === id);
        d.inquiries = (d.inquiries || []).filter(i => i.id !== id);
        this._save(d);
        if (inquiry) this.logActivity(`Forespørsel slettet`);
    },

    // --- Offers (Tilbud) ---
    getOffers() {
        return this.data.offers || [];
    },

    getOffer(id) {
        return (this.data.offers || []).find(o => o.id === id);
    },

    addOffer(offer) {
        const d = this.data;
        if (!d.offers) d.offers = [];
        offer.id = this.generateId();
        offer.status = offer.status || 'draft';
        offer.createdAt = new Date().toISOString();
        offer.events = offer.events || [];
        d.offers.push(offer);
        this._save(d);
        this.logActivity(`Tilbud opprettet`);
        return offer;
    },

    updateOffer(id, updates) {
        const d = this.data;
        const offer = (d.offers || []).find(o => o.id === id);
        if (!offer) return null;
        Object.assign(offer, updates);
        this._save(d);
        return offer;
    },

    deleteOffer(id) {
        const d = this.data;
        const offer = (d.offers || []).find(o => o.id === id);
        d.offers = (d.offers || []).filter(o => o.id !== id);
        this._save(d);
        if (offer) this.logActivity(`Tilbud slettet`);
    },

    acceptOffer(id) {
        const d = this.data;
        const offer = (d.offers || []).find(o => o.id === id);
        if (!offer) return null;
        offer.status = 'accepted';
        const inquiry = offer.inquiryId ? (d.inquiries || []).find(i => i.id === offer.inquiryId) : null;
        if (inquiry) inquiry.status = 'accepted';
        this._save(d);
        this.logActivity(`Tilbud akseptert`);
        return offer;
    },

    generateContractFromOffer(offerId) {
        const offer = this.getOffer(offerId);
        if (!offer) return null;
        const inquiry = offer.inquiryId ? this.getInquiry(offer.inquiryId) : null;
        const customer = offer.customerId ? this.getCustomer(offer.customerId) : null;

        const allServices = [];
        const allConsumables = [];
        const allEquipment = [];
        (offer.events || []).forEach(ev => {
            (ev.services || []).forEach(s => allServices.push(s));
            (ev.consumables || []).forEach(c => allConsumables.push(c));
            (ev.equipmentRental || []).forEach(e => allEquipment.push(e));
        });

        const contract = {
            offerId,
            inquiryId: offer.inquiryId || null,
            clientName: customer?.companyName || customer?.contactName || inquiry?.companyName || inquiry?.contactName || '',
            clientAddress: customer?.address || inquiry?.address || '',
            clientContact: customer?.contactName || inquiry?.contactName || '',
            clientPhone: customer?.contactPhone || inquiry?.contactPhone || '',
            clientEmail: customer?.contactEmail || inquiry?.contactEmail || '',
            date: (offer.events && offer.events[0]?.date) || new Date().toISOString().split('T')[0],
            venue: inquiry?.venueInfo || '',
            venueAddress: '',
            honorar: offer.priceMode === 'total' ? (offer.totalPrice || '') : '',
            honorarNote: offer.priceMode === 'per-event' ? 'Pris per arrangement, se vedlegg' : '',
            paymentTerms: '14 dager',
            equipment: allEquipment.map(e => ({ name: e.name, quantity: e.quantity || 1 })),
            consumables: allConsumables.map(c => ({ name: c.name, quantity: c.quantity || 1 })),
            services: allServices.map(s => ({ name: s.name, quantity: s.quantity || 1, unitPrice: s.unitPrice || 0 })),
            travelers: 0,
            rooms: 0,
            powerCourses: 0,
            soundSystem: false,
            notes: offer.notes || '',
            totalPrice: offer.totalPrice || '',
            priceMode: offer.priceMode || 'total',
            offerEvents: offer.events || [],
        };
        return this.addContract(contract);
    },

    // --- Contract Library ---
    getContractLibrary(type) {
        const lib = this.data.contractLibrary || [];
        return type ? lib.filter(i => i.type === type) : lib;
    },

    addLibraryItem(item) {
        const d = this.data;
        if (!d.contractLibrary) d.contractLibrary = [];
        const existing = d.contractLibrary.find(i =>
            i.type === item.type && i.name.toLowerCase().trim() === item.name.toLowerCase().trim()
        );
        if (existing) return existing;
        item.id = this.generateId();
        item.createdAt = new Date().toISOString();
        d.contractLibrary.push(item);
        this._save(d);
        return item;
    },

    updateLibraryItem(id, updates) {
        const d = this.data;
        const item = (d.contractLibrary || []).find(i => i.id === id);
        if (!item) return null;
        Object.assign(item, updates);
        this._save(d);
        return item;
    },

    deleteLibraryItem(id) {
        const d = this.data;
        d.contractLibrary = (d.contractLibrary || []).filter(i => i.id !== id);
        this._save(d);
    },

    ensureLibraryItems(items, type) {
        items.forEach(item => {
            if (item.name && item.name.trim()) {
                this.addLibraryItem({ type, name: item.name.trim(), defaultQty: item.quantity || 1 });
            }
        });
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
