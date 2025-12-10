/**
 * Mock Environment for Extension Testing
 * Simulates Adobe Launch / Turbine environment
 */

(function () {
    console.log('[MockEnv] Initializing Adobe Launch Simulation...');

    // 1. Module System Mock (for CommonJS compatibility in browser)
    // Only set up if not already defined (may be set up by index.html)
    if (!window.module) {
        window.module = {};
    }
    if (!window.exports) {
        window.exports = {};
    }
    if (!window.require) {
        window.require = function (path) {
            // Resolve './utils' to the global utils object we will load
            if (path === './utils') {
                return window.utilsModule;
            }
            return {};
        };
    }

    // 2. Turbine/Adobe Mock
    // Asset type definition for reuse
    const assetsType = { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'string' } } } };

    const defaultSchema = {
        type: 'object',
        properties: {
            page: {
                type: 'object',
                properties: {
                    view_name: { type: 'string' },
                    url: { type: 'string' },
                    assets: assetsType
                }
            },
            application: {
                type: 'object',
                properties: {
                    touchpoint: { type: 'string' },
                    kpi: { type: 'string' },
                    assets: assetsType
                }
            },
            user: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    isLoggedIn: { type: 'boolean' },
                    assets: assetsType
                }
            },
            event: { type: 'object', properties: { action: { type: 'string' } } },
            search: {
                type: 'object',
                properties: {
                    term: { type: 'string' },
                    results_count: { type: 'number' },
                    result_position: { type: 'number' },
                    assets: assetsType
                }
            },
            form: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    step: { type: 'string' },
                    assets: assetsType
                }
            }
        }
    };

    // Get custom data object name from localStorage (default: digitalData)
    const customDataObjectName = localStorage.getItem('dataObjectName') || 'digitalData';

    window.turbine = {
        getExtensionSettings: function () {
            // Use custom schema if provided
            const schema = window._customSchema || defaultSchema;
            return {
                dataObjectName: customDataObjectName,
                tenantPropertyName: 'testTenant',
                initialSchemaJson: JSON.stringify(schema)
            };
        },
        logger: {
            log: function (msg) {
                console.log('[Turbine]', msg);
                if (window.logToUI) window.logToUI('[Turbine] ' + msg, 'log');
            },
            error: function (msg) {
                console.error('[Turbine]', msg);
                if (window.logToUI) window.logToUI('[Turbine Error] ' + msg, 'error');
            }
        }
    };

    // 3. Adobe Event Listener Mock (Rules Engine)
    // We proxy the data layer object *after* it is created to watch for changes.
    // Since we can't easily proxy the assignment itself from here (timing),
    // we will rely on a poller or a wrapper in the app.js to detect changes for the demo.
    // However, for best realism, let's wrap the set method if we can.

    // We will wait for the data layer to exist to wrap it.
    const waitForDL = setInterval(() => {
        const dl = window[customDataObjectName];
        if (dl) {
            console.log(`[MockEnv] ${customDataObjectName} detected.`);

            // If Real Adobe mode (from localStorage), skip mock wrappers
            const useRealAdobe = localStorage.getItem('useRealAdobe') === 'true';
            if (useRealAdobe) {
                console.log('[MockEnv] Real Adobe mode enabled. Skipping mock wrappers.');
                clearInterval(waitForDL);
                updateVisualizer();
                return;
            }

            console.log('[MockEnv] Setting up mock Event Listeners...');

            // Wrap setters to detect events
            const originalSet = dl.set;
            const originalSetView = dl.setView;

            // Proxy setView -> "Direct Call Rule: View Change"
            dl.setView = function (name, touchpoint) {
                const result = originalSetView.apply(this, arguments);
                if (result) {
                    if (window.logToUI) window.logToUI(`[Adobe Rule] Triggered: "View Change" (Page Name: ${name})`, 'event');
                }
                updateVisualizer();
                return result;
            };

            // Proxy generic set -> Watch for specific keys if needed
            dl.set = function (path, value) {
                const result = originalSet.apply(this, arguments);
                if (result) {
                    // Detect Page View change via raw set
                    if (path === 'page.view_name') {
                        if (window.logToUI) window.logToUI(`[Adobe Rule] Triggered: "View Change" (Manual Set)`, 'event');
                    }
                }
                updateVisualizer();
                return result;
            };

            // Wrap other methods that change state for visualization updates
            const methods = ['setAssets', 'clearTouchpoint', 'setKPI', 'setTouchpoint'];
            methods.forEach(m => {
                if (dl[m]) {
                    const orig = dl[m];
                    dl[m] = function () {
                        const res = orig.apply(this, arguments);
                        updateVisualizer();
                        return res;
                    }
                }
            });

            clearInterval(waitForDL);
            updateVisualizer(); // Initial state
        }
    }, 100);

    function updateVisualizer() {
        if (window.renderJSON) window.renderJSON();
    }

})();
