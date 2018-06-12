"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var global_1 = require("./global");
var shim_1 = require("./shim");
/** Default callback used for catching async errors. */
function logError(e) {
    if (e) {
        console.error(e);
    }
}
/**
 * Internal helper function to call a method on the top client if it exists.
 *
 * @param method The method to call on the client/client.
 * @param args Arguments to pass to the client/fontend.
 */
function invokeClient(method) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var top = getOrCreateShim().getStackTop();
    if (top && top.client && top.client[method]) {
        (_a = top.client)[method].apply(_a, __spread(args, [top.scope]));
    }
    var _a;
}
/**
 * Internal helper function to call an async method on the top client if it
 * exists.
 *
 * @param method The method to call on the client/client.
 * @param callback A callback called with the error or success return value.
 * @param args Arguments to pass to the client/fontend.
 */
function invokeClientAsync(method, callback) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var top = getOrCreateShim().getStackTop();
    if (top && top.client && top.client[method]) {
        (_a = top.client)[method].apply(_a, __spread(args, [top.scope])).then(function (value) {
            callback(undefined, value);
        })
            .catch(function (err) {
            callback(err);
        });
    }
    var _a;
}
/**
 * Returns the latest shim instance.
 *
 * If a shim is already registered in the global registry but this module
 * contains a more recent version, it replaces the registered version.
 * Otherwise, the currently registered shim will be returned.
 */
function getOrCreateShim() {
    var registry = global_1.getGlobalRegistry();
    if (!registry.shim || registry.shim.isOlderThan(shim_1.API_VERSION)) {
        registry.shim = new shim_1.Shim();
    }
    return registry.shim;
}
/**
 * Create a new scope to store context information.
 *
 * The scope will be layered on top of the current one. It is isolated, i.e. all
 * breadcrumbs and context information added to this scope will be removed once
 * the scope ends. Be sure to always remove this scope with {@link popScope}
 * when the operation finishes or throws.
 */
function pushScope(client) {
    getOrCreateShim().pushScope(client);
}
exports.pushScope = pushScope;
/**
 * Removes a previously pushed scope from the stack.
 *
 * This restores the state before the scope was pushed. All breadcrumbs and
 * context information added since the last call to {@link pushScope} are
 * discarded.
 */
function popScope() {
    getOrCreateShim().popScope();
}
exports.popScope = popScope;
function withScope(arg1, arg2) {
    getOrCreateShim().withScope(arg1, arg2);
}
exports.withScope = withScope;
/** Returns the current client, if any. */
function getCurrentClient() {
    return getOrCreateShim().getCurrentClient();
}
exports.getCurrentClient = getCurrentClient;
/**
 * This binds the given client to the current scope.
 * @param client An SDK client (client) instance.
 */
function bindClient(client) {
    var shim = getOrCreateShim();
    var top = shim.getStackTop();
    top.client = client;
    top.scope = shim.createScope(client);
}
exports.bindClient = bindClient;
/**
 * Captures an exception event and sends it to Sentry.
 *
 * @param exception An exception-like object.
 * @param callback A callback that is invoked when the exception has been sent.
 */
function captureException(exception, callback) {
    if (callback === void 0) { callback = logError; }
    invokeClientAsync('captureException', callback, exception);
}
exports.captureException = captureException;
/**
 * Captures a message event and sends it to Sentry.
 *
 * @param message The message to send to Sentry.
 * @param callback A callback that is invoked when the message has been sent.
 */
function captureMessage(message, callback) {
    if (callback === void 0) { callback = logError; }
    invokeClientAsync('captureMessage', callback, message);
}
exports.captureMessage = captureMessage;
/**
 * Captures a manually created event and sends it to Sentry.
 *
 * @param event The event to send to Sentry.
 * @param callback A callback that is invoked when the event has been sent.
 */
function captureEvent(event, callback) {
    if (callback === void 0) { callback = logError; }
    invokeClientAsync('captureEvent', callback, event);
}
exports.captureEvent = captureEvent;
/**
 * Records a new breadcrumb which will be attached to future events.
 *
 * Breadcrumbs will be added to subsequent events to provide more context on
 * user's actions prior to an error or crash.
 *
 * @param breadcrumb The breadcrumb to record.
 */
function addBreadcrumb(breadcrumb) {
    invokeClient('addBreadcrumb', breadcrumb);
}
exports.addBreadcrumb = addBreadcrumb;
/**
 * Callback to set context information onto the scope.
 *
 * @param callback Callback function that receives Scope.
 */
function configureScope(callback) {
    var top = getOrCreateShim().getStackTop();
    if (top.client && top.scope) {
        // TODO: freeze flag
        callback(top.scope);
    }
}
exports.configureScope = configureScope;
/**
 * Calls a function on the latest client. Use this with caution, it's meant as
 * in "internal" helper so we don't need to expose every possible function in
 * the shim. It is not guaranteed that the client actually implements the
 * function.
 *
 * @param method The method to call on the client/client.
 * @param args Arguments to pass to the client/fontend.
 */
function _callOnClient(method) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    invokeClient.apply(void 0, __spread([method], args));
}
exports._callOnClient = _callOnClient;
//# sourceMappingURL=sdk.js.map