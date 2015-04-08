(function (gibraltar, window) {


    var existingOnError = window.onerror;

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
                stackTraceDetails = printStackTrace({ e: errorMessage }).reverse();
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
        var loupeMethods = ["logError", "getStackTrace", "printStackTrace"];
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

})(window.gibraltar = window.gibraltar || {}, window);

