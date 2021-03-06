/**
 * Main entry point for angular 1.x build
 * @module ng1
 */ /** */
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("ui-router-core");
exports.core = core;
__export(require("ui-router-core"));
__export(require("./services"));
__export(require("./statebuilders/views"));
__export(require("./stateProvider"));
__export(require("./urlRouterProvider"));
require("./injectables");
require("./directives/stateDirectives");
require("./stateFilters");
require("./directives/viewDirective");
require("./viewScroll");
exports.default = "ui.router";
//# sourceMappingURL=index.js.map