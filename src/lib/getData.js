module.exports = function (settings) {
    const path = settings.path;

    if (!path) {
        turbine.logger.warn('Data Element "Get Data Layer Value": Path is not configured.');
        return undefined;
    }

    let dataObjectName;
    try {
        const extensionSettings = turbine.getExtensionSettings();
        dataObjectName = extensionSettings.dataObjectName;
    } catch (e) {
        turbine.logger.error('Data Element "Get Data Layer Value": Failed to get extension settings for data object name: ' + e.message);
        return undefined;
    }

    if (!dataObjectName) {
        turbine.logger.error('Data Element "Get Data Layer Value": Data layer object name is not configured in the extension settings.');
        return undefined;
    }

    const dataLayerObject = window[dataObjectName];

    if (!dataLayerObject || typeof dataLayerObject.get !== 'function') {
        turbine.logger.warn(`Data Element "Get Data Layer Value": Data layer object "${dataObjectName}" or its "get" method not found on window.`);
        return undefined;
    }

    try {
        return dataLayerObject.get(path);
    } catch (e) {
        turbine.logger.error(`Data Element "Get Data Layer Value": Error calling ${dataObjectName}.get("${path}"): ${e.message}`);
        return undefined;
    }
};