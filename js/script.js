'use strict';

const App = {
    data: {
        profile: { name: '' },
        capsules: [],
        settings: { theme: 'light', demoMode: false, simulatedTime: null }
    },

    state: {
        currentImages: [],
        currentView: 'view-home',
        activeCapsuleId: null,
        countdownInterval: null,
        lastListRoute: 'view-dashboard'
    },

    // Compatibility with the existing HTML Back button.
    get lastListRoute() {
        return this.state.lastListRoute;
    },

    set lastListRoute(value) {
        this.state.lastListRoute = value;
    },

    // --- STORAGE ---
    loadData() {
        try {
            const saved = localStorage.getItem('timeCapsule_data');
            if (!saved) return;

            const parsed = JSON.parse(saved);
            this.data = parsed && typeof parsed === 'object'
                ? parsed
                : this.data;

            if (!Array.isArray(this.data.capsules)) {
                this.data.capsules = [];
            }

            if (!this.data.profile) {
                this.data.profile = { name: '' };
            }

            if (!this.data.settings) {
                this.data.settings = {};
            }

            if (!('theme' in this.data.settings)) {
                this.data.settings.theme = 'light';
            }

            if (!('demoMode' in this.data.settings)) {
                this.data.settings.demoMode = false;
            }

            if (!('simulatedTime' in this.data.settings)) {
                this.data.settings.simulatedTime = null;
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Saved data could not be loaded.', 'error');
        }
    },

    saveData() {
        try {
            localStorage.setItem(
                'timeCapsule_data',
                JSON.stringify(this.data)
            );
        } catch (error) {
            console.error('Storage error:', error);
            this.showToast(
                'Storage error. Storage might be full.',
                'error'
            );
        }
    },

    // --- TIME SYSTEM ---
    getNow() {
        if (
            this.data.settings.demoMode &&
            this.data.settings.simulatedTime
        ) {
            const simulated = new Date(
                this.data.settings.simulatedTime
            );

            if (!Number.isNaN(simulated.getTime())) {
                return simulated;
            }
        }

        return new Date();
    },

    getCapsuleDisplayStatus(capsule) {
        if (capsule.status === 'seal_broken') {
            return 'seal_broken';
        }

        if (capsule.status === 'unlocked') {
            return 'unlocked';
        }

        if (
            this.data.settings.demoMode &&
            capsule.status === 'sealed' &&
            this.getNow() >= new Date(capsule.unlockAt)
        ) {
            return 'unlocked';
        }

        return 'sealed';
    },

    formatDate(value) {
        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? 'Unknown date'
            : date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
    },

    formatDateTime(value) {
        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? 'Unknown date'
            : date.toLocaleString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
    },

    // --- INITIALIZATION ---
    init() {
        this.loadData();
        this.applySettings();
        this.setupNavigation();
        this.setupCreateForm();

        const greeting = document.getElementById('nav-greeting');
        const nameInput = document.getElementById('setting-name');

        if (this.data.profile.name) {
            if (greeting) {
                greeting.innerText =
                    `Welcome back, ${this.data.profile.name}.`;
            }

            if (nameInput) {
                nameInput.value = this.data.profile.name;
            }
        }

        const hash = window.location.hash.slice(1);
        const initial = hash && this.isView(hash)
            ? hash
            : 'view-home';

        this.navigateTo(initial, false);

        // Keep navigation synchronized with the browser URL.
        window.addEventListener('hashchange', () => {
            const requested = window.location.hash.slice(1);

            this.navigateTo(
                this.isView(requested) ? requested : 'view-home',
                false
            );
        });

        setInterval(() => this.checkUnlocks(), 10000);
        this.checkUnlocks();
    },

    isView(viewId) {
        const element = typeof viewId === 'string'
            ? document.getElementById(viewId)
            : null;

        return !!element && element.classList.contains('view');
    },

    applySettings() {
        const theme = this.data.settings.theme || 'light';

        this.changeTheme(theme);

        const themeSelect = document.getElementById('setting-theme');
        if (themeSelect) {
            themeSelect.value = theme;
        }

        const timeInput = document.getElementById('setting-demo-time');

        if (
            this.data.settings.demoMode &&
            this.data.settings.simulatedTime
        ) {
            if (timeInput) {
                timeInput.value =
                    this.data.settings.simulatedTime.slice(0, 16);
            }

            this.updateDemoWidget();
        } else {
            const widget = document.getElementById('demo-widget');

            if (widget) {
                widget.style.display = 'none';
            }
        }
    },

    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', event => {
                event.preventDefault();

                const target = link.getAttribute('data-target');

                if (target) {
                    this.navigateTo(target);
                }
            });
        });

        // Fix tombol Back pada halaman pembacaan kapsul.
        // Hapus inline handler agar tidak terjadi navigasi ganda.
        document.querySelectorAll(
            'button[onclick*="lastListRoute"]'
        ).forEach(button => {
            button.removeAttribute('onclick');
            button.setAttribute('type', 'button');

            button.addEventListener('click', event => {
                event.preventDefault();

                const previousView = this.state.lastListRoute;

                const destination = (
                    this.isView(previousView) &&
                    [
                        'view-dashboard',
                        'view-archive',
                        'view-timeline'
                    ].includes(previousView)
                )
                    ? previousView
                    : 'view-dashboard';

                this.navigateTo(destination);
            });
        });
    },

    // --- NAVIGATION ---
    navigateTo(viewId, updateHash = true) {
        // Never hide all views because of an invalid route.
        if (!this.isView(viewId)) {
            viewId = this.isView(this.state.lastListRoute)
                ? this.state.lastListRoute
                : 'view-home';
        }

        if (!this.isView(viewId)) return;

        if (
            viewId === 'view-capsule' &&
            [
                'view-dashboard',
                'view-archive',
                'view-timeline'
            ].includes(this.state.currentView)
        ) {
            this.state.lastListRoute = this.state.currentView;
        }

        const targetView = document.getElementById(viewId);

        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view === targetView);
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle(
                'active',
                link.getAttribute('data-target') === viewId
            );
        });

        this.state.currentView = viewId;

        if (
            updateHash &&
            window.location.hash !== `#${viewId}`
        ) {
            window.location.hash = viewId;
        }

        clearInterval(this.state.countdownInterval);
        this.state.countdownInterval = null;

        if (viewId === 'view-dashboard') {
            this.state.lastListRoute = viewId;
            this.renderDashboard();
        } else if (viewId === 'view-archive') {
            this.state.lastListRoute = viewId;
            this.renderArchive();
        } else if (viewId === 'view-timeline') {
            this.state.lastListRoute = viewId;
            this.renderTimeline();
        } else if (
            viewId === 'view-capsule' &&
            this.state.activeCapsuleId
        ) {
            this.renderActiveCapsule();
        }
    },

    // --- CAPSULE BACK NAVIGATION ---
    backFromCapsule() {
        const previousView = this.state.lastListRoute;

        const allowedViews = [
            'view-dashboard',
            'view-archive',
            'view-timeline'
        ];

        const destination = allowedViews.includes(previousView)
            ? previousView
            : 'view-dashboard';

        this.state.activeCapsuleId = null;
        clearInterval(this.state.countdownInterval);
        this.state.countdownInterval = null;

        this.navigateTo(destination);
    },

    // --- PROFILE & SETTINGS ---
    saveProfile() {
        const input = document.getElementById('setting-name');
        const name = input ? input.value.trim() : '';

        this.data.profile.name = name;
        this.saveData();

        const greeting = document.getElementById('nav-greeting');

        if (greeting) {
            greeting.innerText = name
                ? `Welcome back, ${name}.`
                : 'Welcome.';
        }

        this.showToast('Profile saved.');
    },

    changeTheme(theme) {
        this.data.settings.theme = theme || 'light';

        document.body.setAttribute(
            'data-theme',
            this.data.settings.theme
        );

        this.saveData();
    },

    // --- DEMO MODE PASSWORD GATE ---
    enableDemoMode() {
        const password = prompt('Enter the Demo Mode password:');

        if (password === null) {
            this.showToast('Demo Mode cancelled.');
            return;
        }

        if (password !== 'sayaadalahpenguji') {
            this.showToast('Incorrect password.', 'error');
            return;
        }

        const input = document.getElementById('setting-demo-time');
        const timeInput = input ? input.value : '';

        if (!timeInput) {
            this.showToast(
                'Please select a simulated time.',
                'error'
            );
            return;
        }

        const simulatedDate = new Date(timeInput);

        if (Number.isNaN(simulatedDate.getTime())) {
            this.showToast('Invalid simulated time.', 'error');
            return;
        }

        this.data.settings.demoMode = true;
        this.data.settings.simulatedTime =
            simulatedDate.toISOString();

        // Simulation previews unlocks without permanently opening capsules.
        this.saveData();
        this.updateDemoWidget();
        this.checkUnlocks();
        this.showToast('Time simulation activated.');
    },

    disableDemoMode() {
        this.data.settings.demoMode = false;
        this.data.settings.simulatedTime = null;

        this.saveData();

        const widget = document.getElementById('demo-widget');

        if (widget) {
            widget.style.display = 'none';
        }

        clearInterval(this.state.countdownInterval);
        this.state.countdownInterval = null;

        this.checkUnlocks();

        if (
            this.state.currentView === 'view-capsule' &&
            this.state.activeCapsuleId
        ) {
            this.openCapsuleView(this.state.activeCapsuleId);
        }

        this.showToast('Returned to real time.');
    },

    updateDemoWidget() {
        const widget = document.getElementById('demo-widget');
        const timeLabel = document.getElementById('demo-widget-time');

        if (!widget) return;

        if (
            this.data.settings.demoMode &&
            this.data.settings.simulatedTime
        ) {
            widget.style.display = 'block';

            if (timeLabel) {
                timeLabel.innerText = this.formatDateTime(
                    this.data.settings.simulatedTime
                );
            }
        } else {
            widget.style.display = 'none';
        }
    },
    // --- FORM HANDLING ---

    // --- SOCIAL MEDIA MEMORIES ---
    addSocialAccount() {
        const container = document.getElementById('create-social-accounts');

        if (!container) {
            this.showToast('Social media form not found.', 'error');
            return;
        }

        const id = `social-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const item = document.createElement('div');
        item.className = 'dynamic-item';
        item.dataset.socialAccount = 'true';
        item.id = id;

        const group = document.createElement('div');
        group.className = 'input-group';
        group.style.flex = '1';

        const platformLabel = document.createElement('label');
        platformLabel.textContent = 'Social Media Name';

        const platformInput = document.createElement('input');
        platformInput.type = 'text';
        platformInput.className = 'social-platform-input';
        platformInput.placeholder = 'e.g. Instagram, TikTok, X';
        platformInput.maxLength = 50;

        const usernameLabel = document.createElement('label');
        usernameLabel.textContent = 'Username or Profile Link';

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.className = 'social-username-input';
        usernameInput.placeholder = '@username or profile URL';
        usernameInput.maxLength = 300;

        group.append(
            platformLabel,
            platformInput,
            usernameLabel,
            usernameInput
        );

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-btn';
        removeButton.textContent = '✕';
        removeButton.setAttribute('aria-label', 'Remove social media account');

        removeButton.addEventListener('click', () => {
            item.remove();
        });

        item.append(group, removeButton);
        container.appendChild(item);

        platformInput.focus();
    },

    setupCreateForm() {
        const songsContainer = document.getElementById('create-songs');

        if (songsContainer) {
            songsContainer.innerHTML = '';

            for (let i = 1; i <= 3; i++) {
                songsContainer.insertAdjacentHTML('beforeend', `
                    <div class="input-group" style="background:rgba(0,0,0,0.02);padding:1rem;border-radius:var(--radius-md);">
                        <label>#${i} Song</label>
                        <div style="display:flex;gap:10px;margin-bottom:10px;">
                            <input type="text" id="song-title-${i}" placeholder="Title" style="flex:1;">
                            <input type="text" id="song-artist-${i}" placeholder="Artist" style="flex:1;">
                        </div>
                        <input type="text" id="song-reason-${i}" placeholder="Why this song? (Optional)">
                    </div>
                `);
            }
        }

        if (document.getElementById('create-goals-list')) {
            this.addDynamicItem('goals', 'A goal...');
        }

        if (document.getElementById('create-predictions-list')) {
            this.addDynamicItem('predictions', 'A prediction...');
        }

        if (document.getElementById('create-qa-list')) {
            this.addQAPair();
        }
    },

    addDynamicItem(type, placeholder) {
        const list = document.getElementById(`create-${type}-list`);
        if (!list) return;

        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const div = document.createElement('div');
        div.className = 'dynamic-item';
        div.id = `item-${id}`;

        const safePlaceholder = String(placeholder || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        div.innerHTML = `
            <div class="input-group">
                <input
                    type="text"
                    class="${type}-input"
                    placeholder="${safePlaceholder}"
                >
            </div>
            <button
                type="button"
                class="remove-btn"
                onclick="document.getElementById('item-${id}').remove()"
            >✕</button>
        `;

        list.appendChild(div);
    },

    addQAPair() {
        const list = document.getElementById('create-qa-list');
        if (!list) return;

        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const div = document.createElement('div');
        div.className = 'dynamic-item';
        div.style.flexDirection = 'column';
        div.id = `qa-${id}`;

        div.innerHTML = `
            <div style="display:flex;width:100%;gap:10px;">
                <div style="flex-grow:1;display:flex;flex-direction:column;gap:10px;background:rgba(0,0,0,0.02);padding:1rem;border-radius:var(--radius-md);">
                    <input
                        type="text"
                        class="qa-q"
                        placeholder="Question (e.g., What am I afraid of right now?)"
                    >
                    <input
                        type="text"
                        class="qa-a"
                        placeholder="Answer"
                    >
                </div>
                <button
                    type="button"
                    class="remove-btn"
                    onclick="document.getElementById('qa-${id}').remove()"
                >✕</button>
            </div>
        `;

        list.appendChild(div);
    },

    handleImageSelect(event) {
        const files = event.target.files;
        if (!files || !files.length) return;

        if (this.state.currentImages.length + files.length > 5) {
            this.showToast('Maximum 5 images allowed.', 'error');
            event.target.value = '';
            return;
        }

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();

            reader.onload = e => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scale = Math.min(1, 800 / img.width);

                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);

                    const context = canvas.getContext('2d');

                    if (!context) {
                        this.showToast(
                            'Could not process this image.',
                            'error'
                        );
                        return;
                    }

                    context.drawImage(
                        img,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    this.state.currentImages.push({
                        id: `${Date.now()}-${Math.random()}`,
                        data: canvas.toDataURL('image/jpeg', 0.7)
                    });

                    this.renderImagePreviews();
                };

                img.src = e.target.result;
            };

            reader.readAsDataURL(file);
        });

        event.target.value = '';
    },

    renderImagePreviews() {
        const container = document.getElementById(
            'create-image-previews'
        );

        if (!container) return;

        container.innerHTML = '';

        this.state.currentImages.forEach(image => {
            const wrapper = document.createElement('div');
            wrapper.className = 'img-preview-wrapper';

            const img = document.createElement('img');
            img.src = image.data;
            img.className = 'img-preview';
            img.alt = 'Capsule image preview';

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'img-remove';
            remove.textContent = '✕';
            remove.setAttribute('aria-label', 'Remove image');

            remove.addEventListener('click', () => {
                this.removeImage(image.id);
            });

            wrapper.append(img, remove);
            container.appendChild(wrapper);
        });
    },

    removeImage(id) {
        this.state.currentImages = this.state.currentImages.filter(
            image => image.id != id
        );

        this.renderImagePreviews();
    },

    // --- CAPSULE CREATION ---
    initiateSeal() {
        const activeCount = this.data.capsules.filter(
            capsule => capsule.status === 'sealed'
        ).length;

        if (activeCount >= 5) {
            this.showToast(
                "You've reached the limit of 5 active capsules.",
                'error'
            );
            return;
        }

        const input = document.getElementById('create-unlock');
        const unlockDate = new Date(input ? input.value : '');

        if (
            !input ||
            !input.value ||
            Number.isNaN(unlockDate.getTime()) ||
            unlockDate <= this.getNow()
        ) {
            this.showToast(
                'Unlock date must be in the future.',
                'error'
            );
            return;
        }

        const modal = document.getElementById('modal-seal');

        if (modal) {
            modal.classList.add('active');
        }
    },

    confirmSeal() {
        this.closeModal('modal-seal');

        const values = selector =>
            Array.from(document.querySelectorAll(selector))
                .map(input => input.value.trim())
                .filter(Boolean);

        const goals = values('.goals-input');
        const predictions = values('.predictions-input');

        const customQuestions = Array.from(
            document.querySelectorAll('#create-qa-list .dynamic-item')
        ).map(div => ({
            question: (div.querySelector('.qa-q')?.value || '').trim(),
            answer: (div.querySelector('.qa-a')?.value || '').trim()
        })).filter(item => item.question && item.answer);


        const socialAccounts = Array.from(
            document.querySelectorAll(
                '#create-social-accounts [data-social-account="true"]'
            )
        ).map(item => ({
            platform: (
                item.querySelector('.social-platform-input')?.value || ''
            ).trim(),
            username: (
                item.querySelector('.social-username-input')?.value || ''
            ).trim()
        })).filter(item => item.platform || item.username);


        const songs = [];

        for (let i = 1; i <= 3; i++) {
            const title =
                document.getElementById(`song-title-${i}`)?.value.trim() || '';

            const artist =
                document.getElementById(`song-artist-${i}`)?.value.trim() || '';

            const reason =
                document.getElementById(`song-reason-${i}`)?.value.trim() || '';

            if (title) {
                songs.push({ rank: i, title, artist, reason });
            }
        }

        const getValue = id =>
            document.getElementById(id)?.value || '';

        const unlockDate = new Date(getValue('create-unlock'));

        if (!getValue('create-title').trim()) {
            this.showToast('Please enter a capsule title.', 'error');
            return;
        }

        if (
            Number.isNaN(unlockDate.getTime()) ||
            unlockDate <= this.getNow()
        ) {
            this.showToast(
                'Unlock date must be in the future.',
                'error'
            );
            return;
        }

        const newCapsule = {
            id: (window.crypto && crypto.randomUUID)
                ? crypto.randomUUID()
                : `cap_${Date.now()}_${Math.random().toString(16).slice(2)}`,

            title: getValue('create-title').trim(),
            createdAt: this.getNow().toISOString(),
            unlockAt: unlockDate.toISOString(),
            status: 'sealed',
            favorite: false,
            theme: getValue('create-theme') || 'paper',
            letter: getValue('create-letter'),
            images: this.state.currentImages.map(image => image.data),
            favoriteSongs: songs,
            socialAccounts,
            goals,
            predictions,
            customQuestions,
            shortMessage: getValue('create-short-message'),
            thenNow: { currentAnswers: {} }
        };

        this.data.capsules.push(newCapsule);
        this.saveData();

        const form = document.getElementById('create-capsule-form');

        if (form) {
            form.reset();
        }

        this.state.currentImages = [];
        this.renderImagePreviews();

        this.showToast('Capsule sealed successfully.');
        this.navigateTo('view-dashboard');
    },

    // --- RENDERING LISTS ---
    renderDashboard() {
        const active = this.data.capsules.filter(
            capsule => capsule.status === 'sealed'
        );

        const count = document.getElementById('capsule-limit-text');

        if (count) {
            count.innerText = `Active capsules: ${active.length}/5`;
        }

        const button = document.getElementById('btn-dashboard-create');

        if (button) {
            button.style.display =
                active.length >= 5 ? 'none' : 'block';
        }

        const grid = document.getElementById('active-capsules-grid');
        if (!grid) return;

        grid.innerHTML = active.length
            ? ''
            : '<p class="text-muted">No active capsules. Create one to begin.</p>';

        active.forEach(capsule => {
            grid.appendChild(this.createCapsuleCard(capsule));
        });
    },

    renderArchive() {
        const archived = this.data.capsules.filter(
            capsule => capsule.status !== 'sealed'
        );

        archived.sort(
            (a, b) =>
                new Date(b.openedAt || 0) - new Date(a.openedAt || 0)
        );

        const grid = document.getElementById('archive-capsules-grid');
        if (!grid) return;

        grid.innerHTML = archived.length
            ? ''
            : '<p class="text-muted">Archive is empty.</p>';

        archived.forEach(capsule => {
            grid.appendChild(this.createCapsuleCard(capsule));
        });
    },

    createCapsuleCard(capsule) {
        const card = document.createElement('div');
        const status = this.getCapsuleDisplayStatus(capsule);

        card.className =
            `capsule-card ${status === 'seal_broken' ? 'broken' : status} theme-${capsule.theme || 'paper'}`;

        const favorite = !!capsule.favorite;

        const statusText = status === 'unlocked'
            ? '🔓 UNLOCKED'
            : status === 'seal_broken'
                ? '⚠️ SEAL BROKEN'
                : '🔒 SEALED';

        let extra = '';

        if (status === 'sealed') {
            const days = Math.max(
                0,
                Math.ceil(
                    (new Date(capsule.unlockAt) - this.getNow()) /
                    86400000
                )
            );

            extra = `<div class="countdown">${days} days remaining</div>`;
        } else if (
            this.data.settings.demoMode &&
            capsule.status === 'sealed'
        ) {
            extra = `
                <div class="countdown" style="border:none;padding:0;text-align:left;">
                    Demo preview — not permanently unlocked
                </div>
            `;
        } else {
            extra = `
                <div class="countdown" style="border:none;padding:0;text-align:left;">
                    Opened on ${this.formatDate(capsule.openedAt)}
                </div>
            `;
        }

        const favoriteButton = document.createElement('button');

        favoriteButton.className =
            `fav-btn ${favorite ? 'active' : ''}`;

        favoriteButton.type = 'button';
        favoriteButton.textContent = favorite ? '♥' : '♡';

        favoriteButton.setAttribute(
            'aria-label',
            favorite ? 'Remove favorite' : 'Add favorite'
        );

        favoriteButton.addEventListener('click', event => {
            event.stopPropagation();
            this.toggleFavorite(capsule.id);
        });

        const statusDiv = document.createElement('div');

        statusDiv.className =
            `card-status ${status === 'seal_broken' ? 'broken' : status}`;

        statusDiv.innerHTML = `<span>${statusText}</span>`;

        const title = document.createElement('h3');
        title.textContent = capsule.title || 'Untitled capsule';

        const dates = document.createElement('div');
        dates.className = 'card-dates';

        dates.append(
            'Created: ',
            this.formatDate(capsule.createdAt),
            document.createElement('br'),
            'Opens: ',
            this.formatDate(capsule.unlockAt)
        );

        const extraDiv = document.createElement('div');
        extraDiv.innerHTML = extra;

        card.append(favoriteButton, statusDiv, title, dates, extraDiv);

        card.addEventListener('click', () => {
            this.openCapsuleView(capsule.id);
        });

        return card;
    },

    toggleFavorite(id) {
        const capsule = this.data.capsules.find(
            item => item.id === id
        );

        if (!capsule) return;

        capsule.favorite = !capsule.favorite;
        this.saveData();

        if (this.state.currentView === 'view-dashboard') {
            this.renderDashboard();
        }

        if (this.state.currentView === 'view-archive') {
            this.renderArchive();
        }
    },

    // --- TIMELINE ---
    renderTimeline() {
        const container = document.getElementById('timeline-container');
        if (!container) return;

        container.innerHTML = '';

        const sorted = [...this.data.capsules].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        if (!sorted.length) {
            container.innerHTML = `
                <p class="text-muted" style="padding-left:20px;">
                    Timeline is empty.
                </p>
            `;
            return;
        }

        let currentYear = '';

        sorted.forEach(capsule => {
            const date = new Date(capsule.createdAt);
            const year = date.getFullYear();

            if (year !== currentYear) {
                const heading = document.createElement('h2');

                heading.style.cssText =
                    'padding-left:40px;margin-bottom:1rem;color:var(--accent-color);';

                heading.textContent = year;
                container.appendChild(heading);
                currentYear = year;
            }

            const status = this.getCapsuleDisplayStatus(capsule);

            const item = document.createElement('div');
            item.className =
                `timeline-item ${status !== 'sealed' ? 'unlocked' : ''}`;

            const icon = status === 'sealed'
                ? '🔒'
                : status === 'seal_broken'
                    ? '⚠️'
                    : '🔓';

            let text = `Unlocks ${this.formatDate(capsule.unlockAt)}`;

            if (status === 'seal_broken') {
                text = 'Seal broken';
            } else if (status === 'unlocked') {
                text = this.data.settings.demoMode &&
                    capsule.status === 'sealed'
                    ? 'Demo preview'
                    : 'Opened';
            }

            const dateLabel = document.createElement('div');
            dateLabel.className = 'timeline-date';

            dateLabel.textContent = date.toLocaleDateString(
                undefined,
                { month: 'short', day: 'numeric' }
            );

            const card = document.createElement('div');

            card.style.cssText = `
                background:var(--surface-color);
                padding:1rem;
                border-radius:var(--radius-md);
                border:1px solid var(--border-color);
                display:inline-block;
                min-width:200px;
            `;

            const strong = document.createElement('strong');
            strong.textContent = capsule.title || 'Untitled capsule';

            card.append(strong, document.createTextNode(` ${icon}`));

            const statusLabel = document.createElement('div');

            statusLabel.style.cssText =
                'font-size:.8rem;color:var(--text-muted);margin-top:5px;';

            statusLabel.textContent = text;
            card.appendChild(statusLabel);

            item.append(document.createElement('div'), dateLabel, card);
            item.firstChild.className = 'timeline-dot';

            container.appendChild(item);
        });
    },

    // --- VIEW CAPSULE ---
    openCapsuleView(id) {
        const capsule = this.data.capsules.find(
            item => item.id === id
        );

        if (!capsule) {
            this.showToast('Capsule not found.', 'error');
            return;
        }

        // Simpan halaman daftar asal sebelum membuka kapsul.
        const currentView = this.state.currentView;

        if (
            [
                'view-dashboard',
                'view-archive',
                'view-timeline'
            ].includes(currentView)
        ) {
            this.state.lastListRoute = currentView;
        }

        this.state.activeCapsuleId = id;

        // navigateTo() sudah memanggil renderActiveCapsule().
        // Tidak perlu merendernya untuk kedua kalinya.
        this.navigateTo('view-capsule');
    },

    renderActiveCapsule() {
        const capsule = this.data.capsules.find(
            item => item.id === this.state.activeCapsuleId
        );

        if (!capsule) {
            this.navigateTo(
                this.state.lastListRoute || 'view-dashboard'
            );
            return;
        }

        const container = document.getElementById('capsule-container');

        if (container) {
            container.className =
                `capsule-reading-view theme-${capsule.theme || 'paper'}`;
        }

        const locked = document.getElementById('capsule-locked-content');
        const unlocked = document.getElementById('capsule-unlocked-content');

        const status = this.getCapsuleDisplayStatus(capsule);

        if (status === 'sealed') {
            if (locked) locked.classList.remove('hidden');
            if (unlocked) unlocked.classList.add('hidden');

            const title = document.getElementById('locked-title');
            const created = document.getElementById('locked-created');
            const opens = document.getElementById('locked-unlocks');

            if (title) {
                title.innerText = capsule.title || 'Untitled capsule';
            }

            if (created) {
                created.innerText = this.formatDate(capsule.createdAt);
            }

            if (opens) {
                opens.innerText = this.formatDateTime(capsule.unlockAt);
            }

            this.startCountdown(capsule.unlockAt);
        } else {
            if (locked) locked.classList.add('hidden');
            if (unlocked) unlocked.classList.remove('hidden');

            this.renderUnlockedContent(capsule);
        }
    },

    startCountdown(targetDateStr) {
        clearInterval(this.state.countdownInterval);

        const target = new Date(targetDateStr).getTime();

        const update = () => {
            const diff = target - this.getNow().getTime();

            if (diff <= 0) {
                clearInterval(this.state.countdownInterval);
                this.state.countdownInterval = null;
                this.checkUnlocks();
                return;
            }

            const units = {
                'cd-d': Math.floor(diff / 86400000),
                'cd-h': Math.floor((diff % 86400000) / 3600000),
                'cd-m': Math.floor((diff % 3600000) / 60000),
                'cd-s': Math.floor((diff % 60000) / 1000)
            };

            Object.entries(units).forEach(([id, value]) => {
                const element = document.getElementById(id);

                if (element) {
                    element.innerText = String(value).padStart(2, '0');
                }
            });
        };

        update();
        this.state.countdownInterval = setInterval(update, 1000);
    },

    renderUnlockedContent(capsule) {
        const status = this.getCapsuleDisplayStatus(capsule);

        const setText = (id, value) => {
            const element = document.getElementById(id);

            if (element) {
                element.innerText = value ?? '';
            }
        };

        setText(
            'read-title',
            (capsule.title || 'Untitled capsule') +
            (status === 'seal_broken' ? ' (Seal Broken)' : '')
        );

        setText('read-created', this.formatDate(capsule.createdAt));

        if (
            this.data.settings.demoMode &&
            capsule.status === 'sealed' &&
            status === 'unlocked'
        ) {
            setText(
                'read-opened',
                'Demo Preview — not permanently opened'
            );
        } else if (capsule.openedAt) {
            setText('read-opened', this.formatDate(capsule.openedAt));
        } else {
            setText('read-opened', 'Not opened yet');
        }

        setText('read-letter', capsule.letter || '');

        // Images
        const imageSection = document.getElementById('section-images');
        const imageContainer = document.getElementById('read-images');

        if (imageSection && imageContainer) {
            imageContainer.innerHTML = '';

            if (Array.isArray(capsule.images) && capsule.images.length) {
                imageSection.style.display = 'block';

                capsule.images.forEach(src => {
                    const img = document.createElement('img');

                    img.src = src;
                    img.alt = 'Capsule memory';

                    img.style.cssText = `
                        max-width:100%;
                        border-radius:var(--radius-md);
                        box-shadow:var(--shadow-sm);
                    `;

                    imageContainer.appendChild(img);
                });
            } else {
                imageSection.style.display = 'none';
            }
        }

        // Favorite songs
        const songsSection = document.getElementById('section-songs');
        const songsContainer = document.getElementById('read-songs');

        if (songsSection && songsContainer) {
            songsContainer.innerHTML = '';

            if (
                Array.isArray(capsule.favoriteSongs) &&
                capsule.favoriteSongs.length
            ) {
                songsSection.style.display = 'block';

                capsule.favoriteSongs.forEach(song => {
                    const row = document.createElement('div');
                    row.style.marginBottom = '1rem';

                    const strong = document.createElement('strong');
                    strong.textContent =
                        `#${song.rank} ${song.title || ''}`;

                    row.append(
                        strong,
                        document.createTextNode(` by ${song.artist || ''}`)
                    );

                    if (song.reason) {
                        row.appendChild(document.createElement('br'));

                        const reason = document.createElement('span');

                        reason.style.cssText =
                            'font-style:italic;color:var(--text-muted);';

                        reason.textContent = `“${song.reason}”`;
                        row.appendChild(reason);
                    }

                    songsContainer.appendChild(row);
                });
            } else {
                songsSection.style.display = 'none';
            }
        }


        // Social Media Memories
        const socialSection = document.getElementById(
            'section-social-accounts'
        );
        const socialContainer = document.getElementById(
            'read-social-accounts'
        );

        if (socialSection && socialContainer) {
            socialContainer.innerHTML = '';

            const accounts = Array.isArray(capsule.socialAccounts)
                ? capsule.socialAccounts
                : [];

            if (accounts.length > 0) {
                socialSection.style.display = 'block';

                accounts.forEach(account => {
                    const card = document.createElement('div');
                    card.className = 'dynamic-item';
                    card.style.marginBottom = '1rem';

                    const content = document.createElement('div');
                    content.style.flex = '1';

                    const platform = document.createElement('strong');
                    platform.textContent = account.platform || 'Social Media';

                    content.appendChild(platform);

                    if (account.username) {
                        content.appendChild(
                            document.createElement('br')
                        );

                        const username = document.createElement('span');
                        username.textContent = account.username;
                        username.style.color = 'var(--text-muted)';

                        content.appendChild(username);
                    }

                    card.appendChild(content);
                    socialContainer.appendChild(card);
                });
            } else {
                socialSection.style.display = 'none';
            }
        }


        // Then vs Now
        const goalsBox = document.getElementById('then-now-goals');
        const predictionsBox =
            document.getElementById('then-now-predictions');
        const qaBox = document.getElementById('then-now-qa');
        const section = document.getElementById('section-then-now');
        const saveButton = document.getElementById('btn-save-now');

        [goalsBox, predictionsBox, qaBox].forEach(box => {
            if (box) box.innerHTML = '';
        });

        if (!capsule.thenNow) {
            capsule.thenNow = { currentAnswers: {} };
        }

        if (!capsule.thenNow.currentAnswers) {
            capsule.thenNow.currentAnswers = {};
        }

        const answers = capsule.thenNow.currentAnswers;

        let hasContent = false;
        let editing = false;

        const makeRow = (id, label, thenText) => {
            hasContent = true;

            const now = answers[id] || '';

            if (!now) {
                editing = true;
            }

            const row = document.createElement('div');
            row.className = 'then-now-grid mb-4';

            const thenCol = document.createElement('div');
            thenCol.className = 'then-col';

            const thenLabel = document.createElement('div');
            thenLabel.className = 'text-muted';

            thenLabel.style.cssText =
                'font-size:.8rem;text-transform:uppercase;';

            thenLabel.textContent = `${label} (Then)`;

            const thenValue = document.createElement('div');
            thenValue.textContent = thenText || '';

            thenCol.append(thenLabel, thenValue);

            const nowCol = document.createElement('div');
            nowCol.className = 'now-col';

            const nowLabel = document.createElement('div');
            nowLabel.className = 'text-muted';

            nowLabel.style.cssText =
                'font-size:.8rem;text-transform:uppercase;';

            nowLabel.textContent = 'Now';
            nowCol.appendChild(nowLabel);

            if (now) {
                const value = document.createElement('div');
                value.textContent = now;
                nowCol.appendChild(value);
            } else {
                const textarea = document.createElement('textarea');

                textarea.dataset.tnId = id;
                textarea.className = 'tn-input';
                textarea.placeholder = 'Reflect on this now...';

                textarea.style.cssText = `
                    min-height:60px;
                    width:100%;
                    border:none;
                    background:transparent;
                    resize:vertical;
                `;

                nowCol.appendChild(textarea);
            }

            row.append(thenCol, nowCol);

            return row;
        };

        const fillGroup = (
            box,
            heading,
            entries,
            labelFn,
            textFn,
            prefix
        ) => {
            if (!box || !Array.isArray(entries) || !entries.length) {
                return;
            }

            const title = document.createElement('h4');
            title.className = 'serif mt-4 mb-4';
            title.textContent = heading;

            box.appendChild(title);

            entries.forEach((entry, index) => {
                box.appendChild(
                    makeRow(
                        `${prefix}_${index}`,
                        labelFn(entry),
                        textFn(entry)
                    )
                );
            });
        };

        fillGroup(
            goalsBox,
            'Goals',
            capsule.goals,
            () => 'Goal',
            value => value,
            'goal'
        );

        fillGroup(
            predictionsBox,
            'Predictions',
            capsule.predictions,
            () => 'Prediction',
            value => value,
            'pred'
        );

        fillGroup(
            qaBox,
            'Q&A',
            capsule.customQuestions,
            item => item.question,
            item => item.answer,
            'qa'
        );

        if (section) {
            section.style.display = hasContent ? 'block' : 'none';
        }

        if (saveButton) {
            saveButton.className =
                hasContent && editing ? 'btn btn-primary' : 'hidden';
        }

        setText('read-short-message', capsule.shortMessage || '');
    },

    saveThenNowAnswers() {
        const capsule = this.data.capsules.find(
            item => item.id === this.state.activeCapsuleId
        );

        if (!capsule) return;

        if (!capsule.thenNow) {
            capsule.thenNow = { currentAnswers: {} };
        }

        if (!capsule.thenNow.currentAnswers) {
            capsule.thenNow.currentAnswers = {};
        }

        let savedAny = false;

        document.querySelectorAll('.tn-input').forEach(input => {
            if (input.value.trim()) {
                capsule.thenNow.currentAnswers[input.dataset.tnId] =
                    input.value.trim();

                savedAny = true;
            }
        });

        if (savedAny) {
            this.saveData();
            this.renderUnlockedContent(capsule);
            this.showToast('Reflections saved to archive.');
        } else {
            this.showToast('No new reflections to save.', 'error');
        }
    },

    // --- UNLOCK LOGIC ---
    checkUnlocks() {
        const now = this.getNow();

        // Demo Mode is preview-only. It never permanently unlocks capsules.
        if (this.data.settings.demoMode) {
            if (this.state.currentView === 'view-dashboard') {
                this.renderDashboard();
            } else if (this.state.currentView === 'view-archive') {
                this.renderArchive();
            } else if (this.state.currentView === 'view-timeline') {
                this.renderTimeline();
            } else if (
                this.state.currentView === 'view-capsule' &&
                this.state.activeCapsuleId
            ) {
                this.renderActiveCapsule();
            }

            return;
        }

        let newlyUnlocked = 0;

        this.data.capsules.forEach(capsule => {
            if (capsule.status !== 'sealed') return;

            const unlockTime = new Date(capsule.unlockAt);

            if (
                !Number.isNaN(unlockTime.getTime()) &&
                now >= unlockTime
            ) {
                capsule.status = 'unlocked';
                capsule.openedAt = now.toISOString();
                newlyUnlocked++;
            }
        });

        if (newlyUnlocked) {
            this.saveData();

            this.showToast(
                `🔓 ${newlyUnlocked} capsule(s) just unlocked!`
            );

            if (this.state.currentView === 'view-dashboard') {
                this.renderDashboard();
            } else if (this.state.currentView === 'view-archive') {
                this.renderArchive();
            } else if (this.state.currentView === 'view-timeline') {
                this.renderTimeline();
            } else if (
                this.state.currentView === 'view-capsule' &&
                this.state.activeCapsuleId
            ) {
                this.renderActiveCapsule();
            }
        }
    },

    // --- BREAK SEAL ---
    requestBreakSeal() {
        const modal = document.getElementById('modal-break');

        if (modal) {
            modal.classList.add('active');
        }
    },

    executeBreakSeal() {
        this.closeModal('modal-break');

        const capsule = this.data.capsules.find(
            item => item.id === this.state.activeCapsuleId
        );

        if (!capsule) return;

        if (capsule.status === 'sealed') {
            capsule.status = 'seal_broken';
            capsule.openedAt = new Date().toISOString();

            this.saveData();
            this.openCapsuleView(capsule.id);
            this.showToast('Seal broken.', 'error');
        }
    },

    // --- UTILITIES ---
    closeModal(id) {
        const modal = document.getElementById(id);

        if (modal) {
            modal.classList.remove('active');
        }
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');

        if (!container) {
            console.log(message);
            return;
        }

        const toast = document.createElement('div');
        toast.className = 'toast';

        if (type === 'error') {
            toast.style.borderLeftColor = '#C24A3F';
        }

        const text = document.createElement('span');
        text.textContent = message;

        toast.appendChild(text);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';

            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // --- EXPORT / IMPORT ---
    exportData() {
        const blob = new Blob(
            [JSON.stringify(this.data, null, 2)],
            { type: 'application/json' }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download =
            `time-capsule-backup-${new Date().toISOString().split('T')[0]}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    },

    importData(event) {
        const file = event.target.files && event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = e => {
            try {
                const imported = JSON.parse(e.target.result);

                if (
                    !imported ||
                    !Array.isArray(imported.capsules)
                ) {
                    throw new Error('Invalid format');
                }

                this.data = imported;

                if (!this.data.profile) {
                    this.data.profile = { name: '' };
                }

                if (!this.data.settings) {
                    this.data.settings = {
                        theme: 'light',
                        demoMode: false,
                        simulatedTime: null
                    };
                }

                this.saveData();
                this.applySettings();

                this.showToast('Backup imported successfully.');

                setTimeout(() => window.location.reload(), 1200);
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Invalid backup file.', 'error');
            } finally {
                event.target.value = '';
            }
        };

        reader.readAsText(file);
    }
};

// Initialize application and expose it for existing inline HTML handlers.
window.addEventListener('DOMContentLoaded', () => App.init());
window.app = App;
