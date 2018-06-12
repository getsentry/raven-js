"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var domain_1 = require("./domain");
var global_1 = require("./global");
/**
 * API compatibility version of this shim.
 *
 * WARNING: This number should only be incresed when the global interface
 * changes a and new methods are introduced.
 */
exports.API_VERSION = 2;
/**
 * Internal class used to make sure we always have the latest internal functions
 * working in case we have a version conflict.
 */
var Shim = /** @class */ (function () {
    /** Creates a new shim instance. */
    function Shim(version) {
        if (version === void 0) { version = exports.API_VERSION; }
        this.version = version;
        var stack = global_1.getGlobalStack();
        if (stack.length === 0) {
            stack.push({ scope: this.createScope(), type: 'process' });
        }
    }
    /**
     * Checks if this shim's version is older than the given version.
     *
     * @param version A version number to compare to.
     * @return True if the given version is newer; otherwise false.
     */
    Shim.prototype.isOlderThan = function (version) {
        return this.version < version;
    };
    /**
     * Creates a new 'local' ScopeLayer with the given client.
     * @param client Optional client, defaults to the current client.
     */
    Shim.prototype.pushScope = function (client) {
        var usedClient = client || this.getCurrentClient();
        // We want to clone the last scope and not create a new one
        var stack = this.getStack();
        var parentScope = stack.length > 0 ? stack[stack.length - 1].scope : undefined;
        this.getStack().push({
            client: usedClient,
            scope: this.createScope(usedClient, parentScope),
            type: 'local',
        });
    };
    /** Removes the top most ScopeLayer of the current stack. */
    Shim.prototype.popScope = function () {
        return this.getStack().pop() !== undefined;
    };
    /**
     * Convenience method for pushScope and popScope.
     *
     * @param arg1 Either the client or callback.
     * @param arg2 Either the client or callback.
     */
    Shim.prototype.withScope = function (arg1, arg2) {
        var callback = arg1;
        var client = arg2;
        if (!!(arg1 && arg1.constructor && arg1.call && arg1.apply)) {
            callback = arg1;
            client = arg2;
        }
        if (!!(arg2 && arg2.constructor && arg2.call && arg2.apply)) {
            callback = arg2;
            client = arg1;
        }
        this.pushScope(client);
        try {
            callback();
        }
        finally {
            this.popScope();
        }
    };
    /** Returns the client of the currently active scope. */
    Shim.prototype.getCurrentClient = function () {
        return this.getStackTop().client;
    };
    /** Returns the scope stack for domains or the process. */
    Shim.prototype.getStack = function () {
        return domain_1.getDomainStack() || global_1.getGlobalStack();
    };
    /** Returns the topmost scope layer in the order domain > local > process. */
    Shim.prototype.getStackTop = function () {
        return this.getDomainStackTop() || this.getGlobalStackTop();
    };
    /** Returns the topmost ScopeLayer from the global stack. */
    Shim.prototype.getGlobalStackTop = function () {
        var stack = global_1.getGlobalStack();
        return stack[stack.length - 1];
    };
    /** Tries to return the top most ScopeLayer from the domainStack. */
    Shim.prototype.getDomainStackTop = function () {
        var stack = domain_1.getDomainStack();
        if (!stack) {
            return undefined;
        }
        if (stack.length === 0) {
            var client = this.getCurrentClient();
            stack.push({
                client: client,
                scope: this.createScope(client),
                type: 'domain',
            });
        }
        return stack[stack.length - 1];
    };
    /**
     * Obtains a new scope instance from the client.
     *
     * @param client A SDK client that implements `createScope`.
     * @param parentScope Optional parent scope to inherit from.
     * @returns The scope instance or an empty object on error.
     */
    Shim.prototype.createScope = function (client, parentScope) {
        try {
            return client && client.createScope(parentScope);
        }
        catch (_a) {
            return undefined;
        }
    };
    return Shim;
}());
exports.Shim = Shim;
//# sourceMappingURL=shim.js.map