const PhotoDB = {
    _dbName: 'neonparty_photos',
    _storeName: 'photos',
    _version: 1,
    _db: null,

    async open() {
        if (this._db) return this._db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this._dbName, this._version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this._storeName)) {
                    db.createObjectStore(this._storeName, { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => {
                this._db = e.target.result;
                resolve(this._db);
            };
            request.onerror = () => reject(request.error);
        });
    },

    async save(id, dataUrl) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this._storeName, 'readwrite');
            tx.objectStore(this._storeName).put({ id, data: dataUrl, createdAt: new Date().toISOString() });
            tx.oncomplete = () => resolve(id);
            tx.onerror = () => reject(tx.error);
        });
    },

    async get(id) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this._storeName, 'readonly');
            const request = tx.objectStore(this._storeName).get(id);
            request.onsuccess = () => resolve(request.result?.data || null);
            request.onerror = () => reject(request.error);
        });
    },

    async getMultiple(ids) {
        if (!ids || ids.length === 0) return [];
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this._storeName, 'readonly');
            const store = tx.objectStore(this._storeName);
            const results = [];
            let completed = 0;
            ids.forEach((id, idx) => {
                const req = store.get(id);
                req.onsuccess = () => {
                    results[idx] = req.result?.data || null;
                    completed++;
                    if (completed === ids.length) resolve(results);
                };
                req.onerror = () => {
                    results[idx] = null;
                    completed++;
                    if (completed === ids.length) resolve(results);
                };
            });
        });
    },

    async delete(id) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this._storeName, 'readwrite');
            tx.objectStore(this._storeName).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async deleteMultiple(ids) {
        if (!ids || ids.length === 0) return;
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this._storeName, 'readwrite');
            const store = tx.objectStore(this._storeName);
            ids.forEach(id => store.delete(id));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    resizeAndCompress(file, maxWidth = 1200, quality = 0.7) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > maxWidth) {
                        h = Math.round(h * maxWidth / w);
                        w = maxWidth;
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    async saveFromFile(file) {
        const dataUrl = await this.resizeAndCompress(file);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        await this.save(id, dataUrl);
        return id;
    },

    async saveFromCapture(dataUrl) {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        await this.save(id, dataUrl);
        return id;
    }
};
