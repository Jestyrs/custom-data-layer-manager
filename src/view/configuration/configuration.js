// Wait for the extension bridge to be ready
window.addEventListener('load', function () {
    if (!window.extensionBridge) {
        console.error('Extension bridge not found!');
        return;
    }

    const dataLayerNameInput = document.getElementById('data-layer-name');
    const initialDataTextarea = document.getElementById('initial-data');
    const jsonErrorDiv = document.getElementById('json-error');

    let currentSettings = {};

    /**
     * Validates the JSON in the initialData textarea.
     * @returns {boolean} True if JSON is valid, false otherwise.
     */
    function validateJson() {
        try {
            JSON.parse(initialDataTextarea.value || '{}'); // Allow empty textarea, treat as empty object
            jsonErrorDiv.style.display = 'none';
            initialDataTextarea.classList.remove('spectrum-Textarea--invalid');
            return true;
        } catch (e) {
            jsonErrorDiv.style.display = 'block';
            jsonErrorDiv.textContent = 'Invalid JSON: ' + e.message;
            initialDataTextarea.classList.add('spectrum-Textarea--invalid');
            return false;
        }
    }

    /**
     * Retrieves the current settings from the form fields.
     * @returns {object} The settings object.
     */
    function getSettingsFromUi() {
        return {
            // Use placeholder if input is empty, fallback to default in initialize script
            dataLayerName: dataLayerNameInput.value || undefined,
            initialData: initialDataTextarea.value || '{}'
        };
    }

    // --- Initialize the UI --- 
    // Fetch initial settings when the view loads
    extensionBridge.init(function (info) {
        if (info && info.settings) {
            currentSettings = info.settings;
            dataLayerNameInput.value = currentSettings.dataLayerName || '';
            initialDataTextarea.value = currentSettings.initialData || '';
            validateJson();
        }

        // Inform Launch that initialization is complete
        extensionBridge.setInitialized(true);
    });

    // --- Event Listeners --- 
    // Validate JSON whenever the textarea content changes
    initialDataTextarea.addEventListener('input', validateJson);

    // --- Expose Bridge Methods --- 
    extensionBridge.getSettings(function () {
        // Return the latest settings from the UI
        return getSettingsFromUi();
    });

    extensionBridge.validate(function () {
        // Validate the JSON format before saving
        return validateJson();
    });

});
