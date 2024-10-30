import { baseClass, $app, API, $t } from './baseClass.js';

export default class extends baseClass {
    constructor(_app) {
        super(_app);
    }

    eventHandlers = new Map();

    $emit = function (name, ...args) {
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

    $on = function (name, handler) {
        var handlers = this.eventHandlers.get(name);
        if (typeof handlers === 'undefined') {
            handlers = [];
            this.eventHandlers.set(name, handlers);
        }
        handlers.push(handler);
    };

    $off = function (name, handler) {
        var handlers = this.eventHandlers.get(name);
        if (typeof handlers === 'undefined') {
            return;
        }
        var { length } = handlers;
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
}
