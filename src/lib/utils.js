/**
 * Retrieve a value from an object using a path.
 */
function getPropertyByPath(obj, path) {
    if (!obj || typeof path !== 'string') {
        return undefined;
    }
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
        const key = parts[i];
        if (current === null || typeof current !== 'object' || !(key in current)) {
            return undefined;
        }
        current = current[key];
    }
    return current;
}

/**
 * Sets a value at a specified path within an object.
 */
function setPropertyByPath(obj, path, value) {
    if (typeof path !== 'string' || path === '') {
        return obj;
    }
    const keys = path.split('.');
    const lastKeyIndex = keys.length - 1;
    let current = obj;

    for (let i = 0; i < lastKeyIndex; ++i) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
            current[key] = {};
        }
        current = current[key];
    }
    current[keys[lastKeyIndex]] = value;
    return obj;
}

/**
 * Checks if a given path exists within a schema object.
 */
function checkPathIsValid(schema, path) {
    if (!schema || typeof path !== 'string') {
        return false;
    }
    const parts = path.split('.');
    let current = schema;
    for (let i = 0; i < parts.length; i++) {
        const key = parts[i];
        const properties = current.properties || current;
        if (typeof properties !== 'object' || properties === null || !(key in properties)) {
            return false;
        }
        current = properties[key];
    }
    return true;
}

/**
 * Retrieves a specific property definition from a schema object using a path.
 */
function getDefinitionByPath(schema, path) {
    if (!schema || typeof path !== 'string') {
        return undefined;
    }
    const parts = path.split('.');
    let current = schema;
    for (let i = 0; i < parts.length; i++) {
        const key = parts[i];
        const properties = current.properties || current;
        if (typeof properties !== 'object' || properties === null || !(key in properties)) {
            return undefined;
        }
        current = properties[key];
    }
    return current;
}

/**
 * Merges a source object into a target object based on a schema.
 */
function schemaMerge(target, source, schemaProperty) {
    if (!source || typeof source !== 'object' || !schemaProperty) {
        return;
    }
    const allowedProperties = schemaProperty.properties || schemaProperty;
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (key in allowedProperties) {
                const sourceValue = source[key];
                const targetValue = target[key];
                const subschemaProperty = allowedProperties[key];

                // Handle If the property is a nested object.
                if (getTypeName(sourceValue) === 'object' && getTypeName(targetValue) === 'object') {
                    schemaMerge(target[key], sourceValue, subschemaProperty);
                }
                else {

                    // For all other types use type validation before assigning the value.
                    if (validateTypeBySchema(sourceValue, subschemaProperty)) {
                        target[key] = sourceValue;
                    } else {
                        const expectedType = subschemaProperty.type;
                        const actualType = getTypeName(sourceValue);
                        console.error(`Merge failed for property "${key}". Invalid type provided. Expected "${expectedType}" but received "${actualType}".`);
                    }
                }
            }
        }
    }
}

/**
 * Gets a type name for a value.
 */
function getTypeName(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}

/**
 * Validates a value against what type is defined in any schema property.
 */
function validateTypeBySchema(value, schemaProperty) {
    if (!schemaProperty || !schemaProperty.type) {
        return true; // No type defined in schema, so we cannot validate.
    }
    const expectedType = schemaProperty.type;
    const actualType = getTypeName(value);

    if (expectedType === 'integer') {
        return Number.isInteger(value);
    }

    return expectedType === actualType;
}


/**
 * Builds an object from schema.
 * Use default values where specified, otherwise empty type-appropriate values.
 */
function buildObjectFromSchema(schemaProperty) {
    // Handle default values.
    if (schemaProperty.hasOwnProperty('default')) {
        return JSON.parse(JSON.stringify(schemaProperty.default));
    }

    // Handle types defined in the schema.
    if (schemaProperty.hasOwnProperty('type')) {
        switch (schemaProperty.type) {
            case 'object':
                const obj = {};
                if (schemaProperty.properties) {
                    for (const key in schemaProperty.properties) {
                        if (Object.prototype.hasOwnProperty.call(schemaProperty.properties, key)) {
                            obj[key] = buildObjectFromSchema(schemaProperty.properties[key]);
                        }
                    }
                }
                return obj;
            case 'array':
                return [];
            case 'string':
                return '';
            case 'number':
            case 'integer':
                return 0;
            case 'boolean':
                return false;
            default:
                return null;
        }
    }

    // If there's no type but it's a valid object, make its keys properties.
    if (typeof schemaProperty === 'object' && !Array.isArray(schemaProperty) && schemaProperty !== null) {
        const implicitObj = {};
        for (const key in schemaProperty) {
            if (Object.prototype.hasOwnProperty.call(schemaProperty, key)) {
                implicitObj[key] = buildObjectFromSchema(schemaProperty[key]);
            }
        }
        return implicitObj;
    }

    return null;
}

module.exports = {
    getPropertyByPath,
    setPropertyByPath,
    checkPathIsValid,
    getDefinitionByPath,
    schemaMerge,
    getTypeName,
    validateTypeBySchema,
    buildObjectFromSchema
};