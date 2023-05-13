const API = {}

API.eventHandlers = new Map();

    API.$emit = function (name, ...args) {
        if ($app.debug) {
            console.log(name, ...args);
        }
        var handlers = this.eventHandlers.get(name);
        if (typeof handlers === 'undefined') {
            return;
        }
        try {
            for (var handler of handlers) {
                handler.apply(this, args);
            }
        } catch (err) {
            console.error(err);
        }
    };

    API.$on = function (name, handler) {
        var handlers = this.eventHandlers.get(name);
        if (typeof handlers === 'undefined') {
            handlers = [];
            this.eventHandlers.set(name, handlers);
        }
        handlers.push(handler);
    };

    API.$off = function (name, handler) {
        var handlers = this.eventHandlers.get(name);
        if (typeof handlers === 'undefined') {
            return;
        }
        var {length} = handlers;
        for (var i = 0; i < length; ++i) {
            if (handlers[i] === handler) {
                if (length > 1) {
                    handlers.splice(i, 1);
                } else {
                    this.eventHandlers.delete(name);
                }
                break;
            }
        }
    };

    API.pendingGetRequests = new Map();
    API.failedGetRequests = new Map();
    API.endpointDomainVrchat = 'https://api.vrchat.cloud/api/1';
    API.websocketDomainVrchat = 'wss://pipeline.vrchat.cloud';
    API.endpointDomain = 'https://api.vrchat.cloud/api/1';
    API.websocketDomain = 'wss://pipeline.vrchat.cloud';

module.exports = API