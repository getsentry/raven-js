"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dsn_1 = require("./dsn");
var scope_1 = require("./scope");
var status_1 = require("./status");
/**
 * Default maximum number of breadcrumbs added to an event. Can be overwritten
 * with {@link Options.maxBreadcrumbs}.
 */
var DEFAULT_BREADCRUMBS = 30;
/**
 * Absolute maximum number of breadcrumbs added to an event. The
 * `maxBreadcrumbs` option cannot be higher than this value.
 */
var MAX_BREADCRUMBS = 100;
/**
 * Base implementation for all JavaScript SDK clients.
 *
 * Call the constructor with the corresponding backend constructor and options
 * specific to the client subclass. To access these options later, use
 * {@link Client.getOptions}. Also, the Backend instance is available via
 * {@link Client.getBackend}.
 *
 * Subclasses must implement one abstract method: {@link getSdkInfo}. It must
 * return the unique name and the version of the SDK.
 *
 * If a DSN is specified in the options, it will be parsed and stored. Use
 * {@link Client.getDSN} to retrieve the DSN at any moment. In case the DSN is
 * invalid, the constructor will throw a {@link SentryException}. Note that
 * without a valid DSN, the SDK will not send any events to Sentry.
 *
 * Before sending an event via the backend, it is passed through
 * {@link BaseClient.prepareEvent} to add SDK information and scope data
 * (breadcrumbs and context). To add more custom information, override this
 * method and extend the resulting prepared event.
 *
 * To issue automatically created events (e.g. via instrumentation), use
 * {@link Client.captureEvent}. It will prepare the event and pass it through
 * the callback lifecycle. To issue auto-breadcrumbs, use
 * {@link Client.addBreadcrumb}.
 *
 * @example
 * class NodeClient extends BaseClient<NodeBackend, NodeOptions> {
 *   public constructor(options: NodeOptions) {
 *     super(NodeBackend, options);
 *   }
 *
 *   // ...
 * }
 */
var BaseClient = /** @class */ (function () {
    /**
     * Initializes this client instance.
     *
     * @param backendClass A constructor function to create the backend.
     * @param options Options for the client.
     */
    function BaseClient(backendClass, options) {
        this.backend = new backendClass(options);
        this.options = options;
        if (options.dsn) {
            this.dsn = new dsn_1.DSN(options.dsn);
        }
    }
    /**
     * @inheritDoc
     */
    BaseClient.prototype.install = function () {
        if (!this.isEnabled()) {
            return false;
        }
        if (this.installed === undefined) {
            this.installed = this.getBackend().install();
        }
        return this.installed;
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.captureException = function (exception, scope) {
        return __awaiter(this, void 0, void 0, function () {
            var event;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getBackend().eventFromException(exception)];
                    case 1:
                        event = _a.sent();
                        return [4 /*yield*/, this.captureEvent(event, scope)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.captureMessage = function (message, scope) {
        return __awaiter(this, void 0, void 0, function () {
            var event;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getBackend().eventFromMessage(message)];
                    case 1:
                        event = _a.sent();
                        return [4 /*yield*/, this.captureEvent(event, scope)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.captureEvent = function (event, scope) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.processEvent(event, function (finalEvent) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, this.getBackend().sendEvent(finalEvent)];
                        }); }); }, scope)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.addBreadcrumb = function (breadcrumb, scope) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, shouldAddBreadcrumb, beforeBreadcrumb, afterBreadcrumb, _b, maxBreadcrumbs, timestamp, mergedBreadcrumb, finalBreadcrumb;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this.getOptions(), shouldAddBreadcrumb = _a.shouldAddBreadcrumb, beforeBreadcrumb = _a.beforeBreadcrumb, afterBreadcrumb = _a.afterBreadcrumb, _b = _a.maxBreadcrumbs, maxBreadcrumbs = _b === void 0 ? DEFAULT_BREADCRUMBS : _b;
                        if (maxBreadcrumbs <= 0) {
                            return [2 /*return*/];
                        }
                        timestamp = new Date().getTime() / 1000;
                        mergedBreadcrumb = __assign({ timestamp: timestamp }, breadcrumb);
                        if (shouldAddBreadcrumb && !shouldAddBreadcrumb(mergedBreadcrumb)) {
                            return [2 /*return*/];
                        }
                        finalBreadcrumb = beforeBreadcrumb
                            ? beforeBreadcrumb(mergedBreadcrumb)
                            : mergedBreadcrumb;
                        return [4 /*yield*/, this.getBackend().storeBreadcrumb(finalBreadcrumb)];
                    case 1:
                        if ((_c.sent()) && scope) {
                            scope.addBreadcrumb(finalBreadcrumb, Math.min(maxBreadcrumbs, MAX_BREADCRUMBS));
                        }
                        if (afterBreadcrumb) {
                            afterBreadcrumb(finalBreadcrumb);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.getDSN = function () {
        return this.dsn;
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.getOptions = function () {
        return this.options;
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.createScope = function (parentScope) {
        var _this = this;
        var newScope = new scope_1.Scope();
        newScope.setParentScope(parentScope);
        newScope.setOnChange(function (scope) {
            _this.getBackend().storeScope(scope);
        });
        return newScope;
    };
    /** Returns the current backend. */
    BaseClient.prototype.getBackend = function () {
        return this.backend;
    };
    /** Determines whether this SDK is enabled and a valid DSN is present. */
    BaseClient.prototype.isEnabled = function () {
        return this.getOptions().enabled !== false && this.dsn !== undefined;
    };
    /**
     * Adds common information to events.
     *
     * The information includes release and environment from `options`, SDK
     * information returned by {@link BaseClient.getSdkInfo}, as well as
     * breadcrumbs and context (extra, tags and user) from the scope.
     *
     * Information that is already present in the event is never overwritten. For
     * nested objects, such as the context, keys are merged.
     *
     * @param event The original event.
     * @param scope A scope containing event metadata.
     * @returns A new event with more information.
     */
    BaseClient.prototype.prepareEvent = function (event, scope) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, environment, _b, maxBreadcrumbs, release, prepared;
            return __generator(this, function (_c) {
                _a = this.getOptions(), environment = _a.environment, _b = _a.maxBreadcrumbs, maxBreadcrumbs = _b === void 0 ? DEFAULT_BREADCRUMBS : _b, release = _a.release;
                prepared = __assign({ sdk: this.getSdkInfo() }, event);
                if (prepared.environment === undefined && environment !== undefined) {
                    prepared.environment = environment;
                }
                if (prepared.release === undefined && release !== undefined) {
                    prepared.release = release;
                }
                if (scope) {
                    scope.applyToEvent(prepared, Math.min(maxBreadcrumbs, MAX_BREADCRUMBS));
                }
                return [2 /*return*/, prepared];
            });
        });
    };
    /**
     * Processes an event (either error or message) and sends it to Sentry.
     *
     * This also adds breadcrumbs and context information to the event. However,
     * platform specific meta data (such as the User's IP address) must be added
     * by the SDK implementor.
     *
     * The returned event status offers clues to whether the event was sent to
     * Sentry and accepted there. If the {@link Options.shouldSend} hook returns
     * `false`, the status will be {@link SendStatus.Skipped}. If the rate limit
     * was exceeded, the status will be {@link SendStatus.RateLimit}.
     *
     * @param event The event to send to Sentry.
     * @param send A function to actually send the event.
     * @param scope A scope containing event metadata.
     * @returns A Promise that resolves with the event status.
     */
    BaseClient.prototype.processEvent = function (event, send, scope) {
        return __awaiter(this, void 0, void 0, function () {
            var prepared, _a, shouldSend, beforeSend, afterSend, finalEvent, code, status;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.isEnabled()) {
                            return [2 /*return*/, status_1.SendStatus.Skipped];
                        }
                        return [4 /*yield*/, this.prepareEvent(event, scope)];
                    case 1:
                        prepared = _b.sent();
                        _a = this.getOptions(), shouldSend = _a.shouldSend, beforeSend = _a.beforeSend, afterSend = _a.afterSend;
                        if (shouldSend && !shouldSend(prepared)) {
                            return [2 /*return*/, status_1.SendStatus.Skipped];
                        }
                        finalEvent = beforeSend ? beforeSend(prepared) : prepared;
                        return [4 /*yield*/, send(finalEvent)];
                    case 2:
                        code = _b.sent();
                        status = status_1.SendStatus.fromHttpCode(code);
                        if (status === status_1.SendStatus.RateLimit) {
                            // TODO: Handle rate limits and maintain a queue. For now, we require SDK
                            // implementors to override this method and handle it themselves.
                        }
                        if (afterSend) {
                            afterSend(finalEvent, status);
                        }
                        return [2 /*return*/, status];
                }
            });
        });
    };
    return BaseClient;
}());
exports.BaseClient = BaseClient;
//# sourceMappingURL=base.js.map