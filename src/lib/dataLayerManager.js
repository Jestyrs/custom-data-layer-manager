const utils = require('./utils');

let isInitialized = false;
let dataLayerState = {};
let dataLayerSchema = {};
let dataLayerObjectName = 'digitalData';
let tenantPropertyName = '';

function initializeDataLayer() {
    if (isInitialized) {
        return;
    }

    try {
        const settings = turbine.getExtensionSettings();
        const configName = settings.dataObjectName;
        const configTenantName = settings.tenantPropertyName;
        const schemaJson = settings.initialSchemaJson || '{}';

        // 1. Validate and set Data Object Name
        if (configName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(configName)) {
            dataLayerObjectName = configName;
        }

        // 2. Validate and set Tenant Property Name
        if (configTenantName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(configTenantName)) {
            tenantPropertyName = configTenantName;
        } else {
            console.error('Data Layer: Invalid or missing Tenant Property Name in configuration. Methods will fail.');
        }

        // 3. Parse Schema
        try {
            dataLayerSchema = JSON.parse(schemaJson);
        } catch (e) {
            console.error('Data Layer: Failed to parse initial JSON schema. Using empty schema {}. Error: ' + e.message);
            dataLayerSchema = {};
        }

        // 4. Build the initial data layer state from the schema
        if (tenantPropertyName) {
            dataLayerState[tenantPropertyName] = utils.buildObjectFromSchema(dataLayerSchema);
            turbine.logger.log(`Data Layer: Initial state built from schema.`);
        }


        // Internal Set Value
        const _setValue = function (path, value) {
            const schemaProperty = utils.getDefinitionByPath(dataLayerSchema, path);

            // Path validation
            if (!schemaProperty) {
                console.error(`Data Layer (${dataLayerObjectName}): Set failed. Path "${path}" does not exist in the configured schema.`);
                return false;
            }

            // Type validation
            if (!utils.validateTypeBySchema(value, schemaProperty)) {
                const expectedType = schemaProperty.type;
                const actualType = utils.getTypeName(value);
                console.error(`Data Layer (${dataLayerObjectName}): Set failed for path "${path}". Invalid type provided. Expected "${expectedType}" but received "${actualType}".`);
                return false;
            }

            const fullPath = `${tenantPropertyName}.${path}`;
            utils.setPropertyByPath(dataLayerState, fullPath, value);
            turbine.logger.log(`Data Layer (${dataLayerObjectName}): Set successful: ${path}`);
            return true;
        };

        // 5. Define All Data Layer Methods
        const dataLayerMethods = {
            get: function (path) {
                if (!tenantPropertyName) return undefined;
                const fullPath = `${tenantPropertyName}.${path}`;
                return utils.getPropertyByPath(dataLayerState, fullPath);
            },

            set: function (path, value) {
                if (!tenantPropertyName) return false;

                // Value Validation (No objects, arrays, null, undefined, or empty strings)
                if (value === null || value === undefined || typeof value === 'object' || (typeof value === 'string' && value === '')) {
                    console.error(`Data Layer (${dataLayerObjectName}): Set failed for path "${path}". Value cannot be null, undefined, an empty string, or an object/array.`);
                    return false;
                }

                return _setValue(path, value);
            },

            merge: function (targetPath = null, mergeObj) {
                if (!tenantPropertyName) return false;
                if (!mergeObj || typeof mergeObj !== 'object') {
                    console.error(`Data Layer (${dataLayerObjectName}): Merge failed. Invalid object provided.`);
                    return false;
                }

                const basePath = dataLayerState[tenantPropertyName];
                let targetproperty = basePath;
                let schemaProperty = dataLayerSchema; // Start with the top-level schema

                if (targetPath) {
                    if (!utils.checkPathIsValid(dataLayerSchema, targetPath)) {
                        console.error(`Data Layer (${dataLayerObjectName}): Merge failed. Target path "${targetPath}" does not exist in the configured schema.`);
                        return false;
                    }
                    targetproperty = utils.getPropertyByPath(basePath, targetPath);
                    schemaProperty = utils.getDefinitionByPath(dataLayerSchema, targetPath);

                    if (targetproperty === undefined) {
                        utils.setPropertyByPath(basePath, targetPath, {});
                        targetproperty = utils.getPropertyByPath(basePath, targetPath);
                    }
                }

                utils.schemaMerge(targetproperty, mergeObj, schemaProperty);

                turbine.logger.log(`Data Layer (${dataLayerObjectName}): Merge successful${targetPath ? ' at path: ' + targetPath : ''}.`);
                return true;
            },

            setView: function (viewName, touchpoint) {
                if (typeof viewName !== 'string' || viewName.trim() === '') {
                    console.error(`Data Layer (${dataLayerObjectName}): setView failed. View name must be a non-empty string.`);
                    return false;
                }
                if (touchpoint && typeof touchpoint === 'string' && touchpoint.trim() !== '') {
                    this.set('application.touchpoint', touchpoint)
                }
                else if (touchpoint !== undefined) {
                    console.warn(`Data Layer (${dataLayerObjectName}): setView optional parameter "touchpoint" ignored. Touchpoint must be a non-empty string.`);
                }
                return this.set('page.view_name', viewName);
            },

            setKPI: function (kpiName) {
                if (typeof kpiName !== 'string' || kpiName.trim() === '') {
                    console.error(`Data Layer (${dataLayerObjectName}): setKPI failed. KPI name must be a non-empty string.`);
                    return false;
                }
                return this.set('application.kpi', kpiName);
            },

            setTouchpoint: function (touchpoint) {
                if (typeof touchpoint !== 'string' || touchpoint.trim() === '') {
                    console.error(`Data Layer (${dataLayerObjectName}): setTouchpoint failed. Touchpoint name must be a non-empty string.`);
                    return false;
                }
                return this.set('application.touchpoint', touchpoint);
            },

            clearTouchpoint: function () {
                return _setValue('application.touchpoint', '');
            },

            // setApplication: function (obj) { return this.merge(obj, 'application'); },
            // setEvent: function (obj) { return this.merge(obj, 'event'); },
            setForm: function (obj) { return this.merge(obj, 'form'); },
            setPage: function (obj) { return this.merge(obj, 'page'); },
            setUser: function (obj) { return this.merge(obj, 'user'); },
            setSearch: function (obj) { return this.merge(obj, 'search'); },

            setAssets: function (path, assetsObject) {
                if (!path || typeof path !== 'string') {
                    console.error(`Data Layer (${dataLayerObjectName}): setAssets failed. Path must be a valid string to the parent object.`);
                    return false;
                }
                if (utils.getTypeName(assetsObject) !== 'object') {
                    console.error(`Data Layer (${dataLayerObjectName}): setAssets failed. The second argument must be an object of key-value pairs.`);
                    return false;
                }

                const assetPath = `${path}.assets`;

                // Get existing assets, with robust fallback to empty array
                let currentAssets = this.get(assetPath);

                // Ensure currentAssets is always a valid array
                if (!currentAssets || !Array.isArray(currentAssets)) {
                    currentAssets = [];
                }

                // Build map from existing assets, filtering for valid objects with name/value
                const assetMap = new Map();
                for (let i = 0; i < currentAssets.length; i++) {
                    const asset = currentAssets[i];
                    if (asset && typeof asset === 'object' && asset.name !== undefined) {
                        assetMap.set(asset.name, asset.value);
                    }
                }

                // Add/update with new assets
                for (const name in assetsObject) {
                    if (Object.prototype.hasOwnProperty.call(assetsObject, name)) {
                        const value = assetsObject[name];
                        assetMap.set(name, value);
                    }
                }

                const newAssets = Array.from(assetMap, ([name, value]) => ({ name, value }));

                return _setValue(assetPath, newAssets);
            },

            _getState: function () { return JSON.parse(JSON.stringify(dataLayerState)); },
            _getSchema: function () { return JSON.parse(JSON.stringify(dataLayerSchema)); }
        };


        // 7. Attach to Window
        window[dataLayerObjectName] = dataLayerMethods;
        turbine.logger.log(`Data Layer: Object "${dataLayerObjectName}" and its methods initialized on window.`);

        // 8. Seal the object
        try {
            Object.seal(window[dataLayerObjectName]);
            turbine.logger.log(`Data Layer: Data layer object "${dataLayerObjectName}" has been sealed.`);
        } catch (sealError) {
            console.error('Data Layer: Failed to seal data layer object. Error: ' + sealError);
        }

        isInitialized = true;

    } catch (error) {
        console.error('Data Layer: Initialization failed. ' + error.message);
    }
}

initializeDataLayer();
module.exports = {};