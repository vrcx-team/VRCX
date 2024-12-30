class InteropApi {
    constructor() {
    	return new Proxy(this, {
    		get(target, prop) {
				if (LINUX) {
    				// If the property is not a method of InteropApi, 
    				// treat it as a .NET class name
    				if (typeof prop === 'string' && !target[prop]) {
    					return new Proxy({}, {
    						get(_, methodName) {
    							// Return a method that calls the .NET method dynamically
    							return async (...args) => {
    								return await target.callMethod(prop, methodName, ...args);
    							};
    						}
    					});
    				}
    				return target[prop];
				} else {
					return undefined;
				}
    		}
    	});
    }
  
    async callMethod(className, methodName, ...args) {
    	return window.interopApi.callDotNetMethod(className, methodName, args)
    		.then(result => {
    			return result;
    	});
    }
}

export default new InteropApi();