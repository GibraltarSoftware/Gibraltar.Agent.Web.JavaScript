angular.module("Gibraltar.Agent.Angular", [])
    .factory("gibraltar.logService", ["$log", "$window", "$injector", "gibraltar.stacktraceService", "gibraltar.platformService",
    function ($log, $window, $injector, stacktraceService, platformService) {
        // The error log service logs angular errors to the server
        // This is called from the existing Angular exception handler, as setup by a decorator

        var logMessageSeverity = {
            none: 0,
            critical: 1,
            error: 2,
            warning: 4,
            information: 8,
            verbose: 16,
        };
        var targets = {
            base: "/Gibraltar/Log/",
            general: "Message",
            exception: "Exception"
        };

        function targetUrl(endpoint) {
            return targets.base + endpoint;
        }

        function getRoute() {
            // get the data from standard angular route provider

            var route;
            try {
                var location = $injector.get("$location");
                route = $injector.get("$route");

                if (typeof route === "undefined" || route === null) {
                    return null;
                }

                // use of $$route is not recommended by Angular, but seems a safe bet 
                // given the current state of angular 1.x
                return {
                    controller: route.current.$$route.controller,
                    name: "",
                    url: location.absUrl(),
                    templateUrl: route.current.loadedTemplateUrl,
                    parameters: []
                }
            } catch (e) {
                return null;
            }
        }
        function getState() {
            // get the data from the ui-router state provider
            var state;
            try {
                state = $injector.get("$state");

                if (typeof state === "undefined" || state === null) {
                    return null;
                }

                return {
                    controller: state.current.controller,
                    name: state.current.name,
                    url: state.current.url,
                    templateUrl: state.current.templateUrl,
                    parameters: state.params
                }
            } catch (e) {
                return null;
            }
        }
        function getLocation() {
            var location = $injector.get("$location");
            return {
                controller: "",
                name: "",
                url: location.absUrl(),
                templateUrl: "",
                parameters: []
            }
        }
        function getRouteState() {

            var route = getRoute();

            if (route !== null) {
                return route;
            }

            var state = getState();

            if (state !== null) {
                return state;
            }

            // no route or state
            return getLocation();
        }

        function getStackTrace(exception) {
            try {
                return stacktraceService.print({ e: exception, guess: true });
            } catch (e) {
                // deliberately swallow; some browsers don't expose the stack property on the exception
                console.log(e);
            }
            return null;
        }
        function getPlatform() {
            var clientPlatform = platformService.platform;
            clientPlatform.size = {
                width: window.innerWidth || document.body.clientWidth,
                height: window.innerHeight || document.body.clientHeight
            };
            return clientPlatform;
        }


        function logMessageToServer(target, errorDetails) {
            var http = $injector.get("$http");
            http.post(target, angular.toJson(errorDetails))
                .error(function logMessageError(data, status, headers, config) {
                    $log.warn("Loupe Angular Logger: Exception while attempting to log to " + target);
                    $log.log("  status: " + status);
                    $log.log("  data: " + data);
                });
        }


        // Log the given error to the remote server.
        function logException(exception, cause) {

            // log the error to the server

            // TODO: Add debounce logic
            try {
                var routeState = getRouteState();
                var errorMessage = exception.toString();
                var stackTrace = getStackTrace(exception);

                // Log the angular error to the server.
                var data = {
                    Message: errorMessage,
                    Url: $window.location.href,
                    StackTrace: stackTrace,
                    Cause: (cause || "")
                };
                if (routeState) {
                    data.Controller = routeState.controller;
                    var clientPlatform = platform;
                    clientPlatform.size = {
                        width: window.innerWidth || document.body.clientWidth,
                        height: window.innerHeight || document.body.clientHeight
                    };

                    var details = {
                        Page: {
                            RouteName: routeState.name,
                            RouteUrl: routeState.url,
                            Controller: routeState.controller,
                            TemplateUrl: routeState.templateUrl,
                            Parameters: routeState.parameters
                        },
                        Client: clientPlatform
                    };
                    data.Details = JSON.stringify(details);
                }

                var target = targetUrl(targets.exception);
                logMessageToServer(target, data);

            } catch (loggingError) {
                // For developers - log the log-failure.
                $log.warn("Error logging failed");
                $log.log(loggingError);
            }
        }

        function logMessage(severity, category, caption, description, parameters, details) {

            var logDetails = {
                Severity: severity,
                Category: category,
                Caption: caption,
                Description: description,
                Parameters: parameters,
                Details: JSON.stringify(details)
            };

            var target = targetUrl(targets.general);
            logMessageToServer(target, logDetails);
        }


        var logService = {
            exception: logException,
            log: logMessage,
            getPlatform: getPlatform,
            getStacktrace: getStackTrace,
            logMessageSeverity: logMessageSeverity
        }
        return (logService);
    }])
    .factory("gibraltar.stacktraceService", function () {
        // The "stacktrace" library in the Scripts folder is in the Global scope; but, we don't want to reference
        // global objects inside the AngularJS components; as such, we want to wrap the
        // stacktrace feature in a proper AngularJS service that formally exposes the print method.

        // "printStackTrace" is a global object from stacktrace.js




        function createStackTrace(options) {
            var stackTraceDetails = null;

            stackTraceDetails = printStackTrace(options).reverse();

            return stripLoupeStackFrames(stackTraceDetails);
        }

        function stripLoupeStackFrames(stack) {
            // if we error is from a simple throw statement and not an error then
            // stackTrace.js will have added methods from here so we need to remove
            // them otherwise will be reported in Loupe
            if (stack) {

                var userFramesStartPosition = userFramesStartAt(stack);

                if (userFramesStartPosition > 0) {
                    // strip all loupe related frames from stack
                    stack = stack.slice(userFramesStartPosition);
                }
            }

            return stack;
        }

        function userFramesStartAt(stack) {
            var loupeMethods = ["getStackTrace", "createStackTrace", "printStackTrace"];
            var position = 0;

            var methodPosition = 0;

            for (var i = 0; i < stack.length; i++) {

                // have we, or can we, find a loupe method in the stack
                if (stack[i].indexOf(loupeMethods[methodPosition]) > -1) {
                    methodPosition++;
                   position = i;
                }
            }

            // if we found the frames we were looking for the position will be at the last
            // frame we found when in fact the user frames are the next frame on so we
            // increment the position accordingly
            if (position > 0) {
                position++;
            }

            return position;
        }

        return ({
            print: createStackTrace
        });
    })
    .factory("gibraltar.platformService", function () {
        // The "platform" library in the Scripts folder is in the Global scope; but, we don't want to reference
        // global objects inside the AngularJS components; as such, we want to wrap the
        // platform feature in a proper AngularJS service that formally exposes the print method.

        // "platform" is a global object from platform.js
        return ({
            platform: platform
        });
    })
    .config(["$provide", function ($provide) {
        // extend the error logging
        $provide.decorator("$exceptionHandler", [
            "$delegate", "gibraltar.logService", function ($delegate, loupeLogService) {
                return function (exception, cause) {
                    // Calls the original $exceptionHandler.
                    $delegate(exception, cause);

                    // Custom error handling code here.
                    loupeLogService.exception(exception, cause);
                };
            }
        ]);
    }]);