<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Get Data Layer Value Configuration</title>
     <style>
        body { font-family: sans-serif; padding: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"] { width: 300px; padding: 8px; margin-bottom: 15px; border: 1px solid #ccc; }
       .error { border-color: red; }
        .help-text { font-size: 0.9em; color: #666; margin-bottom: 15px; }
    </style>
</head>
<body>

<h1>Get Data Layer Value</h1>

<div>
    <label for="path">Path:</label>
    <input type="text" id="path" placeholder="e.g., user.profile.email">
     <p class="help-text">Enter the path to the data you want to retrieve from the configured data layer object.</p>
</div>

<script src="https://assets.adobedtm.com/activation/reactor/extensionbridge/extensionbridge.min.js"></script>
<script>
  window.extensionBridge.register({
    init: function(info) {
      // Pre-populate path if editing existing settings
      if (info.settings && info.settings.path) {
        document.getElementById('path').value = info.settings.path;
      }
    },
    validate: function() {
      // Basic validation: ensure path is not empty
      const pathInput = document.getElementById('path');
      const pathValue = pathInput.value.trim();
      const isValid = pathValue.length > 0;

      // Provide visual feedback
      if (!isValid) {
          pathInput.classList.add('error');
          alert('Please enter a path.');
      } else {
           pathInput.classList.remove('error');
      }
      return isValid; // Return boolean
    },
    getSettings: function() {
      // Return settings object matching the schema in extension.json
      return {
        path: document.getElementById('path').value.trim()
      };
    }
  });
</script>

</body>
</html>
