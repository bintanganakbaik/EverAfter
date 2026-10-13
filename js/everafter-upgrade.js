/* =========================================================
   EVERAFTER — VIOLET ARCHIVE
   Upgrade layer: The Unforgotten + camera capture + icon assets
   Load AFTER js/script.js. Does not replace the original app.
========================================================= */
(() => {
    'use strict';

    const ICONS = {
        home: './assets/images/icons/home.svg',
        capsules: './assets/images/icons/capsules.svg',
        archive: './assets/images/icons/archive.svg',
        timeline: './assets/images/icons/timeline.svg',
        unforgotten: './assets/images/icons/unforgotten.svg',
        settings: './assets/images/icons/settings.svg'
    };

    const icon = (name, extraClass = '') => {
        const img = document.createElement('img');
        img.className = `ea-icon ${extraClass}`.trim();
        img.src = ICONS[name] || ICONS.home;
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        return img;
    };

    const text = (value, fallback = '') => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        return fallback;
    };

    const escapeHTML = value => text(value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    function getCapsules() {
        const data = window.app?.data;
        if (Array.isArray(data?.capsules)) return data.capsules;
        if (Array.isArray(data?.capsules?.items)) return data.capsules.items;
        return [];
    }

    function isActuallyOpened(capsule) {
        const status = String(capsule?.status || '').toLowerCase();
        return status !== 'sealed' && status !== 'locked' && status !== 'closed';
    }

    function getDate(capsule) {
        const raw = capsule?.unlockDate || capsule?.unlockAt || capsule?.unlockDatetime || capsule?.unlock || capsule?.createdAt;
        if (!raw) return 'Date not recorded';
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return text(raw, 'Date not recorded');
        return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    }

    function getList(capsule, keys) {
        for (const key of keys) {
            const value = capsule?.[key];
            if (Array.isArray(value)) return value;
        }
        return [];
    }

    function valueFromItem(item, keys) {
        if (typeof item === 'string' || typeof item === 'number') return text(item);
        if (!item || typeof item !== 'object') return '';
        for (const key of keys) {
            if (item[key] !== undefined && item[key] !== null && text(item[key]).trim()) return text(item[key]);
        }
        return '';
    }

    function createUnforgottenView() {
        if (document.getElementById('view-unforgotten')) return;
        const view = document.createElement('section');
        view.id = 'view-unforgotten';
        view.className = 'view';
        view.setAttribute('aria-labelledby', 'unforgotten-title');
        view.innerHTML = `
            <header class="header-action ea-unforgotten-header">
                <div>
                    <p class="ea-eyebrow">A LETTER FROM YOUR FORMER SELF</p>
                    <h1 id="unforgotten-title">The Unforgotten</h1>
                    <p>Meet the person you were when you sealed these memories.</p>
                </div>
                <div class="ea-unforgotten-mark" aria-hidden="true">U.</div>
            </header>
            <div class="ea-unforgotten-intro">
                <span class="ea-intro-index">FIELD NOTES / 01</span>
                <p>Old predictions. Unfinished plans. Questions you once cared enough to ask. This is not a gallery of the past — it is a conversation with it.</p>
            </div>
            <div id="unforgotten-content" aria-live="polite"></div>`;
        const anchor = document.querySelector('#view-settings') || document.querySelector('.main-content');
        anchor?.parentNode?.insertBefore(view, anchor);
    }

    function renderUnforgotten() {
        const host = document.getElementById('unforgotten-content');
        if (!host) return;
        // Never reveal data from capsules that are still genuinely sealed.
        const opened = getCapsules().filter(isActuallyOpened).slice().sort((a, b) => {
            const da = new Date(a?.unlockDate || a?.unlockAt || a?.createdAt || 0).getTime() || 0;
            const db = new Date(b?.unlockDate || b?.unlockAt || b?.createdAt || 0).getTime() || 0;
            return db - da;
        });

        if (!opened.length) {
            host.innerHTML = `<div class="ea-empty-archive"><span class="ea-empty-index">NOTHING LOST. NOT YET.</span><h2>Your future self is waiting.</h2><p>Once a time capsule has opened, its old thoughts will find a home here. Until then, keep writing honestly.</p><button type="button" class="btn btn-primary" id="unforgotten-create">Create a capsule</button></div>`;
            document.getElementById('unforgotten-create')?.addEventListener('click', () => window.app?.navigateTo?.('view-create'));
            return;
        }

        const entries = [];
        opened.forEach((capsule, capsuleIndex) => {
            const title = text(capsule?.title, 'Untitled capsule');
            const date = getDate(capsule);
            const goals = getList(capsule, ['goals', 'goalList']);
            const predictions = getList(capsule, ['predictions', 'predictionList']);
            const questions = getList(capsule, ['qa', 'questions', 'customQuestions', 'customQA']);
            const letter = text(capsule?.letter || capsule?.message || capsule?.content);
            const closing = text(capsule?.shortMessage || capsule?.finalMessage || capsule?.closingMessage);
            const fragments = [];

            const makeCards = (label, list, keys, limit = 3) => {
                const items = list.map(item => valueFromItem(item, keys)).filter(Boolean).slice(0, limit);
                if (!items.length) return;
                fragments.push(`<section class="ea-memory-block"><p class="ea-memory-label">${label}</p><ul>${items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul></section>`);
            };

            makeCards('GOALS YOU LEFT HERE', goals, ['text', 'goal', 'title', 'value', 'description']);
            makeCards('PREDICTIONS FROM THEN', predictions, ['text', 'prediction', 'title', 'value', 'description']);
            makeCards('QUESTIONS YOU ASKED', questions, ['question', 'prompt', 'text', 'title'], 2);
            if (letter.trim()) fragments.push(`<section class="ea-memory-block ea-memory-letter"><p class="ea-memory-label">A NOTE FROM THEN</p><blockquote>${escapeHTML(letter.length > 360 ? `${letter.slice(0, 357)}…` : letter)}</blockquote></section>`);
            if (closing.trim()) fragments.push(`<p class="ea-memory-closing">“${escapeHTML(closing)}”</p>`);
            if (!fragments.length) fragments.push('<p class="ea-memory-empty">This capsule holds a memory, but no reflection fields to revisit.</p>');

            entries.push(`<article class="ea-unforgotten-card" style="--memory-index:${capsuleIndex}">
                <div class="ea-memory-card-top"><span class="ea-memory-number">MEMORY ${String(capsuleIndex + 1).padStart(2, '0')}</span><span class="ea-memory-date">${escapeHTML(date)}</span></div>
                <h2>${escapeHTML(title)}</h2>
                <div class="ea-memory-fragments">${fragments.join('')}</div>
                <button type="button" class="ea-text-link" data-open-capsule="${escapeHTML(text(capsule.id || capsule.capsuleId || ''))}">Revisit the full capsule <span aria-hidden="true">↗</span></button>
            </article>`);
        });
        host.innerHTML = `<div class="ea-unforgotten-count"><span>${opened.length}</span><p>${opened.length === 1 ? 'memory returned from the past' : 'memories returned from the past'}</p></div><div class="ea-unforgotten-grid">${entries.join('')}</div>`;
        host.querySelectorAll('[data-open-capsule]').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.dataset.openCapsule;
                const capsule = getCapsules().find(item => text(item?.id || item?.capsuleId) === id);
                if (!capsule) return;
                if (window.app) {
                    window.app.state.activeCapsuleId = capsule.id || capsule.capsuleId;
                    window.app.navigateTo?.('view-capsule');
                    window.app.renderCapsule?.();
                }
            });
        });
    }

    function addUnforgottenNavigation() {
        const nav = document.querySelector('.nav-links');
        if (!nav || nav.querySelector('[data-target="view-unforgotten"]')) return;
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'nav-link';
        link.href = '#view-unforgotten';
        link.dataset.target = 'view-unforgotten';
        link.append(icon('unforgotten'));
        const label = document.createElement('span');
        label.textContent = 'The Unforgotten';
        link.append(label);
        li.append(link);
        const settingsLink = nav.querySelector('[data-target="view-settings"]')?.closest('li');
        nav.insertBefore(li, settingsLink || null);
    }

    function replaceNavEmojiIcons() {
        document.querySelectorAll('.nav-link[data-target]').forEach(link => {
            const target = link.dataset.target || '';
            const key = target.includes('home') ? 'home'
                : target.includes('dashboard') ? 'capsules'
                : target.includes('archive') ? 'archive'
                : target.includes('timeline') ? 'timeline'
                : target.includes('unforgotten') ? 'unforgotten'
                : target.includes('settings') ? 'settings' : null;
            if (!key) return;
            if (!link.querySelector('.ea-icon')) link.insertBefore(icon(key), link.firstChild);
            Array.from(link.children).forEach(child => {
                if (child.classList.contains('ea-icon')) return;
                const content = (child.textContent || '').trim();
                if (content && !/[A-Za-z0-9]/.test(content)) child.remove();
            });
            Array.from(link.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !/[A-Za-z0-9]/.test(node.textContent)) node.remove();
            });
            const hasLabel = Array.from(link.children).some(child => !child.classList.contains('ea-icon') && child.textContent.trim());
            if (!hasLabel) {
                const label = document.createElement('span');
                label.textContent = target.includes('home') ? 'Home'
                    : target.includes('dashboard') ? 'My Capsules'
                    : target.includes('archive') ? 'Archive'
                    : target.includes('timeline') ? 'Timeline'
                    : target.includes('unforgotten') ? 'The Unforgotten' : 'Settings';
                link.append(label);
            }
        });
    }

    function addCameraControls() {
        const wrapper = document.querySelector('.file-upload-wrapper');
        const fileInput = document.getElementById('create-images');
        if (!wrapper || !fileInput || document.getElementById('ea-open-camera')) return;
        const controls = document.createElement('div');
        controls.className = 'ea-image-actions';
        controls.innerHTML = `<button type="button" class="ea-secondary-button" id="ea-open-camera"><span class="ea-camera-glyph" aria-hidden="true"></span> Take a photo</button><span class="ea-image-help">Camera access requires permission. Photos stay in this browser.</span>`;
        wrapper.insertAdjacentElement('afterend', controls);

        const modal = document.createElement('div');
        modal.className = 'ea-camera-modal';
        modal.id = 'ea-camera-modal';
        modal.hidden = true;
        modal.innerHTML = `<div class="ea-camera-dialog" role="dialog" aria-modal="true" aria-labelledby="ea-camera-title"><div class="ea-camera-head"><div><p class="ea-eyebrow">LIVE CAPTURE</p><h2 id="ea-camera-title">Keep this moment.</h2></div><button type="button" class="ea-camera-close" aria-label="Close camera">×</button></div><video id="ea-camera-video" autoplay playsinline muted></video><p class="ea-camera-status" id="ea-camera-status">Allow camera access to take a photo.</p><div class="ea-camera-actions"><button type="button" class="ea-secondary-button" id="ea-camera-cancel">Cancel</button><button type="button" class="btn btn-primary" id="ea-camera-capture" disabled>Capture photo</button></div></div>`;
        document.body.append(modal);

        let stream = null;
        const video = modal.querySelector('#ea-camera-video');
        const status = modal.querySelector('#ea-camera-status');
        const capture = modal.querySelector('#ea-camera-capture');
        const close = () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            stream = null;
            video.srcObject = null;
            modal.hidden = true;
            capture.disabled = true;
        };
        modal.querySelectorAll('.ea-camera-close, #ea-camera-cancel').forEach(button => button.addEventListener('click', close));
        modal.addEventListener('click', event => { if (event.target === modal) close(); });
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) close(); });

        document.getElementById('ea-open-camera').addEventListener('click', async () => {
            modal.hidden = false;
            status.textContent = 'Connecting to your camera…';
            if (!navigator.mediaDevices?.getUserMedia) {
                status.textContent = 'Live camera is not available here. Use the image upload control instead.';
                return;
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
                video.srcObject = stream;
                await video.play();
                capture.disabled = false;
                status.textContent = 'Ready when you are.';
            } catch (error) {
                status.textContent = error?.name === 'NotAllowedError'
                    ? 'Camera permission was declined. You can still upload a photo from your device.'
                    : 'Could not open the camera. Try the image upload control instead.';
            }
        });

        capture.addEventListener('click', async () => {
            if (!video.videoWidth || !video.videoHeight) return;
            const canvas = document.createElement('canvas');
            const scale = Math.min(1, 1200 / video.videoWidth);
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            canvas.getContext('2d', { alpha: false }).drawImage(video, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.78));
            if (!blob) { status.textContent = 'Could not capture this photo. Please try again.'; return; }
            const file = new File([blob], `everafter-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const transfer = new DataTransfer();
            transfer.items.add(file);
            // Feed the captured image through the app's existing compression/preview pipeline.
            const proxyInput = { files: transfer.files, value: '' };
            try {
                await Promise.resolve(window.app?.handleImageSelect?.call(window.app, { target: proxyInput }));
                status.textContent = 'Photo added to this capsule.';
                setTimeout(close, 450);
            } catch (error) {
                status.textContent = 'Could not add this photo. Try the upload control instead.';
            }
        });
    }

    function enforceImageBudget() {
        const app = window.app;
        if (!app || typeof app.handleImageSelect !== 'function' || app.__eaImageBudgetWrapped) return;
        const original = app.handleImageSelect;
        app.handleImageSelect = async function (event) {
            const files = Array.from(event?.target?.files || []);
            if (!files.length) return;
            const current = Array.isArray(this.state?.currentImages) ? this.state.currentImages : [];
            const totalBytes = () => current.reduce((sum, image) => sum + Math.ceil((String(image?.data || '').split(',')[1] || '').length * 0.75), 0);
            const MAX_BYTES = 500 * 1024;
            const MAX_IMAGES = 5;
            const slots = Math.max(0, MAX_IMAGES - current.length);
            const remaining = Math.max(0, MAX_BYTES - totalBytes());
            if (slots === 0) {
                window.alert('A capsule can contain up to 5 images. Remove one before adding another.');
                return;
            }
            const accepted = [];
            let estimated = 0;
            for (const file of files.slice(0, slots)) {
                // Reject only files whose raw size already exceeds the remaining budget.
                if (file.size > remaining || estimated + file.size > remaining) continue;
                accepted.push(file); estimated += file.size;
            }
            if (!accepted.length) {
                window.alert('These images exceed the remaining 500 KB image budget. Choose a smaller image or remove an existing one.');
                return;
            }
            const transfer = new DataTransfer();
            accepted.forEach(file => transfer.items.add(file));
            const target = event.target;
            const originalFiles = target.files;
            try { target.files = transfer.files; } catch (_) { /* custom camera input: files are already prepared */ }
            const before = current.slice();
            await original.call(this, { target: target.files === transfer.files ? target : { files: transfer.files, value: '' } });
            // Some legacy handlers finish compression asynchronously without returning a promise.
            await new Promise(resolve => setTimeout(resolve, 700));
            const latest = Array.isArray(this.state?.currentImages) ? this.state.currentImages : current;
            const bytes = latest.reduce((sum, image) => sum + Math.ceil((String(image?.data || '').split(',')[1] || '').length * 0.75), 0);
            if (bytes > MAX_BYTES) {
                this.state.currentImages = before;
                window.alert('The compressed images would exceed 500 KB in total. The newest selection was not kept. Please choose smaller images.');
                const previews = document.getElementById('create-image-previews');
                if (previews) previews.innerHTML = '';
                if (typeof this.renderImagePreviews === 'function') this.renderImagePreviews();
            }
            if (target && target !== event.target) target.files = originalFiles;
        };
        app.__eaImageBudgetWrapped = true;
    }

    function enhanceCreateForm() {
        const view = document.getElementById('view-create');
        if (!view || view.dataset.eaEnhanced === 'true') return;
        view.dataset.eaEnhanced = 'true';
        const form = view.querySelector('form');
        if (!form) return;
        const sections = Array.from(form.querySelectorAll('.form-section'));
        if (!sections.length) return;
        const intro = document.createElement('div');
        intro.className = 'ea-create-intro';
        intro.innerHTML = `<div><p class="ea-eyebrow">A SMALL RECORD OF A REAL MOMENT</p><h2>Make something your future self can open.</h2><p>There is no perfect way to remember. Start with what feels worth keeping.</p></div><div class="ea-create-seal" aria-hidden="true"><span>EA</span><small>PERSONAL ARCHIVE</small></div>`;
        form.insertBefore(intro, form.firstChild);

        const nav = document.createElement('nav');
        nav.className = 'ea-create-index';
        nav.setAttribute('aria-label', 'Capsule sections');
        nav.innerHTML = `<div class="ea-create-index-heading"><span>YOUR CAPSULE</span><span>SECTION INDEX</span></div><div class="ea-create-index-links"></div>`;
        const links = nav.querySelector('.ea-create-index-links');
        sections.forEach((section, index) => {
            const heading = section.querySelector('h2, h3');
            if (!heading) return;
            const label = heading.textContent.replace(/^\s*\d+\s*/, '').trim() || `Section ${index + 1}`;
            const id = `ea-create-section-${index + 1}`;
            section.id = section.id || id;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ea-create-index-link';
            button.innerHTML = `<span class="ea-index-number">${String(index + 1).padStart(2, '0')}</span><span>${escapeHTML(label)}</span>`;
            button.addEventListener('click', () => {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                links.querySelectorAll('button').forEach(item => item.classList.toggle('is-current', item === button));
            });
            links.append(button);
        });
        intro.insertAdjacentElement('afterend', nav);

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (!visible) return;
                links.querySelectorAll('button').forEach((button, index) => button.classList.toggle('is-current', sections[index] === visible.target));
            }, { rootMargin: '-15% 0px -65% 0px', threshold: [0, .2, .5] });
            sections.forEach(section => observer.observe(section));
        }
    }

    function patchNavigation() {
        const app = window.app;
        if (!app || app.__eaNavigationWrapped || typeof app.navigateTo !== 'function') return;
        const original = app.navigateTo;
        app.navigateTo = function (target, ...args) {
            const result = original.call(this, target, ...args);
            if (target === 'view-unforgotten') renderUnforgotten();
            if (target === 'view-create') setTimeout(enhanceCreateForm, 0);
            return result;
        };
        app.__eaNavigationWrapped = true;
    }

    function init() {
        createUnforgottenView();
        addUnforgottenNavigation();
        replaceNavEmojiIcons();
        addCameraControls();
        enhanceCreateForm();
        patchNavigation();
        enforceImageBudget();
        // Refresh after the base app has finished its initial render.
        renderUnforgotten();
        document.addEventListener('click', event => {
            const link = event.target.closest?.('[data-target="view-unforgotten"]');
            if (!link) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            window.app?.navigateTo?.('view-unforgotten');
        }, true);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), { once: true });
    else setTimeout(init, 0);
})();
