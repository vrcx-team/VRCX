const dotnet = require('node-api-dotnet/net10.0');

class InteropApi {
    constructor() {
        // Cache for .NET objects, might be problematic if we require a new instance every time
        this.createdObjects = {};
    }

    getDotNetObject(className) {
        if (!this.createdObjects[className]) {
            console.log(`Creating new instance of ${className}`);
            // @ts-ignore
            this.createdObjects[className] = new dotnet.VRCX[className]();
        }
        return this.createdObjects[className];
    }

    callMethod(className, methodName, args) {
        if (typeof className !== 'string' || typeof methodName !== 'string' || !Array.isArray(args)) {
            throw new Error('Invalid .NET bridge call.');
        }
        // Plaintext session data is reserved for the main-process encrypted vault.
        if (
            className.toLowerCase() === 'webapi' &&
            ['exportexternalsession', 'restoreexternalsession'].includes(methodName.toLowerCase())
        ) {
            throw new Error('Session data is restricted to the main application process.');
        }
        try {
            const obj = this.getDotNetObject(className);
            if (typeof obj[methodName] !== 'function') {
                throw new Error(`Method ${methodName} does not exist on class ${className}`);
            }
            return obj[methodName](...args);
        } catch (e) {
            console.error('Error calling .NET method', `${className}.${methodName}`, e);
            throw e;
        }
    }
}

module.exports = InteropApi;
