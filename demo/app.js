/**
 * Demo Application Logic
 */

const app = {
    init: function () {
        console.log('[App] Initializing Demo...');

        // 1. Simulate Server-Side Page Load (via Query Params)
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page') || 'home';

        // Emulate the initial state set by the library or server
        // In a real scenario, dataLayerManager initializes from schema values (empty strings).
        // Then we set the page name based on the "server" context.

        if (window.digitalData) {
            window.digitalData.set('page.view_name', 'standard:' + pageParam);
            window.digitalData.set('page.url', window.location.href);

            this.log(`[App] Standard Page Load Detected: "${pageParam}"`, 'event');

            // Highlight nav
            const navLink = document.getElementById('nav-' + pageParam);
            if (navLink) navLink.classList.add('active');
        }

        this.renderJSON();

        // Set Adobe Toggle from localStorage
        const adobeToggle = document.getElementById('adobe-toggle');
        if (adobeToggle) {
            adobeToggle.checked = localStorage.getItem('useRealAdobe') === 'true';
        }

        // Global Click Listener for Analytics
        document.addEventListener('click', (e) => {
            const trackable = e.target.closest('[analytics-id]');
            if (trackable) {
                const id = trackable.getAttribute('analytics-id');
                window.digitalData.set('event.action', id);
                app.log(`[Analytics] Click tracked: ${id}`, 'event');
            }
        });
    },

    // UI Handlers
    handlers: {
        doGet: function () {
            const path = document.getElementById('get-path').value;
            if (!path) return;
            try {
                const val = window.digitalData.get(path);
                const displayVal = (typeof val === 'object') ? JSON.stringify(val) : String(val);
                document.getElementById('get-result').textContent = `Result: ${displayVal}`;
                app.log(`[Action] .get('${path}') -> ${typeof val}`, 'log');
            } catch (e) {
                app.log(`[Error] .get('${path}') failed: ${e.message}`, 'error');
            }
        },

        doSet: function () {
            const path = document.getElementById('set-path').value;
            const val = document.getElementById('set-value').value;
            if (!path) return;

            // Allow attempting to set empty string to test validation
            const result = window.digitalData.set(path, val);
            if (!result) {
                app.log(`[Error] .set('${path}', '${val}') failed. Check console.`, 'error');
            } else {
                app.log(`[Success] .set('${path}', '${val}')`, 'log');
            }
        },

        doMerge: function () {
            const path = document.getElementById('merge-path').value;
            const jsonStr = document.getElementById('merge-json').value;
            try {
                const jsonObj = JSON.parse(jsonStr);
                // Handle optional path for merge logic
                const result = window.digitalData.merge(path, jsonObj);
                app.log(`[Action] .merge('${path}', ...) -> ${result}`, 'log');
            } catch (e) {
                app.log(`[Error] Invalid JSON or Merge Failed: ${e.message}`, 'error');
            }
        },

        doSetView: function () {
            const name = document.getElementById('view-name').value;
            const tp = document.getElementById('view-touchpoint').value;
            if (!name) return;

            const result = window.digitalData.setView(name, tp);
            app.log(`[Action] .setView('${name}', '${tp}') -> ${result}`, 'log');
        },

        doSetKPI: function () {
            const name = document.getElementById('kpi-name').value;
            if (!name) return;
            const result = window.digitalData.setKPI(name);
            app.log(`[Action] .setKPI('${name}') -> ${result}`, 'log');
        },

        doSetAssets: function () {
            const path = document.getElementById('asset-path').value;
            const key = document.getElementById('asset-key').value;
            const val = document.getElementById('asset-val').value;

            if (!path || !key) return;

            const assetsObj = {};
            assetsObj[key] = val;

            const result = window.digitalData.setAssets(path, assetsObj);
            app.log(`[Action] setAssets('${path}', ${JSON.stringify(assetsObj)}) -> ${result}`, 'log');
        },

        doSetTouchpoint: function () {
            const val = document.getElementById('touchpoint-val').value;
            const result = window.digitalData.setTouchpoint(val);
            app.log(`[Action] setTouchpoint('${val}') -> ${result}`, result ? 'log' : 'error');
        },

        doClearTouchpoint: function () {
            const result = window.digitalData.clearTouchpoint();
            app.log(`[Action] clearTouchpoint() -> ${result}`, 'log');
        },
    },

    // Realistic Dashboard Actions
    simulateAction: function (type) {
        app.log(`[User Action] Clicked "${type}"`, 'event');

        switch (type) {
            case 'pay-bill':
                // Simulate flow: Nav to billing, set touchpoint
                window.digitalData.setView('billing-center');
                window.digitalData.setTouchpoint('financial');
                window.digitalData.setKPI('initiate_payment');
                app.log(`[Flow] Navigate -> Billing | Touchpoint -> Financial`, 'log');
                break;

            case 'find-doc':
                window.digitalData.setView('provider-search');
                window.digitalData.setTouchpoint('care_access');
                break;

            case 'view-claims':
                window.digitalData.setView('claims-history');
                window.digitalData.setTouchpoint('financial');
                break;

            case 'update-profile':
                const email = document.getElementById('dash-email').value;
                const phone = document.getElementById('dash-phone').value;
                if (!email && !phone) return;

                // Simulate setting values manually for now as setForm isn't in scope of this specific task request (unless already added)
                // But we can simulate capturing it via individual sets or setAssets? 
                // Actually, let's just use .set for the demo as we don't have a verified setForm method in the snippet provided.
                // Or assume we want to demonstrate capturing data.
                if (email) window.digitalData.set('user.id', email); // Using ID as proxy
                window.digitalData.setTouchpoint('account_mgmt');
                app.log(`[Flow] Profile Updated -> Captured Data`, 'log');
                break;

            case 'save-prefs':
                // Gather checkboxes
                const prefs = {};
                document.querySelectorAll('input[name="pref"]:checked').forEach(cb => {
                    prefs[cb.value] = 'opt-in';
                });
                // Store in assets
                window.digitalData.setAssets('application', prefs);
                app.log(`[Flow] Preferences Saved -> setAssets`, 'log');
                break;

            case 'save-topics':
                // Gather Interest Matrix
                const topics = {};
                document.querySelectorAll('input[name="topic"]:checked').forEach(cb => {
                    topics[cb.value] = 'following';
                });

                if (Object.keys(topics).length === 0) {
                    app.log('[Info] No topics selected.', 'log');
                    return;
                }

                // Bulk set assets
                window.digitalData.setAssets('application', topics);
                app.log(`[Flow] Health Interests Saved -> Bulk setAssets for ${Object.keys(topics).length} items`, 'log');
                break;
        }
    },

    pubwebWaitAndGo: function (pageId) {
        // 1. Visual Loading State (Optional realism)
        document.querySelectorAll('.pubweb-nav-item').forEach(el => el.classList.remove('active'));
        // Find the nav item that called (approximate logic or pass element) - simplifying for demo
        // Just highlight based on ID mapping
        const navMap = {
            'home': 0, 'shop': 1, 'manage': 2, 'find-care': 3, 'about': 4
        };
        const navItems = document.querySelectorAll('.pubweb-nav-item');
        if (navItems[navMap[pageId]] !== undefined) navItems[navMap[pageId]].classList.add('active');

        // 2. Hide all pages
        document.querySelectorAll('.pubweb-page').forEach(el => el.classList.remove('active'));

        // 3. Show target page
        const targetPage = document.getElementById('pub-page-' + pageId);
        if (targetPage) targetPage.classList.add('active');

        // 4. Trigger Data Layer Event
        // Define mapping for view naming
        const viewNameMap = {
            'home': 'pubweb:home',
            'shop': 'pubweb:shop_plans',
            'manage': 'pubweb:manage_plan',
            'find-care': 'pubweb:provider_search',
            'about': 'pubweb:about_us'
        };

        const viewName = viewNameMap[pageId] || 'pubweb:unknown';

        // Call setView
        window.digitalData.setView(viewName, 'public_website');
        app.log(`[Pubweb] Navigated to ${viewName}`, 'event');
    },

    openQuoteModal: function () {
        const modal = document.getElementById('quote-modal');
        if (modal) modal.classList.add('active');
        // Analytics
        window.digitalData.setTouchpoint('quote_modal');
        app.log('[App] Opened Quote Modal', 'event');
    },

    closeQuoteModal: function () {
        const modal = document.getElementById('quote-modal');
        if (modal) modal.classList.remove('active');
        // Revert touchpoint or clear? Let's clear
        window.digitalData.clearTouchpoint();
    },

    submitQuote: function () {
        this.closeQuoteModal();
        window.digitalData.setKPI('start_quote');
        window.digitalData.setView('pubweb:quote_results');
        app.log('[App] Quote Started', 'event');
    },

    performSearch: function () {
        const input = document.getElementById('find-care-input');
        const term = input ? input.value : '';

        // Mock Results
        const results = [
            { name: 'Dr. Sarah Smith', specialty: 'Cardiology', distance: '2.5 miles' },
            { name: 'Dr. John Doe', specialty: 'Family Medicine', distance: '4.1 miles' },
            { name: 'Central City Hospital', specialty: 'Hospital', distance: '5.0 miles' }
        ];

        // 1. Set Data Layer for Search Event
        window.digitalData.set('search.term', term);
        window.digitalData.set('search.results_count', results.length);
        window.digitalData.setKPI('search_executed');
        app.log(`[Search] Term: "${term}", Results: ${results.length}`, 'event');

        // 2. Render Results
        const container = document.getElementById('search-results-container');
        if (!container) return;

        let html = '<h3 style="margin-bottom:1rem;">Search Results</h3>';

        results.forEach((res, index) => {
            const pos = index + 1;
            const total = results.length;
            html += `
                <div class="search-result-card" onclick="app.trackSearchResultClick(${pos}, ${total})" style="cursor:pointer;">
                    <h4 style="margin:0; color:var(--brand-blue);">${res.name}</h4>
                    <p style="margin:5px 0 0 0; font-size:0.9rem; color:#666;">${res.specialty} • ${res.distance}</p>
                </div>
             `;
        });
        container.innerHTML = html;
    },

    trackSearchResultClick: function (pos, total) {
        // Set Data Layer
        window.digitalData.set('search.result_position', pos);

        // Formatted Action String
        const val = `search-result-click:${pos}:${total}`;
        window.digitalData.set('event.action', val);
        app.log(`[Search] Result Clicked: ${val} (Index: ${pos})`, 'event');
    },

    switchTab: function (tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

        // Show target
        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) targetTab.classList.add('active');

        // Update button state (Dynamic based on order)
        const buttons = document.querySelectorAll('.tab-btn');
        if (buttons.length > 0) {
            if (tabName === 'dashboard') buttons[0].classList.add('active');
            if (tabName === 'pubweb') buttons[1].classList.add('active');
            if (tabName === 'playground') buttons[2].classList.add('active');
        }
    },

    // SPA Simulation
    simulateRoute: function (viewName) {
        app.log(`[SPA] Navigating to virtual view: ${viewName}...`, 'event');

        // In an SPA, we might clear previous specific data or just set new data.
        // 1. Set View (Triggers Adobe Rule)
        window.digitalData.setView('spa:' + viewName);

        // 2. Clear Touchpoint (demonstrating the new feature)
        window.digitalData.clearTouchpoint();

        // 3. Update URL (visual only)
        window.history.pushState({}, '', '?page=' + viewName);

        // UI Updates
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    },

    // Helpers
    log: function (msg, type = 'log') {
        const panel = (type === 'event') ? document.getElementById('event-log') : document.getElementById('console-log');
        if (!panel) return;

        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.textContent = `> ${msg}`;
        panel.insertBefore(div, panel.firstChild);
    },

    renderJSON: function () {
        const container = document.getElementById('json-view');
        if (!window.digitalData || !container) return;

        const state = window.digitalData._getState();
        container.innerHTML = this.syntaxHighlight(state);
    },

    syntaxHighlight: function (json) {
        if (typeof json != 'string') {
            json = JSON.stringify(json, undefined, 2);
        }
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            var cls = 'syntax-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'syntax-key';
                } else {
                    cls = 'syntax-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'syntax-boolean';
            } else if (/null/.test(match)) {
                cls = 'syntax-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    },

    // Schema Editor
    openSchemaEditor: function () {
        const modal = document.getElementById('schema-modal');
        const textarea = document.getElementById('schema-json');
        if (modal && textarea && window.digitalData && window.digitalData._getSchema) {
            textarea.value = JSON.stringify(window.digitalData._getSchema(), null, 2);
            modal.classList.add('active');
        }
    },

    closeSchemaEditor: function () {
        const modal = document.getElementById('schema-modal');
        if (modal) modal.classList.remove('active');
    },

    applySchema: function () {
        const textarea = document.getElementById('schema-json');
        if (!textarea) return;

        try {
            const newSchema = JSON.parse(textarea.value);
            // Store in window for mock-environment to pick up on reinit
            window._customSchema = newSchema;
            this.closeSchemaEditor();
            app.log('[App] Schema updated. Reloading page to reinitialize...', 'event');
            // Force reload to reinitialize with new schema
            setTimeout(() => window.location.reload(), 500);
        } catch (e) {
            app.log(`[Error] Invalid JSON: ${e.message}`, 'error');
        }
    },

    // Adobe Mode Toggle
    toggleAdobeMode: function (useReal) {
        localStorage.setItem('useRealAdobe', useReal ? 'true' : 'false');
        if (useReal) {
            app.log('[App] Switching to Real Adobe Mode. Page will reload...', 'event');
        } else {
            app.log('[App] Switching to Emulated Adobe Mode. Page will reload...', 'event');
        }
        setTimeout(() => window.location.reload(), 500);
    }
};

// Expose log globally for mocks
window.logToUI = app.log;
window.renderJSON = app.renderJSON.bind(app);

// Start
window.addEventListener('DOMContentLoaded', () => {
    // Wait slightly for mocks to settle if needed
    setTimeout(() => app.init(), 100);
});
