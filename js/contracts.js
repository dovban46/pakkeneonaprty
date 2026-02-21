// ========================
// Contracts System
// ========================

const ContractApp = {
    currentContractId: null,
    currentTripId: null,
};

const CONTRACT_TERMS = `Denne avtalen er inngått mellom Neonparty AS, heretter benevnt som "Leverandør", og kontrahent, heretter benevnt som "Arrangør", og gjelder levering av avtalt konsept, teknisk produksjon, utstyr, dekor, effekter og tilhørende personell i forbindelse med arrangement som nevnt på første side i kontrakten. Oppmøtetid for innrigg, arrangementsstart og avslutning følger av bestilling, korrespondanse eller vedlagt produksjonsplan og anses som en integrert del av avtalen.

Avtalen er å anse som en skriftlig bekreftelse på en tidligere inngått muntlig eller skriftlig avtale mellom partene. Avtalens gyldighet er ikke betinget av returnert underskrift fra Arrangør, og eventuelle innsigelser til kontraktens innhold må fremsettes skriftlig senest syv (7) dager etter utsendelse. Dersom innsigelser ikke foreligger innen fristen, anses avtalen som akseptert i sin helhet. Leveransen anses oppfylt når arrangementet er gjennomført helt eller delvis i tråd med avtalt oppdrag.

Arrangør plikter å stille med minimum to (2) tilgjengelige og dedikerte personer til praktisk bistand i forbindelse med arrangementets gjennomføring. Bistanden skal omfatte utlasting fra kjøretøy ved ankomst, bæring av utstyr inn i lokalet, oppsett og dekorering før arrangementsstart, samt nedrigg, rydding, nedpakking og tilbakeføring av utstyr til kjøretøy umiddelbart etter arrangementets avslutning. Personellet skal være tilgjengelig fra Leverandørs ankomst og frem til innrigg er fullført, samt fra arrangementsslutt og frem til alt utstyr er ferdig lastet og klart for avreise. Dersom personell ikke møter, møter forsinket, eller forlater arbeidet før oppgavene er fullført, faktureres Arrangør et tillegg på kr. 2.500,- per person per fase, gjeldende både for innrigg og utrigg.

Kost og losji dekkes av Arrangør i henhold til spesifikasjoner i vedlagt rider, som anses som en integrert del av avtalen. Fra Leverandørs ankomst til arrangementsstedet og frem til avreise skal det være tilgjengelig fri tilgang til alkoholfri drikke samt mat/servering til Leverandørs crew og personell.

Arrangør er fullt ut ansvarlig for sikkerheten knyttet til arrangementets gjennomføring, herunder publikumsavvikling, vakthold og generelt tilsyn med lokaler og tekniske installasjoner, og er videre ansvarlig for at Leverandørs personell til enhver tid kan utføre sitt arbeid under forsvarlige og trygge forhold. Arrangør er økonomisk og juridisk ansvarlig for Leverandørs tekniske utstyr, dekor, installasjoner og øvrig materiell som bringes til arrangementet, og dette ansvaret gjelder fra utstyret ankommer arrangementsstedet, under innrigg, gjennom hele arrangementets varighet, under nedrigg, samt frem til utstyret er ferdig lastet og har forlatt lokasjonen. Ansvarsforholdet omfatter også perioder hvor utstyr står lagret, montert eller etterlatt på arrangementsstedet, herunder over natten eller over flere dager, uavhengig av om Leverandørs personell er fysisk til stede eller ikke. Arrangør er ansvarlig for at eventuelle skader, tap, tyveri eller hærverk som rammer Leverandørs utstyr dekkes i sin helhet, og dersom skade eller tap ikke dekkes av Arrangørs forsikringsordninger, forplikter Arrangør seg til å dekke Leverandørs dokumenterte økonomiske tap fullt ut.

Arrangør er selv fullt ut ansvarlig for å inneha og innhente alle nødvendige tillatelser, godkjenninger og lisenser som kreves for arrangementets gjennomføring, herunder, men ikke begrenset til, godkjenninger fra offentlige myndigheter, politi, brannvesen, grunneier og rettighetsorganisasjoner som TONO eller tilsvarende. Leverandør opptrer utelukkende som bookingselskap og/eller leverandør av konsept og tekniske tjenester, og tar verken stilling til eller ansvar for hvilke tillatelser som kreves i det enkelte tilfelle. Ethvert ansvar, økonomisk eller juridisk, som følger av manglende godkjenninger eller tillatelser bæres i sin helhet av Arrangør.

Leverandør kan ikke holdes økonomisk ansvarlig eller trekkes i honorar som følge av forsinkelser eller hindringer utenfor Leverandørs kontroll, herunder forsinket offentlig transport, ferger, trafikkuhell, værforhold eller øvrige uforutsette reisehendelser, forutsatt at arrangementet gjennomføres helt eller delvis. Som Force Majeure regnes forhold utenfor partenes kontroll, herunder, men ikke begrenset til, naturkatastrofer, krig, terrorhandlinger, streik, lockout, pandemier, myndighetspålagte restriksjoner eller andre hendelser som vesentlig hindrer gjennomføring, og ved slike forhold fritas partene for ansvar så lenge situasjonen vedvarer.

Ved avlysning fra Arrangørs side gjelder følgende bruddgebyr basert på avtalt honorar: Avlysning senere enn én (1) måned før arrangementsdato medfører 100 % betalingsplikt, og avlysning mellom én (1) og tre (3) måneder før arrangementsdato medfører 50 % betalingsplikt. Avlysning skal skje skriftlig for å være gyldig.

Eventuelle avvik, tillegg eller endringer i kontraktens vilkår er kun gyldige dersom disse foreligger skriftlig og er bekreftet av begge parter. Begge parter er selv ansvarlige for å inneha gyldig ansvarsforsikring som dekker personskade og materielle skader som kan oppstå i forbindelse med arrangementet, herunder skader forårsaket av eget personell, innleid mannskap, teknisk utstyr eller øvrige forhold knyttet til egen virksomhet og leveranse.

Avtalen er underlagt norsk lov, og eventuelle tvister som ikke løses i minnelighet skal behandles av norske domstoler med Oslo tingrett som avtalt verneting. Partene forplikter seg til å behandle all konfidensiell informasjon som fremkommer gjennom avtalen, herunder økonomiske betingelser og forretningsmessige forhold, strengt fortrolig.`;

// ========================
// Contract List
// ========================

function renderContracts() {
    const container = document.getElementById('contracts-list');
    const contracts = DB.getContracts();

    if (contracts.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p>Ingen kontrakter ennå</p>
            <p class="text-sm mt-1">Trykk + Ny kontrakt for å opprette</p>
        </div>`;
        return;
    }

    const sorted = [...contracts].sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = sorted.map(c => {
        const statusColors = {
            draft: 'text-gray-400 bg-dark-600',
            sent: 'text-neon-blue bg-neon-blue/15',
            confirmed: 'text-neon-green bg-neon-green/15',
            completed: 'text-gray-500 bg-dark-600',
            cancelled: 'text-neon-pink bg-neon-pink/15',
        };
        const statusLabels = {
            draft: 'Utkast', sent: 'Sendt', confirmed: 'Bekreftet',
            completed: 'Fullført', cancelled: 'Avlyst',
        };
        const sc = statusColors[c.status] || statusColors.draft;
        const sl = statusLabels[c.status] || 'Utkast';
        const dateStr = c.date ? new Date(c.date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ingen dato';
        const eqCount = (c.equipment || []).length;

        return `<div class="bg-dark-800 rounded-xl border border-dark-600 p-4 hover:border-dark-500 transition-colors cursor-pointer slide-up-enter" onclick="openContractDetail('${c.id}')">
            <div class="flex items-start justify-between mb-2">
                <div class="min-w-0 flex-1">
                    <div class="font-semibold truncate">${esc(c.clientName)}</div>
                    <div class="text-sm text-gray-400 truncate">${esc(c.venue || 'Ingen spillested')}</div>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${sc}">${sl}</span>
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-500">
                <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    ${dateStr}
                </span>
                <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    ${eqCount} utstyr
                </span>
                ${c.honorar ? `<span class="font-medium text-gray-400">${esc(c.honorar)},-</span>` : ''}
            </div>
        </div>`;
    }).join('');
}

// ========================
// Contract Form
// ========================

function _buildLibRow(type, name, qty) {
    const cls = type === 'equipment' ? 'eq' : type === 'consumables' ? 'con' : 'svc';
    const placeholder = type === 'equipment' ? 'Utstyrsnavn...' : type === 'consumables' ? 'Forbruksmateriell...' : 'Tjeneste...';
    const minQty = type === 'consumables' ? 0 : 1;
    return `<div class="flex gap-2 items-center ${cls}-row">
        <input type="number" value="${qty}" min="${minQty}" class="w-16 bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ${cls}-qty">
        <div class="flex-1 relative">
            <input type="text" value="${esc(name)}" placeholder="${placeholder}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-sm ${cls}-name" autocomplete="off" data-lib-type="${type}">
            <div class="lib-suggestions hidden absolute z-50 left-0 right-0 top-full mt-1 bg-dark-600 border border-dark-500 rounded-lg shadow-lg max-h-36 overflow-y-auto"></div>
        </div>
        <button type="button" onclick="this.closest('.${cls}-row').remove()" class="text-neon-pink text-lg px-1 hover:text-neon-pink/70">&times;</button>
    </div>`;
}

function _setupLibAutocomplete(container) {
    container.addEventListener('input', (e) => {
        const input = e.target;
        if (!input.dataset.libType) return;
        const type = input.dataset.libType;
        const val = input.value.toLowerCase().trim();
        const sugBox = input.parentElement.querySelector('.lib-suggestions');
        if (!val || val.length < 1) { sugBox.classList.add('hidden'); return; }

        const lib = DB.getContractLibrary(type);
        const matches = lib.filter(i => i.name.toLowerCase().includes(val));
        if (matches.length === 0) { sugBox.classList.add('hidden'); return; }

        sugBox.innerHTML = matches.map(m =>
            `<div class="px-3 py-1.5 text-sm cursor-pointer hover:bg-dark-500 transition-colors lib-sug-item" data-name="${esc(m.name)}" data-qty="${m.defaultQty || 1}">${esc(m.name)}</div>`
        ).join('');
        sugBox.classList.remove('hidden');
    });
    container.addEventListener('click', (e) => {
        const item = e.target.closest('.lib-sug-item');
        if (!item) return;
        const row = item.closest('.eq-row, .con-row, .svc-row');
        const nameInput = row.querySelector('.eq-name, .con-name, .svc-name');
        const qtyInput = row.querySelector('.eq-qty, .con-qty, .svc-qty');
        nameInput.value = item.dataset.name;
        if (qtyInput && (!qtyInput.value || qtyInput.value === '1' || qtyInput.value === '0')) {
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

function showContractForm(contract = null) {
    const isEdit = !!contract;
    const eq = (contract?.equipment || []).map(e => _buildLibRow('equipment', e.name, e.quantity || 1)).join('');
    const con = (contract?.consumables || []).map(c => _buildLibRow('consumables', c.name, c.quantity || 0)).join('');
    const svc = (contract?.services || []).map(s => _buildLibRow('services', s.name, s.quantity || 1)).join('');

    openModal(isEdit ? 'Rediger kontrakt' : 'Ny kontrakt', `
        <div class="space-y-4">
            <div class="space-y-1">
                <div class="text-xs font-semibold text-neon-blue uppercase tracking-wider">Kundeinformasjon</div>
                <input type="text" id="cf-client-name" value="${esc(contract?.clientName || '')}" placeholder="Firmanavn / Kunde *" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                <input type="text" id="cf-client-address" value="${esc(contract?.clientAddress || '')}" placeholder="Adresse" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="cf-client-contact" value="${esc(contract?.clientContact || '')}" placeholder="Kontaktperson" class="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    <input type="text" id="cf-client-phone" value="${esc(contract?.clientPhone || '')}" placeholder="Telefon" class="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                </div>
                <input type="email" id="cf-client-email" value="${esc(contract?.clientEmail || '')}" placeholder="E-post" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
            </div>

            <div class="space-y-1">
                <div class="text-xs font-semibold text-neon-purple uppercase tracking-wider">Arrangement</div>
                <input type="date" id="cf-date" value="${contract?.date || ''}" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-purple focus:outline-none">
                <input type="text" id="cf-venue" value="${esc(contract?.venue || '')}" placeholder="Spillested *" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-purple focus:outline-none">
                <input type="text" id="cf-venue-address" value="${esc(contract?.venueAddress || '')}" placeholder="Spillested-adresse" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-purple focus:outline-none">
            </div>

            <div class="space-y-1">
                <div class="text-xs font-semibold text-neon-yellow uppercase tracking-wider">Økonomi</div>
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="cf-honorar" value="${esc(contract?.honorar || '')}" placeholder="Honorar (kr)" class="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-yellow focus:outline-none">
                    <input type="text" id="cf-honorar-note" value="${esc(contract?.honorarNote || '')}" placeholder="Inkl. transport" class="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-yellow focus:outline-none">
                </div>
                <input type="text" id="cf-payment" value="${esc(contract?.paymentTerms || 'Faktureres 14 dager før event')}" placeholder="Betalingsvilkår" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-yellow focus:outline-none">
            </div>

            <div class="space-y-1">
                <div class="flex items-center justify-between">
                    <div class="text-xs font-semibold text-neon-green uppercase tracking-wider">Utstyr (pakkeliste)</div>
                    <div class="flex gap-2">
                        <button type="button" id="btn-lib-eq" class="text-xs text-gray-400 hover:text-neon-green hover:underline">Bibliotek</button>
                        <button type="button" id="btn-add-eq" class="text-xs text-neon-green hover:underline">+ Legg til</button>
                    </div>
                </div>
                <div id="cf-equipment" class="space-y-1.5">${eq}</div>
            </div>

            <div class="space-y-1">
                <div class="flex items-center justify-between">
                    <div class="text-xs font-semibold text-neon-pink uppercase tracking-wider">Forbruksmateriell (påminnelser)</div>
                    <div class="flex gap-2">
                        <button type="button" id="btn-lib-con" class="text-xs text-gray-400 hover:text-neon-pink hover:underline">Bibliotek</button>
                        <button type="button" id="btn-add-con" class="text-xs text-neon-pink hover:underline">+ Legg til</button>
                    </div>
                </div>
                <div id="cf-consumables" class="space-y-1.5">${con}</div>
            </div>

            <div class="space-y-1">
                <div class="flex items-center justify-between">
                    <div class="text-xs font-semibold text-neon-blue uppercase tracking-wider">Tjenester</div>
                    <div class="flex gap-2">
                        <button type="button" id="btn-lib-svc" class="text-xs text-gray-400 hover:text-neon-blue hover:underline">Bibliotek</button>
                        <button type="button" id="btn-add-svc" class="text-xs text-neon-blue hover:underline">+ Legg til</button>
                    </div>
                </div>
                <div id="cf-services" class="space-y-1.5">${svc}</div>
            </div>

            <div class="space-y-2">
                <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rider</div>
                <div class="grid grid-cols-3 gap-2">
                    <div>
                        <label class="text-xs text-gray-500">Reisende</label>
                        <input type="number" id="cf-travelers" value="${contract?.travelers || 3}" min="1" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                    <div>
                        <label class="text-xs text-gray-500">Rom</label>
                        <input type="number" id="cf-rooms" value="${contract?.rooms || 2}" min="0" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                    <div>
                        <label class="text-xs text-gray-500">Strømkurser</label>
                        <input type="number" id="cf-power" value="${contract?.powerCourses || 5}" min="1" class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none">
                    </div>
                </div>
                <label class="flex items-center gap-2 text-sm text-gray-400">
                    <input type="checkbox" id="cf-sound" ${contract?.soundSystem ? 'checked' : ''} class="rounded">
                    Lydanlegg inkludert (+2 kurser)
                </label>
                <div class="border-t border-dark-600 pt-2 mt-1">
                    <div class="text-xs text-gray-500 mb-1.5">Inkludert i avtalt pris:</div>
                    <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                        <label class="flex items-center gap-2 text-sm text-gray-400">
                            <input type="checkbox" id="cf-inc-reise" ${contract?.riderIncludes?.reise ? 'checked' : ''} class="rounded">
                            Reise
                        </label>
                        <label class="flex items-center gap-2 text-sm text-gray-400">
                            <input type="checkbox" id="cf-inc-transport" ${contract?.riderIncludes?.transport ? 'checked' : ''} class="rounded">
                            Transport
                        </label>
                        <label class="flex items-center gap-2 text-sm text-gray-400">
                            <input type="checkbox" id="cf-inc-overnatting" ${contract?.riderIncludes?.overnatting ? 'checked' : ''} class="rounded">
                            Overnatting
                        </label>
                        <label class="flex items-center gap-2 text-sm text-gray-400">
                            <input type="checkbox" id="cf-inc-middag" ${contract?.riderIncludes?.middag ? 'checked' : ''} class="rounded">
                            Middag
                        </label>
                        <label class="flex items-center gap-2 text-sm text-gray-400">
                            <input type="checkbox" id="cf-inc-lunsj" ${contract?.riderIncludes?.lunsj ? 'checked' : ''} class="rounded">
                            Lunsj
                        </label>
                    </div>
                </div>
                <div>
                    <label class="text-xs text-gray-500">Rider-tillegg (fritekst)</label>
                    <textarea id="cf-rider-text" rows="2" placeholder="Tilleggsinformasjon til rideren..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none resize-none">${esc(contract?.riderText || '')}</textarea>
                </div>
            </div>

            <div class="space-y-1">
                <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notater</div>
                <textarea id="cf-notes" rows="2" placeholder="Eventuelle notater..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-neon-blue focus:outline-none resize-none">${esc(contract?.notes || '')}</textarea>
            </div>

            <button id="btn-save-contract" class="w-full btn-neon py-2.5 rounded-lg font-semibold">${isEdit ? 'Lagre endringer' : 'Opprett kontrakt'}</button>
        </div>
    `);

    const modalContent = document.querySelector('.modal-content') || document.querySelector('#modal-inner');
    const formRoot = document.getElementById('btn-add-eq').closest('.space-y-4');
    _setupLibAutocomplete(formRoot);

    function addLibRow(type) {
        const containerId = type === 'equipment' ? 'cf-equipment' : type === 'consumables' ? 'cf-consumables' : 'cf-services';
        const cls = type === 'equipment' ? 'eq' : type === 'consumables' ? 'con' : 'svc';
        const container = document.getElementById(containerId);
        const div = document.createElement('div');
        div.innerHTML = _buildLibRow(type, '', type === 'consumables' ? 0 : 1);
        const row = div.firstElementChild;
        container.appendChild(row);
        row.querySelector(`.${cls}-name`).focus();
    }

    document.getElementById('btn-add-eq').addEventListener('click', () => addLibRow('equipment'));
    document.getElementById('btn-add-con').addEventListener('click', () => addLibRow('consumables'));
    document.getElementById('btn-add-svc').addEventListener('click', () => addLibRow('services'));

    function showLibPicker(type) {
        const lib = DB.getContractLibrary(type);
        const containerId = type === 'equipment' ? 'cf-equipment' : type === 'consumables' ? 'cf-consumables' : 'cf-services';
        const colorClass = type === 'equipment' ? 'text-neon-green' : type === 'consumables' ? 'text-neon-pink' : 'text-neon-blue';
        const typeLabel = type === 'equipment' ? 'Utstyr' : type === 'consumables' ? 'Forbruksmateriell' : 'Tjenester';

        if (lib.length === 0) {
            toast(`Ingen ${typeLabel.toLowerCase()} i biblioteket ennå. Legg til elementer — de lagres automatisk.`, 'info');
            return;
        }

        const existing = [];
        const cls = type === 'equipment' ? 'eq' : type === 'consumables' ? 'con' : 'svc';
        document.querySelectorAll(`#${containerId} .${cls}-name`).forEach(input => {
            if (input.value.trim()) existing.push(input.value.toLowerCase().trim());
        });

        const available = lib.filter(i => !existing.includes(i.name.toLowerCase().trim()));
        if (available.length === 0) {
            toast(`Alle elementer fra biblioteket er allerede lagt til`, 'info');
            return;
        }

        const pickerHtml = `<div id="lib-picker-overlay" class="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4" style="margin:0;">
            <div class="bg-dark-800 rounded-xl border border-dark-600 p-4 w-full max-w-sm max-h-[70vh] flex flex-col">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold ${colorClass}">${typeLabel}-bibliotek</h3>
                    <button onclick="document.getElementById('lib-picker-overlay').remove()" class="text-gray-500 hover:text-white text-lg">&times;</button>
                </div>
                <input type="text" id="lib-picker-search" placeholder="Søk..." class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm mb-2 focus:border-neon-blue focus:outline-none">
                <div class="flex-1 overflow-y-auto space-y-1" id="lib-picker-items">
                    ${available.map(item => `
                        <label class="flex items-center gap-3 p-2 rounded-lg bg-dark-700 cursor-pointer hover:bg-dark-600 transition-colors">
                            <input type="checkbox" value="${esc(item.name)}" data-qty="${item.defaultQty || 1}" class="rounded lib-pick-cb">
                            <span class="text-sm flex-1">${esc(item.name)}</span>
                            <span class="text-xs text-gray-500">${item.defaultQty || 1} stk</span>
                        </label>
                    `).join('')}
                </div>
                <div class="flex gap-2 mt-3">
                    <button id="lib-picker-del" class="py-2 px-3 rounded-lg text-xs text-gray-500 bg-dark-700 hover:bg-dark-600 hover:text-neon-pink transition-colors">Rediger</button>
                    <button id="lib-picker-add" class="flex-1 btn-neon py-2 rounded-lg text-sm font-semibold">Legg til valgte</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', pickerHtml);

        document.getElementById('lib-picker-search').addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('#lib-picker-items label').forEach(label => {
                const name = label.querySelector('.lib-pick-cb').value.toLowerCase();
                label.style.display = name.includes(q) ? '' : 'none';
            });
        });

        document.getElementById('lib-picker-add').addEventListener('click', () => {
            const container = document.getElementById(containerId);
            document.querySelectorAll('.lib-pick-cb:checked').forEach(cb => {
                const div = document.createElement('div');
                div.innerHTML = _buildLibRow(type, cb.value, parseInt(cb.dataset.qty) || 1);
                container.appendChild(div.firstElementChild);
            });
            document.getElementById('lib-picker-overlay').remove();
        });

        document.getElementById('lib-picker-del').addEventListener('click', () => {
            document.getElementById('lib-picker-overlay').remove();
            showLibraryManager(type);
        });

        document.getElementById('lib-picker-search').focus();
    }

    document.getElementById('btn-lib-eq').addEventListener('click', () => showLibPicker('equipment'));
    document.getElementById('btn-lib-con').addEventListener('click', () => showLibPicker('consumables'));
    document.getElementById('btn-lib-svc').addEventListener('click', () => showLibPicker('services'));

    document.getElementById('btn-save-contract').addEventListener('click', () => {
        const clientName = document.getElementById('cf-client-name').value.trim();
        const venue = document.getElementById('cf-venue').value.trim();
        if (!clientName) { toast('Fyll inn kundenavn', 'error'); return; }
        if (!venue) { toast('Fyll inn spillested', 'error'); return; }

        const equipment = [];
        document.querySelectorAll('#cf-equipment .eq-row').forEach(row => {
            const name = row.querySelector('.eq-name').value.trim();
            const qty = parseInt(row.querySelector('.eq-qty').value) || 1;
            if (name) equipment.push({ name, quantity: qty });
        });

        const consumables = [];
        document.querySelectorAll('#cf-consumables .con-row').forEach(row => {
            const name = row.querySelector('.con-name').value.trim();
            const qty = parseInt(row.querySelector('.con-qty').value) || 0;
            if (name) consumables.push({ name, quantity: qty });
        });

        const services = [];
        document.querySelectorAll('#cf-services .svc-row').forEach(row => {
            const name = row.querySelector('.svc-name').value.trim();
            const qty = parseInt(row.querySelector('.svc-qty').value) || 1;
            if (name) services.push({ name, quantity: qty });
        });

        DB.ensureLibraryItems(equipment, 'equipment');
        DB.ensureLibraryItems(consumables, 'consumables');
        DB.ensureLibraryItems(services, 'services');

        const data = {
            clientName,
            clientAddress: document.getElementById('cf-client-address').value.trim(),
            clientContact: document.getElementById('cf-client-contact').value.trim(),
            clientPhone: document.getElementById('cf-client-phone').value.trim(),
            clientEmail: document.getElementById('cf-client-email').value.trim(),
            date: document.getElementById('cf-date').value,
            venue,
            venueAddress: document.getElementById('cf-venue-address').value.trim(),
            honorar: document.getElementById('cf-honorar').value.trim(),
            honorarNote: document.getElementById('cf-honorar-note').value.trim(),
            paymentTerms: document.getElementById('cf-payment').value.trim(),
            equipment,
            consumables,
            services,
            travelers: parseInt(document.getElementById('cf-travelers').value) || 3,
            rooms: parseInt(document.getElementById('cf-rooms').value) || 2,
            powerCourses: parseInt(document.getElementById('cf-power').value) || 5,
            soundSystem: document.getElementById('cf-sound').checked,
            riderIncludes: {
                reise: document.getElementById('cf-inc-reise').checked,
                transport: document.getElementById('cf-inc-transport').checked,
                overnatting: document.getElementById('cf-inc-overnatting').checked,
                middag: document.getElementById('cf-inc-middag').checked,
                lunsj: document.getElementById('cf-inc-lunsj').checked,
            },
            riderText: document.getElementById('cf-rider-text').value.trim(),
            notes: document.getElementById('cf-notes').value.trim(),
        };

        if (isEdit) {
            DB.updateContract(contract.id, data);
            toast('Kontrakt oppdatert', 'success');
            ContractApp.currentContractId = contract.id;
            closeModal();
            renderContractDetail();
        } else {
            const newContract = DB.addContract(data);
            toast('Kontrakt opprettet', 'success');
            ContractApp.currentContractId = newContract.id;
            closeModal();
            showView('contract-detail');
        }
    });
}

// ========================
// Contract Detail
// ========================

function openContractDetail(id) {
    ContractApp.currentContractId = id;
    showView('contract-detail');
}

function renderContractDetail() {
    const contract = DB.getContract(ContractApp.currentContractId);
    if (!contract) { showView('sales'); return; }

    const container = document.getElementById('contract-detail-content');
    const dateStr = contract.date ? new Date(contract.date).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Ingen dato';

    const statusOpts = ['draft', 'sent', 'confirmed', 'completed', 'cancelled'];
    const statusLabels = { draft: 'Utkast', sent: 'Sendt', confirmed: 'Bekreftet', completed: 'Fullført', cancelled: 'Avlyst' };
    const statusColors = {
        draft: 'border-gray-500 text-gray-400',
        sent: 'border-neon-blue text-neon-blue',
        confirmed: 'border-neon-green text-neon-green',
        completed: 'border-gray-600 text-gray-500',
        cancelled: 'border-neon-pink text-neon-pink',
    };

    const statusSelect = `<select id="contract-status-select" class="bg-dark-700 border ${statusColors[contract.status] || ''} rounded-lg px-2 py-1 text-sm focus:outline-none">
        ${statusOpts.map(s => `<option value="${s}" ${s === contract.status ? 'selected' : ''}>${statusLabels[s]}</option>`).join('')}
    </select>`;

    const eqHTML = (contract.equipment || []).length > 0
        ? (contract.equipment || []).map(e =>
            `<div class="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2">
                <span class="text-sm">${esc(e.name)}</span>
                <span class="text-xs text-neon-green font-medium">${e.quantity} stk</span>
            </div>`
        ).join('')
        : '<p class="text-sm text-gray-500 italic">Ingen utstyr lagt til</p>';

    const conHTML = (contract.consumables || []).length > 0
        ? (contract.consumables || []).map(c =>
            `<div class="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2">
                <span class="text-sm">${esc(c.name)}</span>
                ${c.quantity > 0 ? `<span class="text-xs text-neon-pink font-medium">${c.quantity} stk</span>` : ''}
            </div>`
        ).join('')
        : '<p class="text-sm text-gray-500 italic">Ingen forbruksmateriell</p>';

    const totalPower = (contract.powerCourses || 5) + (contract.soundSystem ? 2 : 0);

    container.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <div class="min-w-0 flex-1">
                <h2 class="text-xl font-bold truncate">${esc(contract.clientName)}</h2>
                <p class="text-sm text-gray-400">${esc(contract.venue)}</p>
            </div>
            ${statusSelect}
        </div>

        <div class="bg-dark-800 rounded-xl border border-dark-600 p-3 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Dato</span><span>${dateStr}</span></div>
            ${contract.venueAddress ? `<div class="flex justify-between"><span class="text-gray-500">Adresse</span><span class="text-right">${esc(contract.venueAddress)}</span></div>` : ''}
            ${contract.clientContact ? `<div class="flex justify-between"><span class="text-gray-500">Kontakt</span><span>${esc(contract.clientContact)}</span></div>` : ''}
            ${contract.clientPhone ? `<div class="flex justify-between"><span class="text-gray-500">Telefon</span><span>${esc(contract.clientPhone)}</span></div>` : ''}
            ${contract.clientEmail ? `<div class="flex justify-between"><span class="text-gray-500">E-post</span><span class="text-right truncate max-w-[60%]">${esc(contract.clientEmail)}</span></div>` : ''}
            ${contract.honorar ? `<div class="flex justify-between"><span class="text-gray-500">Honorar</span><span class="font-semibold text-neon-yellow">${esc(contract.honorar)},- ${contract.honorarNote ? `<span class="font-normal text-gray-500">${esc(contract.honorarNote)}</span>` : ''}</span></div>` : ''}
            ${contract.paymentTerms ? `<div class="flex justify-between"><span class="text-gray-500">Betaling</span><span class="text-right">${esc(contract.paymentTerms)}</span></div>` : ''}
        </div>

        <div class="bg-dark-800 rounded-xl border border-neon-green/20 p-3">
            <h3 class="text-sm font-semibold text-neon-green mb-2 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                Utstyr (pakkeliste)
            </h3>
            <div class="space-y-1.5">${eqHTML}</div>
        </div>

        ${(contract.consumables || []).length > 0 ? `
        <div class="bg-dark-800 rounded-xl border border-neon-pink/20 p-3">
            <h3 class="text-sm font-semibold text-neon-pink mb-2 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Forbruksmateriell (påminnelser)
            </h3>
            <div class="space-y-1.5">${conHTML}</div>
        </div>` : ''}

        ${(contract.services || []).length > 0 ? `
        <div class="bg-dark-800 rounded-xl border border-neon-blue/20 p-3">
            <h3 class="text-sm font-semibold text-neon-blue mb-2 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                Tjenester
            </h3>
            <div class="space-y-1.5">${(contract.services || []).map(s =>
                `<div class="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2">
                    <span class="text-sm">${esc(s.name)}</span>
                    ${s.quantity > 1 ? `<span class="text-xs text-neon-blue font-medium">${s.quantity} stk</span>` : ''}
                </div>`
            ).join('')}</div>
        </div>` : ''}

        <div class="bg-dark-800 rounded-xl border border-dark-600 p-3">
            <h3 class="text-sm font-semibold text-gray-300 mb-2">Rider</h3>
            <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-dark-700 rounded-lg p-2">
                    <div class="text-lg font-bold text-neon-blue">${contract.travelers || 3}</div>
                    <div class="text-xs text-gray-500">Reisende</div>
                </div>
                <div class="bg-dark-700 rounded-lg p-2">
                    <div class="text-lg font-bold text-neon-purple">${contract.rooms || 2}</div>
                    <div class="text-xs text-gray-500">Hotellrom</div>
                </div>
                <div class="bg-dark-700 rounded-lg p-2">
                    <div class="text-lg font-bold text-neon-yellow">${totalPower}</div>
                    <div class="text-xs text-gray-500">Strømkurser</div>
                </div>
            </div>
            ${contract.soundSystem ? '<div class="text-xs text-neon-blue mt-2 text-center">Lydanlegg inkludert</div>' : ''}
            ${(() => {
                const ri = contract.riderIncludes || {};
                const tags = [];
                if (ri.reise) tags.push('Reise');
                if (ri.transport) tags.push('Transport');
                if (ri.overnatting) tags.push('Overnatting');
                if (ri.middag) tags.push('Middag');
                if (ri.lunsj) tags.push('Lunsj');
                return tags.length > 0 ? `<div class="mt-2 pt-2 border-t border-dark-600">
                    <div class="text-xs text-gray-500 mb-1">Inkludert i pris:</div>
                    <div class="flex flex-wrap gap-1">${tags.map(t => `<span class="text-xs px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green">${t}</span>`).join('')}</div>
                </div>` : '';
            })()}
            ${contract.riderText ? `<div class="mt-2 pt-2 border-t border-dark-600">
                <div class="text-xs text-gray-500 mb-1">Tillegg:</div>
                <p class="text-sm text-gray-400 whitespace-pre-line">${esc(contract.riderText)}</p>
            </div>` : ''}
        </div>

        ${contract.notes ? `
        <div class="bg-dark-800 rounded-xl border border-dark-600 p-3">
            <h3 class="text-sm font-semibold text-gray-300 mb-1">Notater</h3>
            <p class="text-sm text-gray-400 whitespace-pre-line">${esc(contract.notes)}</p>
        </div>` : ''}

        <div class="flex gap-2">
            <button onclick="showContractForm(DB.getContract('${contract.id}'))" class="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors">Rediger</button>
            <button onclick="previewContract('${contract.id}')" class="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-colors">Forhåndsvis</button>
        </div>
        <button onclick="confirmDeleteContract('${contract.id}')" class="w-full py-2 rounded-lg text-sm text-gray-500 bg-dark-700 hover:bg-dark-600 hover:text-neon-pink transition-colors">Slett kontrakt</button>
    `;

    document.getElementById('contract-status-select').addEventListener('change', (e) => {
        DB.updateContract(contract.id, { status: e.target.value });
        toast('Status oppdatert', 'success');
        renderContractDetail();
    });
}

function confirmDeleteContract(id) {
    const contract = DB.getContract(id);
    if (!contract) return;
    openModal('Slett kontrakt', `
        <p class="text-sm text-gray-400 mb-4">Er du sikker på at du vil slette kontrakten for <strong>${esc(contract.clientName)}</strong>?</p>
        <div class="flex gap-2">
            <button onclick="DB.deleteContract('${id}'); closeModal(); showView('sales'); toast('Kontrakt slettet', 'success');" class="flex-1 py-2 rounded-lg text-sm font-semibold bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/30 transition-colors">Slett</button>
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg text-sm text-gray-400 bg-dark-700 hover:bg-dark-600 transition-colors">Avbryt</button>
        </div>
    `);
}

// ========================
// Contract Preview / Print
// ========================

function previewContract(id) {
    const c = DB.getContract(id);
    if (!c) return;
    showView('contract-preview');
    renderContractPreview(c);
}

function renderContractPreview(c) {
    const container = document.getElementById('contract-preview-content');
    const dateStr = c.date ? new Date(c.date).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '___________';

    const eqItems = c.equipment || [];
    const half = Math.ceil(eqItems.length / 2);
    const col1 = eqItems.slice(0, half);
    const col2 = eqItems.slice(half);

    const eqRows = Math.max(col1.length, col2.length);
    let eqTableHTML = '';
    for (let i = 0; i < eqRows; i++) {
        const left = col1[i] ? `- ${col1[i].quantity > 1 ? col1[i].quantity + ' ' : ''}${esc(col1[i].name)}` : '';
        const right = col2[i] ? `- ${col2[i].quantity > 1 ? col2[i].quantity + ' ' : ''}${esc(col2[i].name)}` : '';
        eqTableHTML += `<tr><td class="py-0.5 pr-4">${left}</td><td class="py-0.5">${right}</td></tr>`;
    }

    const totalPower = (c.powerCourses || 5) + (c.soundSystem ? 2 : 0);

    container.innerHTML = `
        <div class="contract-page" id="contract-page-1">
            <div class="contract-header">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <div class="text-lg font-bold">Neonparty AS</div>
                        <div class="text-sm text-gray-600">Søndre Torv 2</div>
                        <div class="text-sm text-gray-600">3510 Hønefoss</div>
                    </div>
                    <div class="text-right text-sm text-gray-600">
                        <div>Orgnr: 934 043 995</div>
                        <div>Mail: kontrakt@neonparty.no</div>
                        <div>Telefon: +47 954 12 111</div>
                    </div>
                </div>
                <div class="text-right text-xs text-gray-400 mb-4">1 av 3</div>
            </div>

            <h2 class="text-xl font-bold text-center mb-6">BOOKINGAVTALE – Neonparty</h2>

            <table class="w-full text-sm mb-6">
                <tr><td class="py-1 text-gray-600 w-40">Firma:</td><td class="font-medium">${esc(c.clientName)}</td></tr>
                <tr><td class="py-1 text-gray-600">Adresse:</td><td>${esc(c.clientAddress || '')}</td></tr>
                <tr><td class="py-1 text-gray-600">Bemyndighet kontrahent:</td><td>${esc(c.clientContact || '')}</td></tr>
                <tr><td class="py-1 text-gray-600">Telefon:</td><td>${esc(c.clientPhone || '')}</td></tr>
                <tr><td class="py-1 text-gray-600">E-post:</td><td>${esc(c.clientEmail || '')}</td></tr>
            </table>

            <div class="text-sm font-semibold mb-2">Generell informasjon:</div>
            <table class="w-full text-sm mb-4">
                <tr><td class="py-1 text-gray-600 w-40">Dato:</td><td>${dateStr}</td></tr>
                <tr><td class="py-1 text-gray-600">Spillested</td><td class="font-medium">${esc(c.venue)}</td></tr>
                <tr><td class="py-1 text-gray-600"></td><td>${esc(c.venueAddress || '')}</td></tr>
                <tr><td class="py-1 text-gray-600">Honorar</td><td>${c.honorar ? `${esc(c.honorar)},- ${c.honorarNote ? esc(c.honorarNote) : ''}` : ''}</td></tr>
                <tr><td class="py-1 text-gray-600">Betaling:</td><td>${esc(c.paymentTerms || '')}</td></tr>
            </table>

            <div class="text-sm font-semibold mb-2">Totalt med i pakken:</div>
            <table class="w-full text-sm mb-6">${eqTableHTML}</table>

            ${(c.services || []).length > 0 ? `
            <div class="text-sm font-semibold mb-2 mt-4">Tjenester inkludert:</div>
            <table class="w-full text-sm mb-4">${(c.services || []).map(s => `<tr><td class="py-0.5">- ${s.quantity > 1 ? s.quantity + ' ' : ''}${esc(s.name)}</td></tr>`).join('')}</table>
            ` : ''}

            ${(c.consumables || []).length > 0 ? `
            <div class="text-xs text-gray-500 italic mb-2">Forbruksmateriell (beregnes separat): ${c.consumables.map(con => `${con.quantity > 0 ? con.quantity + ' ' : ''}${esc(con.name)}`).join(', ')}</div>
            ` : ''}

            <div class="text-sm text-gray-600 mt-4">Det vil også bli gitt en rabattkode for handling på Glowshop, hvor alle produkter uavhengig av mengde vil gi 50% rabatt. Når du handler i nettbutikken, velg hentes i Hønefoss, så tar vi det med til arrangementet. Ønsker du det tilsendt på forhånd, så velger du ønsket fraktmetode.</div>
        </div>

        <div class="contract-page" id="contract-page-2">
            <div class="contract-header">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <div class="text-lg font-bold">Neonparty AS</div>
                        <div class="text-sm text-gray-600">Søndre Torv 2</div>
                        <div class="text-sm text-gray-600">3510 Hønefoss</div>
                    </div>
                    <div class="text-right text-sm text-gray-600">
                        <div>Orgnr: 934 043 995</div>
                        <div>Mail: kontrakt@neonparty.no</div>
                        <div>Telefon: +47 954 12 111</div>
                    </div>
                </div>
                <div class="text-right text-xs text-gray-400 mb-4">2 av 3</div>
            </div>
            <h3 class="font-bold mb-3">Avtalevilkår</h3>
            <div class="text-xs leading-relaxed text-gray-700 whitespace-pre-line contract-terms">${esc(CONTRACT_TERMS)}</div>
        </div>

        <div class="contract-page" id="contract-page-3">
            <div class="contract-header">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <div class="text-lg font-bold">Neonparty AS</div>
                        <div class="text-sm text-gray-600">Søndre Torv 2</div>
                        <div class="text-sm text-gray-600">3510 Hønefoss</div>
                    </div>
                    <div class="text-right text-sm text-gray-600">
                        <div>Orgnr: 934 043 995</div>
                        <div>Mail: kontrakt@neonparty.no</div>
                        <div>Telefon: +47 954 12 111</div>
                    </div>
                </div>
                <div class="text-right text-xs text-gray-400 mb-4">3 av 3</div>
            </div>

            <h3 class="font-bold mb-4">VEDLEGG 1 – RIDER OG TILLEGGSBETINGELSER</h3>
            <p class="text-sm text-gray-600 mb-4">Denne rideren er en integrert del av avtalen mellom partene og regulerer forhold knyttet til reise, opphold, bespisning, tekniske behov og praktisk tilrettelegging for Leverandørs personell i forbindelse med arrangementets gjennomføring.</p>

            ${(() => {
                const ri = c.riderIncludes || {};
                const inc = [];
                if (ri.reise) inc.push('reise');
                if (ri.transport) inc.push('transport');
                if (ri.overnatting) inc.push('overnatting');
                if (ri.middag) inc.push('middag');
                if (ri.lunsj) inc.push('lunsj');
                const incText = inc.length > 0
                    ? 'Følgende er inkludert i avtalt pris: ' + inc.map((item, i) => {
                        if (i === inc.length - 1 && inc.length > 1) return 'og ' + item;
                        return item;
                    }).join(inc.length > 2 ? ', ' : ' ') + '.'
                    : '';
                return incText ? `<div class="bg-gray-50 border border-gray-200 rounded p-3 mb-4 text-sm">
                    <span class="font-semibold">Inkludert i avtalt pris:</span> ${esc(inc.join(', '))}
                </div>` : '';
            })()}

            <div class="space-y-3 text-sm">
                <div>
                    <h4 class="font-semibold mb-1">1. Reise og personell</h4>
                    <p class="text-gray-600">Antall reisende i forbindelse med dette arrangementet er totalt ${c.travelers || 3} (${numberToNorwegian(c.travelers || 3)}) person${(c.travelers || 3) > 1 ? 'er' : ''}.</p>
                    ${(c.riderIncludes?.reise || c.riderIncludes?.transport)
                        ? '<p class="text-gray-600">Transport og reise er i dette tilfellet inkludert i tilbudet. Eventuelle tilleggskostnader knyttet til bompasseringer tur/retur fra Hønefoss faktureres Arrangør i etterkant.</p>'
                        : '<p class="text-gray-600">Transport og reise er ikke inkludert i tilbudet og faktureres Arrangør i etterkant. Eventuelle tilleggskostnader knyttet til bompasseringer tur/retur fra Hønefoss faktureres Arrangør i etterkant.</p>'
                    }
                </div>

                <div>
                    <h4 class="font-semibold mb-1">2. Bespisning – Middag</h4>
                    ${c.riderIncludes?.middag
                        ? '<p class="text-gray-600">Middag er inkludert i avtalt pris og dekkes av Leverandør.</p>'
                        : '<p class="text-gray-600">Arrangør plikter å dekke middag for samtlige reisende. Middag skal som utgangspunkt gjennomføres på restaurant, og det forutsettes at det bestilles fullverdige måltider inkludert ønsket mineralvann.</p>'
                    }
                </div>

                ${c.riderIncludes?.lunsj ? `<div>
                    <h4 class="font-semibold mb-1">3. Bespisning – Lunsj</h4>
                    <p class="text-gray-600">Lunsj er inkludert i avtalt pris og dekkes av Leverandør.</p>
                </div>` : `<div>
                    <h4 class="font-semibold mb-1">3. Bespisning – Lunsj</h4>
                    <p class="text-gray-600">Arrangør plikter å dekke lunsj for samtlige reisende dersom arrangementet strekker seg over en periode som gjør dette nødvendig.</p>
                </div>`}

                <div>
                    <h4 class="font-semibold mb-1">4. Crew-catering under arrangement</h4>
                    <p class="text-gray-600">Det skal være tilgjengelig alkoholfri drikke samt enkel mat/servering til crew i forbindelse med rigg og gjennomføring av arrangementet.</p>
                </div>

                <div>
                    <h4 class="font-semibold mb-1">5. Overnatting</h4>
                    ${c.riderIncludes?.overnatting
                        ? `<p class="text-gray-600">Overnatting er inkludert i avtalt pris og dekkes av Leverandør.</p>
                           <p class="text-gray-600">Overnatting skal fortrinnsvis skje på hotell. Det er et absolutt krav at hvert rom har eget bad direkte tilknyttet rommet.</p>
                           <p class="text-gray-600">For denne reisen skal det bookes totalt ${c.rooms || 2} (${numberToNorwegian(c.rooms || 2)}) rom, og frokost skal være inkludert i overnattingen for samtlige reisende.</p>`
                        : `<p class="text-gray-600">Overnatting skal fortrinnsvis skje på hotell. Det er et absolutt krav at hvert rom har eget bad direkte tilknyttet rommet.</p>
                           <p class="text-gray-600">For denne reisen skal det bookes totalt ${c.rooms || 2} (${numberToNorwegian(c.rooms || 2)}) rom, og frokost skal være inkludert i overnattingen for samtlige reisende.</p>`
                    }
                </div>

                <div>
                    <h4 class="font-semibold mb-1">6. Teknisk – Strømbehov</h4>
                    <p class="text-gray-600">Arrangør plikter å stille nødvendig strømtilførsel til disposisjon for gjennomføring av leveransen.</p>
                    <p class="text-gray-600">Det er behov for totalt ${totalPower} (${numberToNorwegian(totalPower)}) separate kurser, hver på 16 ampere sikring${c.soundSystem ? ', inkludert 2 kurser for lydanlegg' : ''}.</p>
                    <p class="text-gray-600">Det skal være klargjort ett bord til disposisjon for leveransen. Bordet skal ha en høyde på mellom 1,00 og 1,10 meter, og minimumsmål på 100 x 40 cm (bredde x dybde).</p>
                    ${c.soundSystem ? '<p class="text-gray-600">For tilkobling til lydanlegg skal det ligge 2 stk. XLR klare for tilkobling til anlegget på scenen, lyden skal være forhåndsinnstilt på mixeren.</p>' : ''}
                </div>

                ${c.riderText ? `<div>
                    <h4 class="font-semibold mb-1">7. Tillegg</h4>
                    <p class="text-gray-600 whitespace-pre-line">${esc(c.riderText)}</p>
                </div>` : ''}
            </div>

            <div class="mt-8 flex justify-between text-sm">
                <div class="text-center">
                    <div class="border-b border-gray-400 w-48 mb-1"></div>
                    <div>Øyvind Riibe</div>
                    <div class="text-gray-500">For Neonparty AS</div>
                </div>
                <div class="text-center">
                    <div class="border-b border-gray-400 w-48 mb-1"></div>
                    <div>${esc(c.clientContact || c.clientName)}</div>
                    <div class="text-gray-500">${esc(c.clientName)}</div>
                </div>
            </div>
        </div>

        <div class="flex gap-2 mt-4 no-print">
            <button onclick="printContract('${c.id}')" class="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-colors flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                Skriv ut / PDF
            </button>
        </div>
    `;
}

function printContract(id) {
    window.print();
}

function numberToNorwegian(n) {
    const words = ['null', 'én', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'åtte', 'ni', 'ti',
        'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten', 'tjue'];
    return words[n] || String(n);
}

// ========================
// Library Manager
// ========================

function showLibraryManager(filterType) {
    const typeLabels = { equipment: 'Utstyr', consumables: 'Forbruksmateriell', services: 'Tjenester' };
    const typeColors = { equipment: 'neon-green', consumables: 'neon-pink', services: 'neon-blue' };
    const types = ['equipment', 'consumables', 'services'];
    const activeType = filterType || 'equipment';

    function renderManager(currentType) {
        const lib = DB.getContractLibrary(currentType);
        const color = typeColors[currentType];

        const overlay = document.getElementById('lib-manager-overlay');
        if (!overlay) return;

        const itemsEl = overlay.querySelector('#lib-mgr-items');
        const tabs = overlay.querySelectorAll('.lib-mgr-tab');
        tabs.forEach(t => {
            t.classList.toggle('border-b-2', t.dataset.type === currentType);
            t.classList.toggle(`border-${typeColors[t.dataset.type]}`, t.dataset.type === currentType);
            t.classList.toggle('text-white', t.dataset.type === currentType);
            t.classList.toggle('text-gray-500', t.dataset.type !== currentType);
        });

        if (lib.length === 0) {
            itemsEl.innerHTML = `<p class="text-sm text-gray-500 italic py-4 text-center">Ingen elementer i ${typeLabels[currentType].toLowerCase()}-biblioteket</p>`;
        } else {
            itemsEl.innerHTML = lib.map(item => `
                <div class="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2 group">
                    <span class="flex-1 text-sm">${esc(item.name)}</span>
                    <span class="text-xs text-gray-500">${item.defaultQty || 1} stk</span>
                    <button onclick="deleteLibItem('${item.id}','${currentType}')" class="text-gray-600 hover:text-neon-pink text-sm opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                </div>
            `).join('');
        }

        const addEl = overlay.querySelector('#lib-mgr-add-section');
        addEl.innerHTML = `
            <div class="flex gap-2">
                <input type="text" id="lib-mgr-new-name" placeholder="Nytt element..." class="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:border-${color} focus:outline-none">
                <input type="number" id="lib-mgr-new-qty" value="1" min="1" class="w-16 bg-dark-700 border border-dark-600 rounded-lg px-2 py-2 text-sm text-center focus:border-${color} focus:outline-none">
                <button id="lib-mgr-add-btn" class="px-3 py-2 rounded-lg text-sm font-semibold bg-${color}/20 text-${color} border border-${color}/30 hover:bg-${color}/30 transition-colors">+</button>
            </div>
        `;

        overlay.querySelector('#lib-mgr-add-btn').addEventListener('click', () => {
            const name = document.getElementById('lib-mgr-new-name').value.trim();
            const qty = parseInt(document.getElementById('lib-mgr-new-qty').value) || 1;
            if (!name) { toast('Fyll inn navn', 'error'); return; }
            DB.addLibraryItem({ type: currentType, name, defaultQty: qty });
            toast(`Lagt til i ${typeLabels[currentType].toLowerCase()}-biblioteket`, 'success');
            renderManager(currentType);
        });

        document.getElementById('lib-mgr-new-name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                overlay.querySelector('#lib-mgr-add-btn').click();
            }
        });
    }

    const html = `<div id="lib-manager-overlay" class="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4" style="margin:0;">
        <div class="bg-dark-800 rounded-xl border border-dark-600 p-4 w-full max-w-md max-h-[80vh] flex flex-col">
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold">Bibliotek</h3>
                <button onclick="document.getElementById('lib-manager-overlay').remove()" class="text-gray-500 hover:text-white text-lg">&times;</button>
            </div>
            <div class="flex gap-4 mb-3 border-b border-dark-600">
                ${types.map(t => `<button class="lib-mgr-tab pb-2 text-sm font-medium transition-colors" data-type="${t}">${typeLabels[t]}</button>`).join('')}
            </div>
            <div class="flex-1 overflow-y-auto space-y-1 mb-3" id="lib-mgr-items"></div>
            <div id="lib-mgr-add-section"></div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    document.querySelectorAll('.lib-mgr-tab').forEach(tab => {
        tab.addEventListener('click', () => renderManager(tab.dataset.type));
    });

    renderManager(activeType);
}

function deleteLibItem(id, currentType) {
    DB.deleteLibraryItem(id);
    toast('Fjernet fra biblioteket', 'success');
    const overlay = document.getElementById('lib-manager-overlay');
    if (overlay) {
        overlay.remove();
        showLibraryManager(currentType);
    }
}

// ========================
// Vehicle Trip Planning
// ========================

function showTripPlanner() {
    const activeId = DB.getActiveVehicleId();
    if (!activeId) { toast('Velg en bil først', 'error'); return; }
    const vehicle = DB.getVehicle(activeId);

    const existing = DB.getActiveTrip(activeId);
    if (existing) {
        ContractApp.currentTripId = existing.id;
        showView('vehicle-trip');
        return;
    }

    const contracts = DB.getUpcomingContracts();
    const now = new Date();
    const events = (DB.getEvents() || []).filter(e => {
        if (e.status === 'completed' || e.status === 'cancelled') return false;
        const start = new Date(e.startDate);
        return start >= now || e.status === 'active';
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (contracts.length === 0 && events.length === 0) {
        toast('Ingen kommende kontrakter eller eventer', 'error');
        return;
    }

    let contractsHTML = '';
    if (contracts.length > 0) {
        contractsHTML = `<div class="text-xs font-semibold text-neon-purple uppercase tracking-wider mb-1.5">Kontrakter</div>` +
        contracts.map(c => {
            const dateStr = c.date ? new Date(c.date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }) : '?';
            const eqCount = (c.equipment || []).length;
            return `<label class="flex items-center gap-3 bg-dark-700 rounded-lg p-3 cursor-pointer hover:bg-dark-600 transition-colors">
                <input type="checkbox" value="${c.id}" data-type="contract" class="trip-source-cb rounded">
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">${esc(c.venue || c.clientName)}</div>
                    <div class="text-xs text-gray-500">${esc(c.clientName)} · ${dateStr}${eqCount > 0 ? ` · ${eqCount} utstyr` : ''}</div>
                </div>
            </label>`;
        }).join('');
    }

    let eventsHTML = '';
    if (events.length > 0) {
        eventsHTML = `<div class="text-xs font-semibold text-neon-green uppercase tracking-wider mb-1.5 ${contracts.length > 0 ? 'mt-3' : ''}">Eventer</div>` +
        events.map(ev => {
            const dateStr = new Date(ev.startDate).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
            const eqCount = (ev.equipment || []).length;
            return `<label class="flex items-center gap-3 bg-dark-700 rounded-lg p-3 cursor-pointer hover:bg-dark-600 transition-colors">
                <input type="checkbox" value="${ev.id}" data-type="event" class="trip-source-cb rounded">
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">${esc(ev.name)}</div>
                    <div class="text-xs text-gray-500">${esc(ev.location || '')} · ${dateStr}${eqCount > 0 ? ` · ${eqCount} utstyr` : ''}</div>
                </div>
            </label>`;
        }).join('');
    }

    openModal(`Planlegg tur – ${esc(vehicle.name)}`, `
        <p class="text-sm text-gray-400 mb-3">Velg hvilke arrangementer ${esc(vehicle.name)} skal levere til:</p>
        <div class="space-y-2 mb-4">${contractsHTML}${eventsHTML}</div>
        <button id="btn-create-trip" class="w-full btn-neon py-2.5 rounded-lg font-semibold">Opprett pakkeliste</button>
    `);

    document.getElementById('btn-create-trip').addEventListener('click', () => {
        const checked = [...document.querySelectorAll('.trip-source-cb:checked')];
        if (checked.length === 0) { toast('Velg minst ett arrangement', 'error'); return; }

        const contractIds = checked.filter(cb => cb.dataset.type === 'contract').map(cb => cb.value);
        const eventIds = checked.filter(cb => cb.dataset.type === 'event').map(cb => cb.value);

        const packingData = DB.buildTripPackingList(contractIds, eventIds);
        const trip = DB.addVehicleTrip({
            vehicleId: activeId,
            contractIds,
            eventIds,
            packedItems: packingData.equipment,
            consumableChecks: packingData.consumables,
        });

        ContractApp.currentTripId = trip.id;
        closeModal();
        showView('vehicle-trip');
        toast('Pakkeliste opprettet', 'success');
    });
}

function renderVehicleTrip() {
    const trip = DB.getVehicleTrip(ContractApp.currentTripId);
    if (!trip) { showView('vehicle'); return; }

    const container = document.getElementById('vehicle-trip-content');
    const vehicle = DB.getVehicle(trip.vehicleId);
    const contracts = (trip.contractIds || []).map(id => DB.getContract(id)).filter(Boolean);
    const events = (trip.eventIds || []).map(id => DB.getEvent(id)).filter(Boolean);

    const totalItems = trip.packedItems.length;
    const packedCount = trip.packedItems.filter(i => i.packed).length;
    const pct = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0;
    const allPacked = packedCount === totalItems && totalItems > 0;

    const consumableTotal = trip.consumableChecks.length;
    const consumableChecked = trip.consumableChecks.filter(c => c.checked).length;

    const sourceTags = [
        ...contracts.map(c => {
            const dateStr = c.date ? new Date(c.date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }) : '';
            return `<span class="inline-block px-2 py-0.5 rounded-full text-xs bg-neon-purple/15 text-neon-purple border border-neon-purple/30">${esc(c.venue || c.clientName)} ${dateStr}</span>`;
        }),
        ...events.map(ev => {
            const dateStr = new Date(ev.startDate).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
            return `<span class="inline-block px-2 py-0.5 rounded-full text-xs bg-neon-green/15 text-neon-green border border-neon-green/30">${esc(ev.name)} ${dateStr}</span>`;
        }),
    ].join(' ');

    const itemsHTML = trip.packedItems.map((item, idx) => {
        const contractNames = (item.sources || item.contracts || []).map(n => esc(n)).join(', ');
        return `<div class="check-item ${item.packed ? 'checked' : ''} flex items-center gap-2.5 rounded-lg p-2.5 ${item.packed ? 'bg-dark-700/50' : 'bg-dark-700 hover:bg-dark-600'} cursor-pointer transition-all" onclick="toggleTripPackItem('${trip.id}', ${idx})">
            <div class="w-5 h-5 rounded border-2 ${item.packed ? 'bg-neon-green border-neon-green' : 'border-gray-500'} flex items-center justify-center shrink-0">
                ${item.packed ? '<svg class="w-3 h-3 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
            </div>
            <div class="flex-1 min-w-0">
                <div class="item-name text-sm">${esc(item.name)}</div>
                <div class="text-xs text-gray-500">${item.quantity} stk ${contractNames ? '· ' + contractNames : ''}</div>
            </div>
        </div>`;
    }).join('');

    let consumableHTML = '';
    if (consumableTotal > 0) {
        consumableHTML = `
        <div class="bg-dark-800 rounded-xl border border-neon-yellow/20 p-3">
            <h3 class="text-sm font-semibold text-neon-yellow mb-2 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Har du husket? (${consumableChecked}/${consumableTotal})
            </h3>
            <div class="space-y-1.5">
                ${trip.consumableChecks.map((con, idx) => `
                    <div class="check-item ${con.checked ? 'checked' : ''} flex items-center gap-2.5 rounded-lg p-2 ${con.checked ? 'bg-dark-700/50' : 'bg-dark-700 hover:bg-dark-600'} cursor-pointer transition-all" onclick="toggleTripConsumableItem('${trip.id}', ${idx})">
                        <div class="w-4 h-4 rounded border-2 ${con.checked ? 'bg-neon-yellow border-neon-yellow' : 'border-gray-600'} flex items-center justify-center shrink-0">
                            ${con.checked ? '<svg class="w-2.5 h-2.5 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                        </div>
                        <span class="item-name text-sm">${esc(con.name)}${con.quantity > 0 ? ` (${con.quantity} stk)` : ''}</span>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    container.innerHTML = `
        <div class="flex items-center justify-between mb-1">
            <h2 class="text-xl font-bold">${esc(vehicle?.name || 'Bil')} – Pakking</h2>
            <span class="text-sm font-medium ${allPacked ? 'text-neon-green' : 'text-neon-yellow'}">${packedCount}/${totalItems}</span>
        </div>

        <div class="flex flex-wrap gap-1 mb-3">${sourceTags}</div>

        <div class="w-full bg-dark-600 rounded-full h-2 mb-4">
            <div class="h-2 rounded-full transition-all ${allPacked ? 'bg-neon-green' : 'bg-neon-yellow'}" style="width: ${pct}%"></div>
        </div>

        ${allPacked ? `
        <div class="bg-neon-green/10 border border-neon-green/30 rounded-xl p-3 mb-3 text-center">
            <div class="text-neon-green font-semibold">Alt utstyr er pakket!</div>
            <div class="text-xs text-gray-400 mt-0.5">Sjekk forbruksmateriell nedenfor før avreise</div>
        </div>` : ''}

        <div class="bg-dark-800 rounded-xl border border-neon-green/20 p-3 mb-3">
            <h3 class="text-sm font-semibold text-neon-green mb-2">Utstyr</h3>
            <div class="space-y-1.5">${itemsHTML || '<p class="text-sm text-gray-500 italic">Ingen utstyr</p>'}</div>
        </div>

        ${consumableHTML}

        <div class="flex gap-2 mt-3">
            ${allPacked ? `<button onclick="markTripReady('${trip.id}')" class="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors">Klar for avreise</button>` : ''}
            <button onclick="confirmDeleteTrip('${trip.id}')" class="flex-1 py-2 rounded-lg text-sm text-gray-500 bg-dark-700 hover:bg-dark-600 hover:text-neon-pink transition-colors">Avbryt tur</button>
        </div>
    `;
}

function toggleTripPackItem(tripId, idx) {
    DB.toggleTripItem(tripId, idx);
    renderVehicleTrip();
}

function toggleTripConsumableItem(tripId, idx) {
    DB.toggleTripConsumable(tripId, idx);
    renderVehicleTrip();
}

function markTripReady(tripId) {
    DB.updateVehicleTrip(tripId, { status: 'ready' });
    toast('Bilen er klar for avreise!', 'success');
    showView('vehicle');
}

function confirmDeleteTrip(tripId) {
    openModal('Avbryt tur', `
        <p class="text-sm text-gray-400 mb-4">Er du sikker på at du vil avbryte denne turen? Pakkelisten slettes.</p>
        <div class="flex gap-2">
            <button onclick="DB.deleteVehicleTrip('${tripId}'); closeModal(); showView('vehicle'); toast('Tur avbrutt', 'success');" class="flex-1 py-2 rounded-lg text-sm font-semibold bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/30 transition-colors">Avbryt tur</button>
            <button onclick="closeModal()" class="flex-1 py-2 rounded-lg text-sm text-gray-400 bg-dark-700 hover:bg-dark-600 transition-colors">Tilbake</button>
        </div>
    `);
}
