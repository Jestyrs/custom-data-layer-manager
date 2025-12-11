/**
 * Mock Environment for Extension Testing
 * Simulates Adobe Launch / Turbine environment
 */

(function () {
    console.log('[MockEnv] Initializing Adobe Launch Simulation...');

    // Check mode
    const useRealAdobe = localStorage.getItem('useRealAdobe') === 'true';
    // Get custom data object name from localStorage (default: digitalData)
    const customDataObjectName = localStorage.getItem('dataObjectName') || 'digitalData';

    if (!useRealAdobe) {
        // Module System Mock (for CommonJS compatibility in browser)
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
    }

    // Turbine/Adobe Mock
    if (!useRealAdobe) {
        // Asset type definition for reuse
        const assetsType = { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'string' } } } };

        const defaultSchema = {
            "type": "object",
            "properties": {
                "application": {
                    "type": "object",
                    "properties": {
                        "touchpoint": { "type": "string" },
                        "kpi": { "type": "string" },
                        "assets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "value": { "type": "string" },
                                    "name": { "type": "string" }
                                }
                            }
                        }
                    }
                },
                "event": {
                    "type": "object",
                    "properties": {
                        "action": { "type": "string" },
                        "assets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "value": { "type": "string" },
                                    "name": { "type": "string" }
                                }
                            }
                        }
                    }
                },
                "page": {
                    "type": "object",
                    "properties": {
                        "name": { "type": "string" },
                        "query_string": { "type": "string" },
                        "hash": { "type": "string" },
                        "url": { "type": "string" },
                        "path": { "type": "string" },
                        "campaign_code": { "type": "string" },
                        "assets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "value": { "type": "string" },
                                    "name": { "type": "string" }
                                }
                            }
                        },
                        "previous": { "type": "string" },
                        "views": { "type": "number" },
                        "error_page": { "type": "boolean" },
                        "home_page": { "type": "boolean" },
                        "view_name": { "type": "string" }
                    }
                },
                "form": {
                    "type": "object",
                    "properties": {
                        "assets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "value": { "type": "string" },
                                    "name": { "type": "string" }
                                }
                            }
                        },
                        "error_message": { "type": "string" },
                        "source": { "type": "string" },
                        "name": { "type": "string" }
                    }
                },
                "search": {
                    "type": "object",
                    "properties": {
                        "term": { "type": "string" },
                        "result_count": { "type": "integer" },
                        "category": { "type": "string" },
                        "filter": { "type": "string" },
                        "position": { "type": "integer" },
                        "assets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "value": { "type": "string" },
                                    "name": { "type": "string" }
                                }
                            }
                        }
                    }
                },
                "user": {
                    "type": "object",
                    "properties": {
                        "gender": { "type": "string" },
                        "authenticated": { "type": "boolean" },
                        "group_number": { "type": "string" },
                        "group_name": { "type": "string" },
                        "lob_plan_code": { "type": "string" },
                        "exchange": { "type": "string" },
                        "aso": { "type": "boolean" },
                        "custom_network": { "type": "boolean" },
                        "age": { "type": "string" },
                        "policy_active": { "type": "boolean" },
                        "pcp_selected": { "type": "boolean" },
                        "signature_service": { "type": "boolean" },
                        "smart_shopper": { "type": "boolean" },
                        "assets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "value": { "type": "string" },
                                    "name": { "type": "string" }
                                }
                            }
                        },
                        "session_start": { "type": "string" },
                        "ruid": { "type": "string" },
                        "person_id": { "type": "string" },
                        "relationship": { "type": "string" }
                    }
                }
            }
        };

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
    }

    // Adobe Event Listener Mock (Rules Engine)
    // We proxy the data layer object *after* it is created to watch for changes.
    // Since we can't easily proxy the assignment itself from here (timing),
    // we will rely on a poller or a wrapper in the app.js to detect changes for the demo.
    // However, for best realism, let's wrap the set method if we can.

    // We will wait for the data layer to exist to wrap it.
    const waitForDL = setInterval(() => {
        const dl = window[customDataObjectName];
        if (dl) {
            console.log(`[MockEnv] ${customDataObjectName} detected.`);

            console.log(useRealAdobe
                ? '[MockEnv] Real Adobe mode enabled. Setting up visualization wrappers only...'
                : '[MockEnv] Setting up mock Event Listeners...');

            // Wrap setters to detect events
            const originalSet = dl.set;
            const originalSetView = dl.setView;

            // Proxy setView -> "Direct Call Rule: View Change"
            dl.setView = function (name, touchpoint) {
                const result = originalSetView.apply(this, arguments);
                if (result && !useRealAdobe) {
                    if (window.logToUI) window.logToUI(`[Adobe Rule] Triggered: "View Change" (Page Name: ${name})`, 'event');
                }
                updateVisualizer();
                return result;
            };

            // Proxy generic set -> Watch for specific keys if needed
            dl.set = function (path, value) {
                const result = originalSet.apply(this, arguments);
                if (result && !useRealAdobe) {
                    // Detect Page View change via raw set
                    if (path === 'page.view_name') {
                        if (window.logToUI) window.logToUI(`[Adobe Rule] Triggered: "View Change" (Manual Set)`, 'event');
                    }
                }
                updateVisualizer();
                return result;
            };

            // Wrap other methods that change state for visualization updates
            const methods = ['setAssets', 'clearTouchpoint', 'setKPI', 'setTouchpoint', 'merge', 'setForm', 'setPage', 'setUser', 'setSearch'];
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
