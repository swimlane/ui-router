"use strict";
var angular_1 = require("../angular");
var angular_2 = require("angular");
var ui_router_core_1 = require("ui-router-core");
var views_1 = require("../statebuilders/views");
var services_1 = require("../services");
exports.uiView = ['$view', '$animate', '$uiViewScroll', '$interpolate', '$q',
    function $ViewDirective($view, $animate, $uiViewScroll, $interpolate, $q) {
        function getRenderer(attrs, scope) {
            return {
                enter: function (element, target, cb) {
                    if (angular_1.ng.version.minor > 2) {
                        $animate.enter(element, null, target).then(cb);
                    }
                    else {
                        $animate.enter(element, null, target, cb);
                    }
                },
                leave: function (element, cb) {
                    if (angular_1.ng.version.minor > 2) {
                        $animate.leave(element).then(cb);
                    }
                    else {
                        $animate.leave(element, cb);
                    }
                }
            };
        }
        function configsEqual(config1, config2) {
            return config1 === config2;
        }
        var rootData = {
            $cfg: { viewDecl: { $context: $view._pluginapi._rootViewContext() } },
            $uiView: {}
        };
        var directive = {
            count: 0,
            restrict: 'ECA',
            terminal: true,
            priority: 400,
            transclude: 'element',
            compile: function (tElement, tAttrs, $transclude) {
                return function (scope, $element, attrs) {
                    var previousEl, currentEl, currentScope, unregister, onloadExp = attrs['onload'] || '', autoScrollExp = attrs['autoscroll'], renderer = getRenderer(attrs, scope), viewConfig = undefined, inherited = $element.inheritedData('$uiView') || rootData, name = $interpolate(attrs['uiView'] || attrs['name'] || '')(scope) || '$default';
                    var activeUIView = {
                        $type: 'ng1',
                        id: directive.count++,
                        name: name,
                        fqn: inherited.$uiView.fqn ? inherited.$uiView.fqn + "." + name : name,
                        config: null,
                        configUpdated: configUpdatedCallback,
                        get creationContext() {
                            var fromParentTagConfig = ui_router_core_1.parse('$cfg.viewDecl.$context')(inherited);
                            var fromParentTag = ui_router_core_1.parse('$uiView.creationContext')(inherited);
                            return fromParentTagConfig || fromParentTag;
                        }
                    };
                    ui_router_core_1.trace.traceUIViewEvent("Linking", activeUIView);
                    function configUpdatedCallback(config) {
                        if (config && !(config instanceof views_1.Ng1ViewConfig))
                            return;
                        if (configsEqual(viewConfig, config))
                            return;
                        ui_router_core_1.trace.traceUIViewConfigUpdated(activeUIView, config && config.viewDecl && config.viewDecl.$context);
                        viewConfig = config;
                        updateView(config);
                    }
                    $element.data('$uiView', { $uiView: activeUIView });
                    updateView();
                    unregister = $view.registerUIView(activeUIView);
                    scope.$on("$destroy", function () {
                        ui_router_core_1.trace.traceUIViewEvent("Destroying/Unregistering", activeUIView);
                        unregister();
                    });
                    function cleanupLastView() {
                        if (previousEl) {
                            ui_router_core_1.trace.traceUIViewEvent("Removing (previous) el", previousEl.data('$uiView'));
                            previousEl.remove();
                            previousEl = null;
                        }
                        if (currentScope) {
                            ui_router_core_1.trace.traceUIViewEvent("Destroying scope", activeUIView);
                            currentScope.$destroy();
                            currentScope = null;
                        }
                        if (currentEl) {
                            var _viewData_1 = currentEl.data('$uiViewAnim');
                            ui_router_core_1.trace.traceUIViewEvent("Animate out", _viewData_1);
                            renderer.leave(currentEl, function () {
                                _viewData_1.$$animLeave.resolve();
                                previousEl = null;
                            });
                            previousEl = currentEl;
                            currentEl = null;
                        }
                    }
                    function updateView(config) {
                        var newScope = scope.$new();
                        var animEnter = $q.defer(), animLeave = $q.defer();
                        var $uiViewData = {
                            $cfg: config,
                            $uiView: activeUIView,
                        };
                        var $uiViewAnim = {
                            $animEnter: animEnter.promise,
                            $animLeave: animLeave.promise,
                            $$animLeave: animLeave
                        };
                        newScope.$emit('$viewContentLoading', name);
                        var cloned = $transclude(newScope, function (clone) {
                            clone.data('$uiViewAnim', $uiViewAnim);
                            clone.data('$uiView', $uiViewData);
                            renderer.enter(clone, $element, function onUIViewEnter() {
                                animEnter.resolve();
                                if (currentScope)
                                    currentScope.$emit('$viewContentAnimationEnded');
                                if (ui_router_core_1.isDefined(autoScrollExp) && !autoScrollExp || scope.$eval(autoScrollExp)) {
                                    $uiViewScroll(clone);
                                }
                            });
                            cleanupLastView();
                        });
                        currentEl = cloned;
                        currentScope = newScope;
                        currentScope.$emit('$viewContentLoaded', config || viewConfig);
                        currentScope.$eval(onloadExp);
                    }
                };
            }
        };
        return directive;
    }];
$ViewDirectiveFill.$inject = ['$compile', '$controller', '$transitions', '$view', '$q', '$timeout'];
function $ViewDirectiveFill($compile, $controller, $transitions, $view, $q, $timeout) {
    var getControllerAs = ui_router_core_1.parse('viewDecl.controllerAs');
    var getResolveAs = ui_router_core_1.parse('viewDecl.resolveAs');
    return {
        restrict: 'ECA',
        priority: -400,
        compile: function (tElement) {
            var initial = tElement.html();
            tElement.empty();
            return function (scope, $element) {
                var data = $element.data('$uiView');
                if (!data) {
                    $element.html(initial);
                    $compile($element.contents())(scope);
                    return;
                }
                var cfg = data.$cfg || { viewDecl: {}, getTemplate: angular_2.noop };
                if (!cfg.getTemplate) {
                    return;
                }
                var resolveCtx = cfg.path && new ui_router_core_1.ResolveContext(cfg.path);
                $element.html(cfg.getTemplate($element, resolveCtx) || initial);
                ui_router_core_1.trace.traceUIViewFill(data.$uiView, $element.html());
                var link = $compile($element.contents());
                var controller = cfg.controller;
                var controllerAs = getControllerAs(cfg);
                var resolveAs = getResolveAs(cfg);
                var locals = resolveCtx && services_1.getLocals(resolveCtx);
                scope[resolveAs] = locals;
                if (controller) {
                    var controllerInstance = $controller(controller, ui_router_core_1.extend({}, locals, { $scope: scope, $element: $element }));
                    if (controllerAs) {
                        scope[controllerAs] = controllerInstance;
                        scope[controllerAs][resolveAs] = locals;
                    }
                    $element.data('$ngControllerController', controllerInstance);
                    $element.children().data('$ngControllerController', controllerInstance);
                    registerControllerCallbacks($q, $transitions, controllerInstance, scope, cfg);
                }
                if (ui_router_core_1.isString(cfg.viewDecl.component)) {
                    var cmp_1 = cfg.viewDecl.component;
                    var kebobName = ui_router_core_1.kebobString(cmp_1);
                    var tagRegexp_1 = new RegExp("^(x-|data-)?" + kebobName + "$", "i");
                    var getComponentController = function () {
                        var directiveEl = [].slice.call($element[0].children)
                            .filter(function (el) { return el && el.tagName && tagRegexp_1.exec(el.tagName); });
                        return directiveEl && angular_1.ng.element(directiveEl).data("$" + cmp_1 + "Controller");
                    };
                    var deregisterWatch_1 = scope.$watch(getComponentController, function (ctrlInstance) {
                        if (!ctrlInstance)
                            return;
                        registerControllerCallbacks($q, $transitions, ctrlInstance, scope, cfg);
                        deregisterWatch_1();
                    });
                }
                link(scope);
            };
        }
    };
}
var hasComponentImpl = typeof angular_1.ng.module('ui.router')['component'] === 'function';
var _uiCanExitId = 0;
function registerControllerCallbacks($q, $transitions, controllerInstance, $scope, cfg) {
    if (ui_router_core_1.isFunction(controllerInstance.$onInit) && !(cfg.viewDecl.component && hasComponentImpl)) {
        controllerInstance.$onInit();
    }
    var viewState = ui_router_core_1.tail(cfg.path).state.self;
    var hookOptions = { bind: controllerInstance };
    if (ui_router_core_1.isFunction(controllerInstance.uiOnParamsChanged)) {
        var resolveContext = new ui_router_core_1.ResolveContext(cfg.path);
        var viewCreationTrans_1 = resolveContext.getResolvable('$transition$').data;
        var paramsUpdated = function ($transition$) {
            if ($transition$ === viewCreationTrans_1 || $transition$.exiting().indexOf(viewState) !== -1)
                return;
            var toParams = $transition$.params("to");
            var fromParams = $transition$.params("from");
            var toSchema = $transition$.treeChanges().to.map(function (node) { return node.paramSchema; }).reduce(ui_router_core_1.unnestR, []);
            var fromSchema = $transition$.treeChanges().from.map(function (node) { return node.paramSchema; }).reduce(ui_router_core_1.unnestR, []);
            var changedToParams = toSchema.filter(function (param) {
                var idx = fromSchema.indexOf(param);
                return idx === -1 || !fromSchema[idx].type.equals(toParams[param.id], fromParams[param.id]);
            });
            if (changedToParams.length) {
                var changedKeys_1 = changedToParams.map(function (x) { return x.id; });
                var newValues = ui_router_core_1.filter(toParams, function (val, key) { return changedKeys_1.indexOf(key) !== -1; });
                controllerInstance.uiOnParamsChanged(newValues, $transition$);
            }
        };
        $scope.$on('$destroy', $transitions.onSuccess({}, paramsUpdated, hookOptions));
    }
    if (ui_router_core_1.isFunction(controllerInstance.uiCanExit)) {
        var id_1 = _uiCanExitId++;
        var cacheProp_1 = '_uiCanExitIds';
        var prevTruthyAnswer_1 = function (trans) {
            return !!trans && (trans[cacheProp_1] && trans[cacheProp_1][id_1] === true || prevTruthyAnswer_1(trans.redirectedFrom()));
        };
        var wrappedHook = function (trans) {
            var promise, ids = trans[cacheProp_1] = trans[cacheProp_1] || {};
            if (!prevTruthyAnswer_1(trans)) {
                promise = $q.when(controllerInstance.uiCanExit(trans));
                promise.then(function (val) { return ids[id_1] = (val !== false); });
            }
            return promise;
        };
        var criteria = { exiting: viewState.name };
        $scope.$on('$destroy', $transitions.onBefore(criteria, wrappedHook, hookOptions));
    }
}
angular_1.ng.module('ui.router.state').directive('uiView', exports.uiView);
angular_1.ng.module('ui.router.state').directive('uiView', $ViewDirectiveFill);
//# sourceMappingURL=viewDirective.js.map