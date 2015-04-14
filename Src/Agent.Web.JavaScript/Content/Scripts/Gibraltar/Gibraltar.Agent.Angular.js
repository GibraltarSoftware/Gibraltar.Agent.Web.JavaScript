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
    .factory("gibraltar.stacktraceService", ["$log", function ($log) {

        try {
            var stackTrace = new StackTrace();
        } catch (e) {
            $log("Unable to setup stack trace capture functionaliyt: " + e.message);
            stackTrace = null;
        }


        function printStackTrace(options) {
            if (stackTrace) {
                try {
                    var stack = stackTrace(options).reverse();

                    return stripLoupeStackFrames(stack);
                } catch (e) {
                    // deliberately swallow; some browsers don't expose the stack property on the exception
                }
            }
            return [];
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
            print: printStackTrace
        });

        // Embedded version of stackTrace.js, modified to not clash with stackTrace.js if loaded
        // Domain Public by Eric Wendelin http://www.eriwen.com/ (2008)
        //                  Luke Smith http://lucassmith.name/ (2008)
        //                  Loic Dachary <loic@dachary.org> (2008)
        //                  Johan Euphrosine <proppy@aminche.com> (2008)
        //                  Oyvind Sean Kinsey http://kinsey.no/blog (2010)
        //                  Victor Homyakov <victor-homyakov@users.sourceforge.net> (2010)

        function StackTrace() {
            /**
             * Main function giving a function stack trace with a forced or passed in Error
             *
             * @cfg {Error} e The error to create a stacktrace from (optional)
             * @cfg {Boolean} guess If we should try to resolve the names of anonymous functions
             * @return {Array} of Strings with functions, lines, files, and arguments where possible
             */
            function createStackTrace(options) {
                options = options || { guess: true };
                var ex = options.e || null, guess = !!options.guess;
                var p = new createStackTrace.implementation(), result = p.run(ex);
                return (guess) ? p.guessAnonymousFunctions(result) : result;
            }

            createStackTrace.implementation = function () {
            };

            createStackTrace.implementation.prototype = {
                /**
                 * @param {Error} [ex] The error to create a stacktrace from (optional)
                 * @param {String} [mode] Forced mode (optional, mostly for unit tests)
                 */
                run: function (ex, mode) {
                    ex = ex || this.createException();
                    mode = mode || this.mode(ex);
                    if (mode === 'other') {
                        return this.other(arguments.callee);
                    } else {
                        return this[mode](ex);
                    }
                },

                createException: function () {
                    try {
                        this.undef();
                    } catch (e) {
                        return e;
                    }
                },

                /**
                 * Mode could differ for different exception, e.g.
                 * exceptions in Chrome may or may not have arguments or stack.
                 *
                 * @return {String} mode of operation for the exception
                 */
                mode: function (e) {
                    if (e['arguments'] && e.stack) {
                        return 'chrome';
                    }

                    if (e.stack && e.sourceURL) {
                        return 'safari';
                    }

                    if (e.stack && e.number) {
                        return 'ie';
                    }

                    if (e.stack && e.fileName) {
                        return 'firefox';
                    }

                    if (e.message && e['opera#sourceloc']) {
                        // e.message.indexOf("Backtrace:") > -1 -> opera9
                        // 'opera#sourceloc' in e -> opera9, opera10a
                        // !e.stacktrace -> opera9
                        if (!e.stacktrace) {
                            return 'opera9'; // use e.message
                        }
                        if (e.message.indexOf('\n') > -1 && e.message.split('\n').length > e.stacktrace.split('\n').length) {
                            // e.message may have more stack entries than e.stacktrace
                            return 'opera9'; // use e.message
                        }
                        return 'opera10a'; // use e.stacktrace
                    }

                    if (e.message && e.stack && e.stacktrace) {
                        // e.stacktrace && e.stack -> opera10b
                        if (e.stacktrace.indexOf("called from line") < 0) {
                            return 'opera10b'; // use e.stacktrace, format differs from 'opera10a'
                        }
                        // e.stacktrace && e.stack -> opera11
                        return 'opera11'; // use e.stacktrace, format differs from 'opera10a', 'opera10b'
                    }

                    if (e.stack && !e.fileName) {
                        // Chrome 27 does not have e.arguments as earlier versions,
                        // but still does not have e.fileName as Firefox
                        return 'chrome';
                    }

                    return 'other';
                },

                /**
                 * Given a context, function name, and callback function, overwrite it so that it calls
                 * createStackTrace() first with a callback and then runs the rest of the body.
                 *
                 * @param {Object} context of execution (e.g. window)
                 * @param {String} functionName to instrument
                 * @param {Function} callback function to call with a stack trace on invocation
                 */
                instrumentFunction: function (context, functionName, callback) {
                    context = context || window;
                    var original = context[functionName];
                    context[functionName] = function instrumented() {
                        callback.call(this, createStackTrace().slice(4));
                        return context[functionName]._instrumented.apply(this, arguments);
                    };
                    context[functionName]._instrumented = original;
                },

                /**
                 * Given a context and function name of a function that has been
                 * instrumented, revert the function to it's original (non-instrumented)
                 * state.
                 *
                 * @param {Object} context of execution (e.g. window)
                 * @param {String} functionName to de-instrument
                 */
                deinstrumentFunction: function (context, functionName) {
                    if (context[functionName].constructor === Function &&
                        context[functionName]._instrumented &&
                        context[functionName]._instrumented.constructor === Function) {
                        context[functionName] = context[functionName]._instrumented;
                    }
                },

                /**
                 * Given an Error object, return a formatted Array based on Chrome's stack string.
                 *
                 * @param e - Error object to inspect
                 * @return Array<String> of function calls, files and line numbers
                 */
                chrome: function (e) {
                    return (e.stack + '\n')
                        .replace(/^[\s\S]+?\s+at\s+/, ' at ') // remove message
                        .replace(/^\s+(at eval )?at\s+/gm, '') // remove 'at' and indentation
                        .replace(/^([^\(]+?)([\n$])/gm, '{anonymous}() ($1)$2')
                        .replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}() ($1)')
                        .replace(/^(.+) \((.+)\)$/gm, '$1@$2')
                        .split('\n')
                        .slice(0, -1);
                },

                /**
                 * Given an Error object, return a formatted Array based on Safari's stack string.
                 *
                 * @param e - Error object to inspect
                 * @return Array<String> of function calls, files and line numbers
                 */
                safari: function (e) {
                    return e.stack.replace(/\[native code\]\n/m, '')
                        .replace(/^(?=\w+Error\:).*$\n/m, '')
                        .replace(/^@/gm, '{anonymous}()@')
                        .split('\n');
                },

                /**
                 * Given an Error object, return a formatted Array based on IE's stack string.
                 *
                 * @param e - Error object to inspect
                 * @return Array<String> of function calls, files and line numbers
                 */
                ie: function (e) {
                    return e.stack
                        .replace(/^\s*at\s+(.*)$/gm, '$1')
                        .replace(/^Anonymous function\s+/gm, '{anonymous}() ')
                        .replace(/^(.+)\s+\((.+)\)$/gm, '$1@$2')
                        .split('\n')
                        .slice(1);
                },

                /**
                 * Given an Error object, return a formatted Array based on Firefox's stack string.
                 *
                 * @param e - Error object to inspect
                 * @return Array<String> of function calls, files and line numbers
                 */
                firefox: function (e) {
                    return e.stack.replace(/(?:\n@:0)?\s+$/m, '')
                        .replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@')
                        .split('\n');
                },

                opera11: function (e) {
                    var ANON = '{anonymous}', lineRE = /^.*line (\d+), column (\d+)(?: in (.+))? in (\S+):$/;
                    var lines = e.stacktrace.split('\n'), result = [];

                    for (var i = 0, len = lines.length; i < len; i += 2) {
                        var match = lineRE.exec(lines[i]);
                        if (match) {
                            var location = match[4] + ':' + match[1] + ':' + match[2];
                            var fnName = match[3] || "global code";
                            fnName = fnName.replace(/<anonymous function: (\S+)>/, "$1").replace(/<anonymous function>/, ANON);
                            result.push(fnName + '@' + location + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
                        }
                    }

                    return result;
                },

                opera10b: function (e) {
                    // "<anonymous function: run>([arguments not available])@file://localhost/G:/js/stacktrace.js:27\n" +
                    // "createStackTrace([arguments not available])@file://localhost/G:/js/stacktrace.js:18\n" +
                    // "@file://localhost/G:/js/test/functional/testcase1.html:15"
                    var lineRE = /^(.*)@(.+):(\d+)$/;
                    var lines = e.stacktrace.split('\n'), result = [];

                    for (var i = 0, len = lines.length; i < len; i++) {
                        var match = lineRE.exec(lines[i]);
                        if (match) {
                            var fnName = match[1] ? (match[1] + '()') : "global code";
                            result.push(fnName + '@' + match[2] + ':' + match[3]);
                        }
                    }

                    return result;
                },

                /**
                 * Given an Error object, return a formatted Array based on Opera 10's stacktrace string.
                 *
                 * @param e - Error object to inspect
                 * @return Array<String> of function calls, files and line numbers
                 */
                opera10a: function (e) {
                    // "  Line 27 of linked script file://localhost/G:/js/stacktrace.js\n"
                    // "  Line 11 of inline#1 script in file://localhost/G:/js/test/functional/testcase1.html: In function foo\n"
                    var ANON = '{anonymous}', lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
                    var lines = e.stacktrace.split('\n'), result = [];

                    for (var i = 0, len = lines.length; i < len; i += 2) {
                        var match = lineRE.exec(lines[i]);
                        if (match) {
                            var fnName = match[3] || ANON;
                            result.push(fnName + '()@' + match[2] + ':' + match[1] + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
                        }
                    }

                    return result;
                },

                // Opera 7.x-9.2x only!
                opera9: function (e) {
                    // "  Line 43 of linked script file://localhost/G:/js/stacktrace.js\n"
                    // "  Line 7 of inline#1 script in file://localhost/G:/js/test/functional/testcase1.html\n"
                    var ANON = '{anonymous}', lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
                    var lines = e.message.split('\n'), result = [];

                    for (var i = 2, len = lines.length; i < len; i += 2) {
                        var match = lineRE.exec(lines[i]);
                        if (match) {
                            result.push(ANON + '()@' + match[2] + ':' + match[1] + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
                        }
                    }

                    return result;
                },

                // Safari 5-, IE 9-, and others
                other: function (curr) {
                    var ANON = '{anonymous}', fnRE = /function(?:\s+([\w$]+))?\s*\(/, stack = [], fn, args, maxStackSize = 10;
                    var slice = Array.prototype.slice;
                    while (curr && stack.length < maxStackSize) {
                        fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
                        try {
                            args = slice.call(curr['arguments'] || []);
                        } catch (e) {
                            args = ['Cannot access arguments: ' + e];
                        }
                        stack[stack.length] = fn + '(' + this.stringifyArguments(args) + ')';
                        try {
                            curr = curr.caller;
                        } catch (e) {
                            stack[stack.length] = 'Cannot access caller: ' + e;
                            break;
                        }
                    }
                    return stack;
                },

                /**
                 * Given arguments array as a String, substituting type names for non-string types.
                 *
                 * @param {Arguments,Array} args
                 * @return {String} stringified arguments
                 */
                stringifyArguments: function (args) {
                    var result = [];
                    var slice = Array.prototype.slice;
                    for (var i = 0; i < args.length; ++i) {
                        var arg = args[i];
                        if (arg === undefined) {
                            result[i] = 'undefined';
                        } else if (arg === null) {
                            result[i] = 'null';
                        } else if (arg.constructor) {
                            // TODO constructor comparison does not work for iframes
                            if (arg.constructor === Array) {
                                if (arg.length < 3) {
                                    result[i] = '[' + this.stringifyArguments(arg) + ']';
                                } else {
                                    result[i] = '[' + this.stringifyArguments(slice.call(arg, 0, 1)) + '...' + this.stringifyArguments(slice.call(arg, -1)) + ']';
                                }
                            } else if (arg.constructor === Object) {
                                result[i] = '#object';
                            } else if (arg.constructor === Function) {
                                result[i] = '#function';
                            } else if (arg.constructor === String) {
                                result[i] = '"' + arg + '"';
                            } else if (arg.constructor === Number) {
                                result[i] = arg;
                            } else {
                                result[i] = '?';
                            }
                        }
                    }
                    return result.join(',');
                },

                sourceCache: {},

                /**
                 * @return {String} the text from a given URL
                 */
                ajax: function (url) {
                    var req = this.createXMLHTTPObject();
                    if (req) {
                        try {
                            req.open('GET', url, false);
                            //req.overrideMimeType('text/plain');
                            //req.overrideMimeType('text/javascript');
                            req.send(null);
                            //return req.status == 200 ? req.responseText : '';
                            return req.responseText;
                        } catch (e) {
                        }
                    }
                    return '';
                },

                /**
                 * Try XHR methods in order and store XHR factory.
                 *
                 * @return {XMLHttpRequest} XHR function or equivalent
                 */
                createXMLHTTPObject: function () {
                    var xmlhttp,
                        XMLHttpFactories = [
                            function () {
                                return new XMLHttpRequest();
                            }, function () {
                                return new ActiveXObject('Msxml2.XMLHTTP');
                            }, function () {
                                return new ActiveXObject('Msxml3.XMLHTTP');
                            }, function () {
                                return new ActiveXObject('Microsoft.XMLHTTP');
                            }
                        ];
                    for (var i = 0; i < XMLHttpFactories.length; i++) {
                        try {
                            xmlhttp = XMLHttpFactories[i]();
                            // Use memoization to cache the factory
                            this.createXMLHTTPObject = XMLHttpFactories[i];
                            return xmlhttp;
                        } catch (e) {
                        }
                    }
                },

                /**
                 * Given a URL, check if it is in the same domain (so we can get the source
                 * via Ajax).
                 *
                 * @param url {String} source url
                 * @return {Boolean} False if we need a cross-domain request
                 */
                isSameDomain: function (url) {
                    return typeof location !== "undefined" && url.indexOf(location.hostname) !== -1; // location may not be defined, e.g. when running from nodejs.
                },

                /**
                 * Get source code from given URL if in the same domain.
                 *
                 * @param url {String} JS source URL
                 * @return {Array} Array of source code lines
                 */
                getSource: function (url) {
                    // TODO reuse source from script tags?
                    if (!(url in this.sourceCache)) {
                        this.sourceCache[url] = this.ajax(url).split('\n');
                    }
                    return this.sourceCache[url];
                },

                guessAnonymousFunctions: function (stack) {
                    for (var i = 0; i < stack.length; ++i) {
                        var reStack = /\{anonymous\}\(.*\)@(.*)/,
                            reRef = /^(.*?)(?::(\d+))(?::(\d+))?(?: -- .+)?$/,
                            frame = stack[i],
                            ref = reStack.exec(frame);

                        if (ref) {
                            var m = reRef.exec(ref[1]);
                            if (m) { // If falsey, we did not get any file/line information
                                var file = m[1], lineno = m[2], charno = m[3] || 0;
                                if (file && this.isSameDomain(file) && lineno) {
                                    var functionName = this.guessAnonymousFunction(file, lineno, charno);
                                    stack[i] = frame.replace('{anonymous}', functionName);
                                }
                            }
                        }
                    }
                    return stack;
                },

                guessAnonymousFunction: function (url, lineNo, charNo) {
                    var ret;
                    try {
                        ret = this.findFunctionName(this.getSource(url), lineNo);
                    } catch (e) {
                        ret = 'getSource failed with url: ' + url + ', exception: ' + e.toString();
                    }
                    return ret;
                },

                findFunctionName: function (source, lineNo) {
                    // FIXME findFunctionName fails for compressed source
                    // (more than one function on the same line)
                    // function {name}({args}) m[1]=name m[2]=args
                    var reFunctionDeclaration = /function\s+([^(]*?)\s*\(([^)]*)\)/;
                    // {name} = function ({args}) TODO args capture
                    // /['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*function(?:[^(]*)/
                    var reFunctionExpression = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;
                    // {name} = eval()
                    var reFunctionEvaluation = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;
                    // Walk backwards in the source lines until we find
                    // the line which matches one of the patterns above
                    var code = "", line, maxLines = Math.min(lineNo, 20), m, commentPos;
                    for (var i = 0; i < maxLines; ++i) {
                        // lineNo is 1-based, source[] is 0-based
                        line = source[lineNo - i - 1];
                        commentPos = line.indexOf('//');
                        if (commentPos >= 0) {
                            line = line.substr(0, commentPos);
                        }
                        // TODO check other types of comments? Commented code may lead to false positive
                        if (line) {
                            code = line + code;
                            m = reFunctionExpression.exec(code);
                            if (m && m[1]) {
                                return m[1];
                            }
                            m = reFunctionDeclaration.exec(code);
                            if (m && m[1]) {
                                //return m[1] + "(" + (m[2] || "") + ")";
                                return m[1];
                            }
                            m = reFunctionEvaluation.exec(code);
                            if (m && m[1]) {
                                return m[1];
                            }
                        }
                    }
                    return '(?)';
                }
            };

            return createStackTrace;
        }
    }])
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