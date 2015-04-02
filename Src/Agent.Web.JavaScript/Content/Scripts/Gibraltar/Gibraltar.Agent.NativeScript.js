(function (gibraltar, window) {
    'use strict';


    var existingOnError = window.onerror;

    var propagateOnError = false;


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
        propagateOnError: propagateOnError
    };

    return gibraltar.agent;


    function log(severity, category, caption, description, parameters, details) {

        var target = targetUrl(targets.general);

        setTimeout(logMessage, 10, severity, category, caption, description, parameters, details, target);
    }

    function setUpOnError(window) {
        if (typeof window.onerror === 'undefined') {
            console.log('Gibraltar Loupe JavaScript Logger: No onerror event; errors cannot be logged to Loupe');
            return;
        }

        window.onerror = function (msg, url, line, column, error) {

            if (existingOnError) {
                existingOnError.apply(this, arguments);
            }

            setTimeout(logError, 10, msg, url, line, column, error);
            return !propagateOnError;
        }

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
            stackTraceDetails = error.stack.split("\n");
        }
        return stackTraceDetails;
    }

    function logError(msg, url, line, column, error) {
        var target = targetUrl(targets.exception);
        var errorDetails = {
            Category: "JavaScript",
            Message: msg,
            Url: url,
            StackTrace: "",
            Cause: "",
            Line: line,
            Column: column,
            Details: ""
        };

        errorDetails.StackTrace = getStackTrace(error, msg);
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
            if (typeof (XMLHttpRequest) == "undefined") {
                console.log("Gibraltar Loupe JavaScript Logger: No XMLHttpRequest; error cannot be logged to Loupe");
                return false;
            }

            console.log(errorDetails);

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
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
            console.log("Gibraltar Loupe JavaScript Logger: Exception while attempting to log to " + target);
            console.dir(e);
            return false;
        }

        return true;
    }

})(window.gibraltar = window.gibraltar || {}, window);

