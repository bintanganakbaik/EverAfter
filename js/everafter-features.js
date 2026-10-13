/* EverAfter feature patch
   Adds safe capsule deletion and English/Bahasa Indonesia UI language switching.
   Load AFTER script.js, navigation-fix.js, and everafter-upgrade.js (if used).
*/
(() => {
    'use strict';

    const LANG_KEY = 'language';
    const EN_ID = {
        'Home': 'Beranda', 'My Capsules': 'Kapsul Saya', 'Archive': 'Arsip', 'The Archive': 'Arsip Kenangan',
        'Timeline': 'Linimasa', 'Settings': 'Pengaturan', 'The Unforgotten': 'Yang Tak Terlupakan',
        'Write something now.': 'Tulis sesuatu sekarang.', 'Seal it. Let time reveal it.': 'Segel. Biarkan waktu mengungkapnya.',
        'Some things are meant to find you later.': 'Ada hal-hal yang memang ditakdirkan untuk kau temukan nanti.',
        'CREATE CAPSULE': 'BUAT KAPSUL', '+ New Capsule': '+ Kapsul Baru', 'New Capsule': 'Kapsul Baru',
        'Active capsules: 0/5': 'Kapsul aktif: 0/5', 'Opened and unsealed memories.': 'Kenangan yang telah terbuka.',
        'Profile': 'Profil', 'Your Name': 'Nama Kamu', 'What should we call you?': 'Kamu ingin dipanggil apa?',
        'Save Profile': 'Simpan Profil', 'Appearance': 'Tampilan', 'Theme': 'Tema',
        'Light (Paper)': 'Terang (Kertas)', 'Dark (Midnight)': 'Gelap (Tengah Malam)',
        'Time Simulation (Demo Mode)': 'Simulasi Waktu (Mode Demo)',
        'Jump forward in time to demonstrate unlocking capsules without waiting.': 'Majukan waktu untuk melihat kapsul terbuka tanpa harus menunggu.',
        'Simulate Date & Time': 'Simulasikan Tanggal & Waktu', 'Start Simulation': 'Mulai Simulasi', 'Reset to Real Time': 'Kembali ke Waktu Nyata',
        'Data Management': 'Pengelolaan Data', 'Export your capsules to a JSON file to back them up, or import an existing backup.': 'Ekspor kapsul ke file JSON sebagai cadangan, atau impor cadangan yang sudah ada.',
        '📥 Export Backup': '📥 Ekspor Cadangan', '📤 Import Backup': '📤 Impor Cadangan', 'Credits': 'Kredit', 'Project': 'Proyek',
        'Creator': 'Pembuat', 'Support and Idea': 'Dukungan dan Ide', 'Note': 'Catatan', 'App Version': 'Versi Aplikasi', 'Contact': 'Kontak',
        'No active capsules. Create one to begin.': 'Belum ada kapsul aktif. Buat kapsul untuk memulai.',
        'Archive is empty.': 'Arsip masih kosong.', 'Created: ': 'Dibuat: ', 'Opens: ': 'Terbuka pada: ',
        'days remaining': 'hari lagi', 'Demo preview — not permanently unlocked': 'Pratinjau demo — belum terbuka secara permanen',
        'Opened on ': 'Dibuka pada ', '🔓 UNLOCKED': '🔓 TERBUKA', '⚠️ SEAL BROKEN': '⚠️ SEGEL RUSAK', '🔒 SEALED': '🔒 TERSEGEL',
        'Remove favorite': 'Hapus dari favorit', 'Add favorite': 'Tambahkan ke favorit', 'Untitled capsule': 'Kapsul tanpa judul',
        'READY TO SEAL?': 'SIAP DISEGEL?', 'Once sealed, this capsule cannot normally be edited until its unlock date.': 'Setelah disegel, kapsul ini biasanya tidak bisa diedit sampai tanggal pembukaannya.',
        'GO BACK': 'KEMBALI', 'SEAL CAPSULE': 'SEGEL KAPSUL', 'BREAK THE SEAL?': 'BUKA SEGEL?',
        'Breaking the seal means opening this capsule before its intended time. It will be permanently marked as "Seal Broken".': 'Membuka segel berarti membuka kapsul sebelum waktunya. Kapsul akan ditandai permanen sebagai "Segel Rusak".',
        'KEEP SEALED': 'BIARKAN TERSEGEL', 'BREAK THE SEAL': 'BUKA SEGEL', 'DEMO MODE ACTIVE': 'MODE DEMO AKTIF',
        'Language': 'Bahasa', 'Language / Bahasa': 'Bahasa / Language', 'Choose the language used across the interface.': 'Pilih bahasa yang digunakan di seluruh antarmuka.',
        'Delete capsule': 'Hapus kapsul', 'Delete archive': 'Hapus arsip', 'Delete': 'Hapus', 'Cancel': 'Batal',
        'Delete this capsule permanently? This cannot be undone.': 'Hapus kapsul ini secara permanen? Tindakan ini tidak bisa dibatalkan.',
        'Delete this archived memory permanently? This cannot be undone.': 'Hapus kenangan dalam arsip ini secara permanen? Tindakan ini tidak bisa dibatalkan.',
        'Capsules cannot be deleted while Demo Mode is active. Turn off Demo Mode first.': 'Kapsul tidak bisa dihapus saat Mode Demo aktif. Matikan Mode Demo terlebih dahulu.',
        'Capsule deleted permanently.': 'Kapsul berhasil dihapus secara permanen.',
        'Capsule sealed successfully.': 'Kapsul berhasil disegel.', 'Please enter a capsule title.': 'Masukkan judul kapsul.',
        'Unlock date must be in the future.': 'Tanggal pembukaan harus berada di masa depan.',
        'Saved data could not be loaded.': 'Data tersimpan tidak dapat dimuat.', 'Storage error. Storage might be full.': 'Kesalahan penyimpanan. Ruang penyimpanan mungkin penuh.',
        'Backup imported successfully.': 'Cadangan berhasil diimpor.', 'Invalid backup file.': 'File cadangan tidak valid.',
        'A capsule can contain up to 5 images. Remove one before adding another.': 'Satu kapsul dapat berisi maksimal 5 gambar. Hapus satu gambar sebelum menambahkan yang lain.',
        'Take a photo': 'Ambil foto', 'Camera access requires permission. Photos stay in this browser.': 'Kamera memerlukan izin. Foto tetap tersimpan di browser ini.',
        'A LETTER FROM YOUR FORMER SELF': 'SURAT DARI DIRIMU DI MASA LALU',
        'Meet the person you were when you sealed these memories.': 'Temui dirimu yang dulu saat menyegel kenangan ini.',
        'FIELD NOTES / 01': 'CATATAN LAPANGAN / 01',
        'Old predictions. Unfinished plans. Questions you once cared enough to ask. This is not a gallery of the past — it is a conversation with it.': 'Prediksi lama. Rencana yang belum selesai. Pertanyaan yang dulu penting bagimu. Ini bukan galeri masa lalu — ini percakapan dengannya.',
        'NOTHING LOST. NOT YET.': 'BELUM ADA YANG HILANG.', 'Your future self is waiting.': 'Dirimu di masa depan sedang menunggu.',
        'Once a time capsule has opened, its old thoughts will find a home here. Until then, keep writing honestly.': 'Setelah kapsul waktu terbuka, pikiran lamamu akan tersimpan di sini. Sampai saat itu tiba, teruslah menulis dengan jujur.',
        'Create a capsule': 'Buat kapsul', 'GOALS YOU LEFT HERE': 'TUJUAN YANG KAMU TINGGALKAN',
        'PREDICTIONS FROM THEN': 'PREDIKSI DARI MASA LALU', 'QUESTIONS YOU ASKED': 'PERTANYAAN YANG PERNAH KAMU AJUKAN',
        'A NOTE FROM THEN': 'CATATAN DARI MASA LALU', 'Revisit the full capsule': 'Buka kembali kapsul lengkap',
        'This capsule holds a memory, but no reflection fields to revisit.': 'Kapsul ini menyimpan kenangan, tetapi tidak memiliki bagian refleksi untuk ditinjau kembali.'
    };
    const ID_EN = Object.fromEntries(Object.entries(EN_ID).map(([en, id]) => [id, en]));

    const app = () => window.app;
    const getLanguage = () => (app()?.data?.settings?.[LANG_KEY] === 'id' ? 'id' : 'en');
    const translate = value => {
        const dict = getLanguage() === 'id' ? EN_ID : ID_EN;
        const trimmed = value.trim();
        const translated = dict[trimmed] || dict[`${trimmed} `];
        if (translated) return value.replace(trimmed, translated);
        if (getLanguage() === 'id') {
            let match = trimmed.match(/^Active capsules: (\d+)\/(\d+)$/);
            if (match) return `Kapsul aktif: ${match[1]}/${match[2]}`;
            match = trimmed.match(/^(\d+) days remaining$/);
            if (match) return `${match[1]} hari lagi`;
        } else {
            let match = trimmed.match(/^Kapsul aktif: (\d+)\/(\d+)$/);
            if (match) return `Active capsules: ${match[1]}/${match[2]}`;
            match = trimmed.match(/^(\d+) hari lagi$/);
            if (match) return `${match[1]} days remaining`;
        }
        return value;
    };

    function shouldSkipTextNode(node) {
        const parent = node.parentElement;
        if (!parent) return true;
        if (parent.closest('script, style, textarea, input, select, option, code, pre, .letter-content, .final-message, #read-letter, #read-short-message, .ea-memory-fragments blockquote, .ea-memory-fragments li, .ea-memory-closing, .capsule-card h3')) return true;
        return false;
    }

    function translateDOM(root = document.body) {
        if (!root || !root.ownerDocument && root !== document.body) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            if (shouldSkipTextNode(node)) return;
            const next = translate(node.nodeValue || '');
            if (next !== node.nodeValue) node.nodeValue = next;
        });
        root.querySelectorAll?.('[placeholder]').forEach(el => {
            const next = translate(el.getAttribute('placeholder'));
            if (next !== el.getAttribute('placeholder')) el.setAttribute('placeholder', next);
        });
        root.querySelectorAll?.('[aria-label]').forEach(el => {
            const next = translate(el.getAttribute('aria-label'));
            if (next !== el.getAttribute('aria-label')) el.setAttribute('aria-label', next);
        });
        root.querySelectorAll?.('option').forEach(el => {
            const next = translate(el.textContent || '');
            if (next !== el.textContent) el.textContent = next;
        });
    }

    function setLanguage(language) {
        const instance = app();
        if (!instance?.data?.settings) return;
        instance.data.settings[LANG_KEY] = language === 'id' ? 'id' : 'en';
        instance.saveData?.();
        document.documentElement.lang = language === 'id' ? 'id' : 'en';
        const select = document.getElementById('ea-language-select');
        if (select) select.value = instance.data.settings[LANG_KEY];
        translateDOM();
        // Re-render cards so dynamically generated labels/statuses use the selected language.
        instance.renderDashboard?.();
        instance.renderArchive?.();
        instance.renderTimeline?.();
        if (typeof window.renderUnforgotten === 'function') window.renderUnforgotten();
        translateDOM();
    }

    function addLanguageSetting() {
        const settings = document.getElementById('view-settings');
        if (!settings || document.getElementById('ea-language-select')) return;
        const section = document.createElement('div');
        section.className = 'form-section ea-language-section';
        section.innerHTML = `
            <h2 data-ea-language-heading>Language / Bahasa</h2>
            <p class="text-muted mb-4" data-ea-language-description>Choose the language used across the interface.</p>
            <div class="input-group">
                <label for="ea-language-select">Language / Bahasa</label>
                <select id="ea-language-select" aria-label="Language">
                    <option value="en">English</option>
                    <option value="id">Bahasa Indonesia</option>
                </select>
            </div>`;
        const appearance = Array.from(settings.querySelectorAll('.form-section')).find(el => /Appearance|Tampilan/.test(el.textContent));
        if (appearance) appearance.insertAdjacentElement('afterend', section);
        else settings.appendChild(section);
        const select = section.querySelector('select');
        select.value = getLanguage();
        select.addEventListener('change', () => setLanguage(select.value));
    }

    function styleFeatureUI() {
        if (document.getElementById('ea-feature-styles')) return;
        const style = document.createElement('style');
        style.id = 'ea-feature-styles';
        style.textContent = `
            .capsule-card .ea-delete-capsule { position:absolute; top:59px; right:17px; z-index:3; width:34px; height:34px; display:grid; place-items:center; border:1px solid var(--border-color); border-radius:50%; color:var(--danger-color); background:var(--surface-color); cursor:pointer; font-size:1rem; transition:background .2s ease,transform .2s ease; }
            .capsule-card .ea-delete-capsule:hover { background:var(--danger-soft); transform:scale(1.06); }
            .capsule-card .ea-delete-capsule:focus-visible { outline:2px solid var(--accent-color); outline-offset:2px; }
            .ea-language-section select { width:100%; }
        `;
        document.head.appendChild(style);
    }

    function addDeleteButton(card, capsule) {
        if (!card || !capsule || card.querySelector('.ea-delete-capsule')) return card;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ea-delete-capsule';
        button.innerHTML = '<span aria-hidden="true">⌫</span>';
        button.setAttribute('aria-label', getLanguage() === 'id' ? 'Hapus kapsul' : 'Delete capsule');
        button.title = getLanguage() === 'id' ? 'Hapus kapsul' : 'Delete capsule';
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const instance = app();
            if (!instance) return;
            if (instance.data?.settings?.demoMode) {
                window.alert(getLanguage() === 'id'
                    ? 'Kapsul tidak bisa dihapus saat Mode Demo aktif. Matikan Mode Demo terlebih dahulu.'
                    : 'Capsules cannot be deleted while Demo Mode is active. Turn off Demo Mode first.');
                return;
            }
            const archived = capsule.status !== 'sealed';
            const message = getLanguage() === 'id'
                ? (archived ? 'Hapus kenangan dalam arsip ini secara permanen? Tindakan ini tidak bisa dibatalkan.' : 'Hapus kapsul ini secara permanen? Tindakan ini tidak bisa dibatalkan.')
                : (archived ? 'Delete this archived memory permanently? This cannot be undone.' : 'Delete this capsule permanently? This cannot be undone.');
            if (!window.confirm(message)) return;
            instance.data.capsules = instance.data.capsules.filter(item => item.id !== capsule.id);
            instance.saveData?.();
            if (instance.state?.activeCapsuleId === capsule.id) instance.state.activeCapsuleId = null;
            instance.renderDashboard?.();
            instance.renderArchive?.();
            instance.renderTimeline?.();
            if (typeof window.renderUnforgotten === 'function') window.renderUnforgotten();
            const toast = getLanguage() === 'id' ? 'Kapsul berhasil dihapus secara permanen.' : 'Capsule deleted permanently.';
            instance.showToast?.(toast);
            translateDOM();
        });
        card.appendChild(button);
        return card;
    }

    function installDeleteFeature() {
        const instance = app();
        if (!instance || instance.__eaDeleteFeatureInstalled || typeof instance.createCapsuleCard !== 'function') return;
        const original = instance.createCapsuleCard;
        instance.createCapsuleCard = function (capsule) {
            const card = original.call(this, capsule);
            return addDeleteButton(card, capsule);
        };
        instance.__eaDeleteFeatureInstalled = true;
        document.querySelectorAll('.capsule-card').forEach(card => {
            const title = card.querySelector('h3')?.textContent;
            const capsule = instance.data.capsules.find(item => (item.title || 'Untitled capsule') === title);
            if (capsule) addDeleteButton(card, capsule);
        });
    }

    function init() {
        const instance = app();
        if (!instance) return;
        if (!instance.data.settings) instance.data.settings = {};
        if (!instance.data.settings[LANG_KEY]) instance.data.settings[LANG_KEY] = 'en';
        styleFeatureUI();
        addLanguageSetting();
        installDeleteFeature();
        document.documentElement.lang = getLanguage() === 'id' ? 'id' : 'en';
        translateDOM();

        const observer = new MutationObserver(records => {
            let shouldTranslate = false;
            for (const record of records) {
                if (record.type === 'childList' || record.type === 'characterData') { shouldTranslate = true; break; }
            }
            if (shouldTranslate) translateDOM();
            installDeleteFeature();
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), { once: true });
    else setTimeout(init, 0);
})();
