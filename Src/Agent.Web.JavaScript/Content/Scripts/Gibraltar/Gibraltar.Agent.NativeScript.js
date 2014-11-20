var gibraltar = (function (agent) {

    var logMessageSeverity = {
        none: 0,
        critical: 1,
        error: 2,
        warning: 4,
        information: 8,
        verbose: 16,
    };

    var getStackTrace = function (error, errorMessage) {
        var stackTrace = null;
        if (typeof error === 'undefined' || error === null || error.stack === null) {
            try {
                stackTrace = printStackTrace({ e: errorMessage }).reverse();
            } catch (e) {
                // deliberately swallow; some browsers don't expose the stack property on the exception
            }
        } else {
            stackTrace = error.stack.split("\n");
        }
        return stackTrace;
    }

    var getPlatform = function () {
        var clientPlatform = platform;
        clientPlatform.size = {
            width: window.innerWidth || document.body.clientWidth,
            height: window.innerHeight || document.body.clientHeight
        };
        return clientPlatform;
    }

    var log = function (severity, category, caption, description, parameters, details) {

        var logDetails = {
            Severity: severity,
            Category: category,
            Caption: caption,
            Description: description,
            Parameters: parameters,
            Details: JSON.stringify(details)
        };

        var target = targetUrl(targets.general);
        logMessage(target, logDetails);
    }


    var oldOnError = window.onerror;

    var targets = {
        base: "/Gibraltar/Log/",
        general: "Message",
        exception: "Exception"
    };

    function targetUrl(endpoint) {
        return window.location.origin + targets.base + endpoint;
    }

    function logMessage(target, errorDetails) {

        try {
            if (typeof (XMLHttpRequest) == "undefined") {
                console.log("Gibraltar Loupe JavaScript Logger: No XMLHttpRequest; error cannot be logged to Loupe");
                return false;
            }

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
            xhr.open("POST", target, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(JSON.stringify(errorDetails));

        } catch (e) {
            console.log("Gibraltar Loupe JavaScript Logger: Exception while attempting to log to " + target);
            console.dir(e);
            return false;
        }

        return true;
    }

    window.onerror = function (msg, url, line, column, error) {

        if (oldOnError) {
            oldOnError.apply(this, arguments);
        }

        var target = targetUrl(targets.exception);
        var errorDetails = {
            Category: "JavaScript",
            Message: msg,
            Url: url,
            StackTrace: gibraltar.agent.getStackTrace(error, msg),
            Cause: "",
            Line: line,
            Column: column,
            Details: JSON.stringify({ Client: gibraltar.agent.getPlatform() })
        };

        return logMessage(target, errorDetails);
    };


    return {
        agent: {
            logMessageSeverity: logMessageSeverity,
            getStackTrace: getStackTrace,
            getPlatform: getPlatform,
            log: log
        }
    };

})(this.agent = this.agent || {});