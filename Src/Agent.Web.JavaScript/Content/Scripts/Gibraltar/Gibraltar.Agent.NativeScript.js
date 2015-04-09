(function (gibraltar, window) {


    var existingOnError = window.onerror;
    var stackTrace = new StackTrace();
    var propagateError = false;

    var targets = {
        base: "/Gibraltar/Log/",
        general: "Message",
        exception: "Exception"
    };


    gibraltar.logMessageSeverity = {
        none: 0,
        critical: 1,
        error: 2,
        warning: 4,
        information: 8,
        verbose: 16
    };

    setUpOnError(window);

    gibraltar.agent = {
        log: log,
        propagateOnError: propagateError
    };

    return gibraltar.agent;


    function log(severity, category, caption, description, parameters, details) {

        var target = targetUrl(targets.general);

        setTimeout(logMessage, 10, severity, category, caption, description, parameters, details, target);
    }

    function setUpOnError(window) {
        if (typeof window.onerror === 'undefined') {
            consoleLog('Gibraltar Loupe JavaScript Logger: No onerror event; errors cannot be logged to Loupe');
            return;
        }

        window.onerror = function(msg, url, line, column, error) {

            if (existingOnError) {
                existingOnError.apply(this, arguments);
            }

            setTimeout(logError, 10, msg, url, line, column, error);

            // if we want to propagate the error the browser needs
            // us to return false but logically we want to state we
            // want to propagate i.e. true, so we reverse the bool
            // so users can set as they expect not how browser expects
            return !gibraltar.agent.propagateOnError;
        };

    }

    function getPlatform() {
        var clientPlatform = {};

        try {
            clientPlatform = platform;
        } catch (e) {
            // we were unable to get the platform object, we have to live with 
            // that so swallow the exception and continue
        }

        clientPlatform.size = {
            width: window.innerWidth || document.body.clientWidth,
            height: window.innerHeight || document.body.clientHeight
        };
        return clientPlatform;
    }

    function getStackTrace(error, errorMessage) {
        var stackTraceDetails = null;
        if (typeof error === 'undefined' || error === null || !error.stack) {
            try {
                stackTraceDetails = stackTrace({ e: errorMessage }).reverse();
            } catch (e) {
                // deliberately swallow; some browsers don't expose the stack property on the exception
            }
        } else {
            // remove trailing new line
            if (error.stack.substring(error.stack.length - 1) == "\n") {
                error.stack = error.stack.substring(0, error.stack.length - 1);
            }
            stackTraceDetails = error.stack.split("\n");
        }
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
        var loupeMethods = ["logError", "getStackTrace", "createStackTrace"];
        var position = 0;

        if (stack[0].indexOf("Cannot access caller") > -1) {
            position++;
        }

        for (; position < loupeMethods.length; position++) {

            if (stack.length < position) {
                break;
            }

            if (stack[position].indexOf(loupeMethods[position]) === -1) {
                break;
            }
        }

        return position;
    }

    function logError(msg, url, line, column, error) {
        var target = targetUrl(targets.exception);

        var errorDetails = {
            Category: "JavaScript",
            Message: msg,
            Url: url,
            StackTrace: getStackTrace(error, msg),
            Cause: "",
            Line: line,
            Column: column,
            Details: ""
        };

        errorDetails.Details = JSON.stringify({ Client: getPlatform() });

        return sendLog(target, errorDetails);
    }

    function logMessage(severity, category, caption, description, parameters, details, target) {
        var logDetails = {
            Severity: severity,
            Category: category,
            Caption: caption,
            Description: description,
            Parameters: parameters,
            Details: JSON.stringify(details)
        };

        sendLog(target, logDetails);
    }

    function targetUrl(endpoint) {
        return window.location.origin + targets.base + endpoint;
    }

    function sendLog(target, errorDetails) {
        try {
            if (typeof (XMLHttpRequest) === "undefined") {
                console.log("Gibraltar Loupe JavaScript Logger: No XMLHttpRequest; error cannot be logged to Loupe");
                return false;
            }

            consoleLog(errorDetails);

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // finished loading
                    if (xhr.status < 200 || xhr.status > 206) {
                        console.log("Loupe JavaScript Logger: Failed to log to " + target);
                        console.log("  Status: " + xhr.status + ": " + xhr.statusText);
                    }
                }
            };
            xhr.open("POST", target);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(JSON.stringify(errorDetails));

        } catch (e) {
            consoleLog("Gibraltar Loupe JavaScript Logger: Exception while attempting to log to " + target);
            console.dir(e);
            return false;
        }

        return true;
    }

    function consoleLog(msg) {
        var console = window.console;
        if (console && typeof console.log === 'function') {
            console.log(msg);
        }
    }

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

        createStackTrace.implementation = function() {
        };

        createStackTrace.implementation.prototype = {
            /**
             * @param {Error} [ex] The error to create a stacktrace from (optional)
             * @param {String} [mode] Forced mode (optional, mostly for unit tests)
             */
            run: function(ex, mode) {
                ex = ex || this.createException();
                mode = mode || this.mode(ex);
                if (mode === 'other') {
                    return this.other(arguments.callee);
                } else {
                    return this[mode](ex);
                }
            },

            createException: function() {
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
            mode: function(e) {
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
            instrumentFunction: function(context, functionName, callback) {
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
            deinstrumentFunction: function(context, functionName) {
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
            chrome: function(e) {
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
            safari: function(e) {
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
            ie: function(e) {
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
            firefox: function(e) {
                return e.stack.replace(/(?:\n@:0)?\s+$/m, '')
                    .replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@')
                    .split('\n');
            },

            opera11: function(e) {
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

            opera10b: function(e) {
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
            opera10a: function(e) {
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
            opera9: function(e) {
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
            other: function(curr) {
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
            stringifyArguments: function(args) {
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
            ajax: function(url) {
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
            createXMLHTTPObject: function() {
                var xmlhttp,
                    XMLHttpFactories = [
                        function() {
                            return new XMLHttpRequest();
                        }, function() {
                            return new ActiveXObject('Msxml2.XMLHTTP');
                        }, function() {
                            return new ActiveXObject('Msxml3.XMLHTTP');
                        }, function() {
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
            isSameDomain: function(url) {
                return typeof location !== "undefined" && url.indexOf(location.hostname) !== -1; // location may not be defined, e.g. when running from nodejs.
            },

            /**
             * Get source code from given URL if in the same domain.
             *
             * @param url {String} JS source URL
             * @return {Array} Array of source code lines
             */
            getSource: function(url) {
                // TODO reuse source from script tags?
                if (!(url in this.sourceCache)) {
                    this.sourceCache[url] = this.ajax(url).split('\n');
                }
                return this.sourceCache[url];
            },

            guessAnonymousFunctions: function(stack) {
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

            guessAnonymousFunction: function(url, lineNo, charNo) {
                var ret;
                try {
                    ret = this.findFunctionName(this.getSource(url), lineNo);
                } catch (e) {
                    ret = 'getSource failed with url: ' + url + ', exception: ' + e.toString();
                }
                return ret;
            },

            findFunctionName: function(source, lineNo) {
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

})(window.gibraltar = window.gibraltar || {}, window);

