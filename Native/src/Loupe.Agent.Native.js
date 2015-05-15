(function (window) {

    var existingOnError = window.onerror;
    var stackTrace;
    var clientPlatform;
    var propagateError = false;
    var sequenceNumber = 0;
    var sessionId;
    var agentSessionId;
    var messageStorage = [];
    var storageAvailable = storageSupported();
    
    var logMessageSeverity = {
        none: 0,
        critical: 1,
        error: 2,
        warning: 4,
        information: 8,
        verbose: 16
    };

    createHelpers();
    setUpOnError(window);
    setUpClientSessionId();
    setUpSequenceNumber();
    addSendMessageCommandToEventQueue();

    // set up partial method calls for the convience methods
    var verbose = partial(write, logMessageSeverity.verbose);
    var information = partial(write, logMessageSeverity.information);
    var warning = partial(write, logMessageSeverity.warning);
    var error = partial(write, logMessageSeverity.error);
    var critical = partial(write, logMessageSeverity.critical);

    // specify the functionality exposed via the loupe object
    // from window
    window.loupe = {
        verbose: verbose,
        information: information,
        warning: warning,
        error: error,
        critical: critical,
        write: write,
        setSessionId: setSessionId,
        propagateOnError: propagateError,
        logMessageSeverity: logMessageSeverity,
        clientSessionHeader: clientSessionHeader
    };


    function addSendMessageCommandToEventQueue(){
        // check for unsent messages on start up
        if(storageAvailable && localStorage.length || messageStorage.length){
            setTimeout(logMessageToServer,10);
        }        
    }

    function setSessionId(value){
        sessionId = value;
    }

    function partial(fn /*, args...*/) {
      // A reference to the Array#slice method.
      var slice = Array.prototype.slice;
      // Convert arguments object to an array, removing the first argument.
      var args = slice.call(arguments, 1);
    
      return function() {
        // Invoke the originally-specified function, passing in all originally-
        // specified arguments, followed by any just-specified arguments.
        return fn.apply(this, args.concat(slice.call(arguments, 0)));
      };
    }

    function sanitiseArgument(parameter){
        if (typeof parameter == 'undefined'){
            return null;
        }
        
        return  parameter;
    }

    function write(severity, category, caption, description, parameters, exception, details, methodSourceInfo) {        
        exception = sanitiseArgument(exception);
        details = sanitiseArgument(details);
        methodSourceInfo = sanitiseArgument(methodSourceInfo);
        
        createMessage(severity,category, caption, description, parameters, exception, details, methodSourceInfo);
        
        addSendMessageCommandToEventQueue();
    }

    function createHelpers() {
        try {
            clientPlatform = new ClientPlatform();
        } catch (e) {
            // if an exception occurs whilst tryng to get
            // platform information then we can't do much
            // so log exception to console and move on
            consoleLog("Unable to get platform info: " + e.message);
            clientPlatform = {};
        }

        try {
            stackTrace =new StackTrace();
        } catch (e) {
            consoleLog("Unable to setup stack trace capture functionaliyt: " + e.message);
            stackTrace = null;
        } 

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
            return !loupe.propagateOnError;
        };

    }

    function getPlatform() {
        var platformDetails = clientPlatform;

        platformDetails.size = {
            width: window.innerWidth || document.body.clientWidth,
            height: window.innerHeight || document.body.clientHeight
        };
        return platformDetails;
    }

    function getStackTrace(error, errorMessage) {
        if (typeof error === 'undefined' || error === null || !error.stack) {
            return createStackFromMessage(errorMessage);
        }

        return createStackFromError(error);
    }

    function createStackFromMessage(errorMessage) {
        if (stackTrace) {
            try {
                var stack = stackTrace({ e: errorMessage }).reverse();

                return stripLoupeStackFrames(stack);
            } catch (e) {
                // deliberately swallow; some browsers don't expose the stack property on the exception
            }
        }
        return [];
    }

    function createStackFromError(error) {
        // remove trailing new line
        if (error.stack.substring(error.stack.length - 1) === "\n") {
            error.stack = error.stack.substring(0, error.stack.length - 1);
        }

        return error.stack.split("\n");
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
        var loupeMethods = ["logError", "getStackTrace", "createStackFromMessage", "createStackTrace"];
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

        var errorName = "";

        if(error){
            errorName = error.name || "Exception";    
        }
       
        var exception = {
            message: msg,
            url: url,
            stackTrace: getStackTrace(error, msg),
            cause: errorName,
            line: line,
            column: column            
        };
        
        createMessage(loupe.logMessageSeverity.error,"JavaScript",errorName,"",null,exception,null,null);

        return logMessageToServer();
    }

    function storageSupported() {
        var testValue="_loupe_storage_test_";
        try {
          localStorage.setItem(testValue, testValue);
          localStorage.removeItem(testValue);
          return true;
        } catch (e) {
          return false;
        }
    }

    function clientSessionHeader(){
        return {
            'headerName': 'loupe-client-session',
            'headerValue': agentSessionId
        };
    }

    function setUpClientSessionId(){
        var currentClientSessionId = getClientSessionHeader();
        if(currentClientSessionId){
            agentSessionId = currentClientSessionId;
        } else{
            agentSessionId = generateUUID();
            storeClientSessionId(agentSessionId);
        }
    }

    function storeClientSessionId(sessionIdToStore){
        if(storageAvailable){
            try{
                sessionStorage.setItem("LoupeClientSessionId", sessionIdToStore)
            } catch(e){
                consoleLog("Unable to store clientSessionId in session storage. " + e.message);
            }
        }
    }

    function getClientSessionHeader(){
        try {
            var clientSessionId = sessionStorage.getItem("LoupeClientSessionId");
            if(clientSessionId){
                return clientSessionId;
            } 
        } catch (e) {
            consoleLog("Unable to retrieve clientSessionId number from session storage. " + e.message);
        }
        
        return null;      
    }

    function setUpSequenceNumber(){
        var sequence = getSequenceNumber();
        
        if(sequence === -1 && storageAvailable){
            // unable to get a sequence number
            sequenceNumber = 0;
        } else {
            sequenceNumber = sequence;
        }
    }

    function getNextSequenceNumber(){
        var storedSequenceNumber;
        
        if(storageAvailable){
            // try and get sequence number from session storage
            storedSequenceNumber = getSequenceNumber();
            
            if(storedSequenceNumber < sequenceNumber){
                // seems we must have had a problem storing a number
                // previously, so replace value we just read with
                // the one we are holding in memory
                storedSequenceNumber = sequenceNumber;
            }
            
            // if we've got the sequence number increment it and store it
            if(storedSequenceNumber != -1){
                storedSequenceNumber++;
                if(setSequenceNumber(storedSequenceNumber)){
                    sequenceNumber = storedSequenceNumber;
                    return sequenceNumber;
                }
            }
        }
        
        sequenceNumber++;        
        return sequenceNumber;
    }

    function getSequenceNumber(){
        if(storageAvailable){
            try {
                var currentNumber = sessionStorage.getItem("LoupeSequenceNumber");
                if(currentNumber){
                    return parseInt(currentNumber);
                } else {
                    return 0;
                }
            } catch (e) {
                consoleLog("Unable to retrieve sequence number from session storage. " + e.message);
            } 
        }
        // we return -1 to indicate cannot get sequence number
        // or that sessionStorage isn't available
        return -1;
    }

    function setSequenceNumber(sequenceNumber){
        try {
            sessionStorage.setItem("LoupeSequenceNumber", sequenceNumber);
            return true;
        } catch (e){
            consoleLog("Unable to store sequence number: " + e.message);
            return false;
        }
    }

    function createMessage(severity, category, caption, description, parameters, exception, details, methodSourceInfo){
        var messageSequenceNumber = getNextSequenceNumber();
        
        var timeStamp = createTimeStamp();
        
        if(exception){
            exception = createExceptionFromError(exception);
        }
        
        var message = {
          severity: severity,
          category: category,
          caption: caption,
          description: description,
          parameters: parameters,
          details: details,
          exception: exception,
          methodSourceInfo: methodSourceInfo,
          timeStamp: timeStamp,
          sequence: messageSequenceNumber,
          agentSessionId: agentSessionId,
          sessionId: sessionId
        };
        
        storeMessage(message);
    }

    function storeMessage(message){
        if(storageAvailable) {
            try{
                localStorage.setItem("Loupe-message-" + generateUUID() ,JSON.stringify(message));
            } catch (e){
                consoleLog("Error occured trying to add item to localStorageL " + e.message);
                messageStorage.push(message);
            }
        } else {
            messageStorage.push(message);
        }            
    }

    function createExceptionFromError(error, cause){
        
        // if error has simply been passed through as a string
        // log the best we could
        if(typeof error == "string"){
            return {
                message: error,
                url: window.location.href,
                stackTrace: [],
                cause: cause || "",
                line: null,
                column: null                        
            }; 
        }
        
        // if the object has an Url property
        // its one of our exception objects so just
        // return it
        if("url" in error){
            return error;
        }
        
        return {
                message: error.message,
                url: window.location.href,
                stackTrace: error.stackTrace,
                cause: cause || "",
                line: error.lineNumber || null,
                column: error.columnNumber || null,                        
            };            
    }

    function createTimeStamp() {
        var now = new Date(),
            tzo = -now.getTimezoneOffset(),
            dif = tzo >= 0 ? '+' : '-',
            pad = function(num) {
                var norm = Math.abs(Math.floor(num));
                return (norm < 10 ? '0' : '') + norm;
            };
            
        return now.getFullYear() 
            + '-' + pad(now.getMonth()+1)
            + '-' + pad(now.getDate())
            + 'T' + pad(now.getHours())
            + ':' + pad(now.getMinutes()) 
            + ':' + pad(now.getSeconds()) 
            + '.' + pad(now.getMilliseconds())
            + dif + pad(tzo / 60) 
            + ':' + pad(tzo % 60);
    } 

    function generateUUID() {
        var d = Date.now();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    function getMessagesToSend(){
        var messages=[];
        var keys =[];
        
        if(messageStorage.length){
            messages = messageStorage.slice();
            messageStorage.length = 0;
        } 
        
        if(storageAvailable){
            // look for messages in localStorage and add to messages array
    		for(var i=0; i < localStorage.length; i++){
    			if(localStorage.key(i).indexOf('Loupe-message-') > -1){
                    keys.push(localStorage.key(i));
    				messages.push(JSON.parse(localStorage.getItem(localStorage.key(i))));	
    			}
    		}
            // sort the messages by their sequence
            if(messages.length && messages.length > 1){
                messages.sort(function(a,b){return a.sequence - b.sequence;});
            }
        }
        
        return [messages, keys];
    }

    function removeMessagesFromStorage(keys){
        for(var i=0; i < keys.length; i++){
          try {
              localStorage.removeItem(keys[i]);	
          } catch (e) {
              consoleLog("Unable to remove message from localStorage: " + e.message);
          }
        }        
    }

    function logMessageToServer() {
        var messageDetails = getMessagesToSend();        
        var messages = messageDetails[0];
        var keys = messageDetails[1];
        
        if(messages.length) {
            var logMessage = {
                session: {
                   client: getPlatform()
                },
                logMessages: messages
            };
             
            sendMessageToServer(logMessage, keys);            
        }
    }

    function sendMessageToServer(logMessage, keys){
        try {
            
            var xhr = createCORSRequest(window.location.origin + '/loupe/log')
            if(!xhr){
                consolelog("Loupe JavaScript Logger: No XMLHttpRequest; error cannot be logged to Loupe");
                return false;                
            }            
            
            consoleLog(logMessage);
                        
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // finished loading
                    if (xhr.status < 200 || xhr.status > 206) {
                        console.log("Loupe JavaScript Logger: Failed to log to " + window.location.origin + '/loupe/log');
                        console.log("  Status: " + xhr.status + ": " + xhr.statusText);
                    }
                    
                    // if the call was sucessful and we have keys to items in storage
                    // now we remove them
                    if(xhr.status >= 200 && xhr.status <= 204 && keys.length){
                        removeMessagesFromStorage(keys);
                    }
                }
            };

            xhr.send(JSON.stringify(logMessage));

        } catch (e) {
            consoleLog("Loupe JavaScript Logger: Exception while attempting to log");
            return false;
        }
        
    }

    function createCORSRequest(url) {
        
        if (typeof (XMLHttpRequest) === "undefined"){
            return null;
        }
        
      var xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr) {
    
        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json");
        
      } else if (typeof XDomainRequest != "undefined") {
    
        // Otherwise, check if XDomainRequest.
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest();
        xhr.contentType = "application/json";
        xhr.open("POST", url);
    
      } else {
    
        // Otherwise, CORS is not supported by the browser.
        xhr = null;
    
      }
      return xhr;
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


    /*
     * This is an altered version of Platform.js changed specifically to work
     * inside the agent so for example the assigning to global (window) has
     * been removed as well as immediate execution of the funtion
     * 
     * Platform.js v1.2.0 <http://mths.be/platform>
     * Copyright 2010-2014 John-David Dalton <http://allyoucanleet.com/>
     * Available under MIT license <http://mths.be/mit>
     */
    function ClientPlatform () {
        'use strict';

        /** Used to determine if values are of the language type `Object` */
        var objectTypes = {
            'function': true,
            'object': true
        };

        /** Used as a reference to the global object */
        var root = (objectTypes[typeof window] && window) || this;

        /** Backup possible global object */
        var oldRoot = root;

        /**
         * Used as the maximum length of an array-like object.
         * See the [ES6 spec](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
         * for more details.
         */
        var maxSafeInteger = Math.pow(2, 53) - 1;

        /** Opera regexp */
        var reOpera = /Opera/;

        /** Possible global object */
        var thisBinding = this;

        /** Used for native method references */
        var objectProto = Object.prototype;

        /** Used to check for own properties of an object */
        var hasOwnProperty = objectProto.hasOwnProperty;

        /** Used to resolve the internal `[[Class]]` of values */
        var toString = objectProto.toString;


        return parse();

        /*--------------------------------------------------------------------------*/

        /**
         * Capitalizes a string value.
         *
         * @private
         * @param {string} string The string to capitalize.
         * @returns {string} The capitalized string.
         */
        function capitalize(string) {
            string = String(string);
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        /**
         * An iteration utility for arrays and objects.
         *
         * @private
         * @param {Array|Object} object The object to iterate over.
         * @param {Function} callback The function called per iteration.
         */
        function each(object, callback) {
            var index = -1,
                length = object ? object.length : 0;

            if (typeof length == 'number' && length > -1 && length <= maxSafeInteger) {
                while (++index < length) {
                    callback(object[index], index, object);
                }
            } else {
                forOwn(object, callback);
            }
        }

        /**
         * Trim and conditionally capitalize string values.
         *
         * @private
         * @param {string} string The string to format.
         * @returns {string} The formatted string.
         */
        function format(string) {
            string = trim(string);
            return /^(?:webOS|i(?:OS|P))/.test(string)
              ? string
              : capitalize(string);
        }

        /**
         * Iterates over an object's own properties, executing the `callback` for each.
         *
         * @private
         * @param {Object} object The object to iterate over.
         * @param {Function} callback The function executed per own property.
         */
        function forOwn(object, callback) {
            for (var key in object) {
                if (hasOwnProperty.call(object, key)) {
                    callback(object[key], key, object);
                }
            }
        }

        /**
         * Gets the internal `[[Class]]` of a value.
         *
         * @private
         * @param {*} value The value.
         * @returns {string} The `[[Class]]`.
         */
        function getClassOf(value) {
            return value == null
              ? capitalize(value)
              : toString.call(value).slice(8, -1);
        }

        /**
         * Host objects can return type values that are different from their actual
         * data type. The objects we are concerned with usually return non-primitive
         * types of "object", "function", or "unknown".
         *
         * @private
         * @param {*} object The owner of the property.
         * @param {string} property The property to check.
         * @returns {boolean} Returns `true` if the property value is a non-primitive, else `false`.
         */
        function isHostType(object, property) {
            var type = object != null ? typeof object[property] : 'number';
            return !/^(?:boolean|number|string|undefined)$/.test(type) &&
              (type == 'object' ? !!object[property] : true);
        }

        /**
         * Prepares a string for use in a `RegExp` by making hyphens and spaces optional.
         *
         * @private
         * @param {string} string The string to qualify.
         * @returns {string} The qualified string.
         */
        function qualify(string) {
            return String(string).replace(/([ -])(?!$)/g, '$1?');
        }

        /**
         * A bare-bones `Array#reduce` like utility function.
         *
         * @private
         * @param {Array} array The array to iterate over.
         * @param {Function} callback The function called per iteration.
         * @returns {*} The accumulated result.
         */
        function reduce(array, callback) {
            var accumulator = null;
            each(array, function (value, index) {
                accumulator = callback(accumulator, value, index, array);
            });
            return accumulator;
        }

        /**
         * Removes leading and trailing whitespace from a string.
         *
         * @private
         * @param {string} string The string to trim.
         * @returns {string} The trimmed string.
         */
        function trim(string) {
            return String(string).replace(/^ +| +$/g, '');
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a new platform object.
         *
         * @memberOf platform
         * @param {Object|string} [ua=navigator.userAgent] The user agent string or
         *  context object.
         * @returns {Object} A platform object.
         */
        function parse(ua) {

            /** The environment context object */
            var context = root;

            /** Used to flag when a custom context is provided */
            var isCustomContext = ua && typeof ua == 'object' && getClassOf(ua) != 'String';

            // juggle arguments
            if (isCustomContext) {
                context = ua;
                ua = null;
            }

            /** Browser navigator object */
            var nav = context.navigator || {};

            /** Browser user agent string */
            var userAgent = nav.userAgent || '';

            ua || (ua = userAgent);

            /** Used to flag when `thisBinding` is the [ModuleScope] */
            var isModuleScope = isCustomContext || thisBinding == oldRoot;

            /** Used to detect if browser is like Chrome */
            var likeChrome = isCustomContext
              ? !!nav.likeChrome
              : /\bChrome\b/.test(ua) && !/internal|\n/i.test(toString.toString());

            /** Internal `[[Class]]` value shortcuts */
            var objectClass = 'Object',
                airRuntimeClass = isCustomContext ? objectClass : 'ScriptBridgingProxyObject',
                enviroClass = isCustomContext ? objectClass : 'Environment',
                javaClass = (isCustomContext && context.java) ? 'JavaPackage' : getClassOf(context.java),
                phantomClass = isCustomContext ? objectClass : 'RuntimeObject';

            /** Detect Java environment */
            var java = /Java/.test(javaClass) && context.java;

            /** Detect Rhino */
            var rhino = java && getClassOf(context.environment) == enviroClass;

            /** A character to represent alpha */
            var alpha = java ? 'a' : '\u03b1';

            /** A character to represent beta */
            var beta = java ? 'b' : '\u03b2';

            /** Browser document object */
            var doc = context.document || {};

            /**
             * Detect Opera browser (Presto-based)
             * http://www.howtocreate.co.uk/operaStuff/operaObject.html
             * http://dev.opera.com/articles/view/opera-mini-web-content-authoring-guidelines/#operamini
             */
            var opera = context.operamini || context.opera;

            /** Opera `[[Class]]` */
            var operaClass = reOpera.test(operaClass = (isCustomContext && opera) ? opera['[[Class]]'] : getClassOf(opera))
              ? operaClass
              : (opera = null);

            /*------------------------------------------------------------------------*/

            /** Temporary variable used over the script's lifetime */
            var data;

            /** The CPU architecture */
            var arch = ua;

            /** Platform description array */
            var description = [];

            /** Platform alpha/beta indicator */
            var prerelease = null;

            /** A flag to indicate that environment features should be used to resolve the platform */
            var useFeatures = ua == userAgent;

            /** The browser/environment version */
            var version = useFeatures && opera && typeof opera.version == 'function' && opera.version();

            /** A flag to indicate if the OS is Windows 7 */
            var isWindows7;

            /* Detectable layout engines (order is important) */
            var layout = getLayout([
              { 'label': 'WebKit', 'pattern': 'AppleWebKit' },
              'iCab',
              'Presto',
              'NetFront',
              'Tasman',
              'Trident',
              'KHTML',
              'Gecko'
            ]);

            /* Detectable browser names (order is important) */
            var name = getName([
              'Adobe AIR',
              'Arora',
              'Avant Browser',
              'Camino',
              'Epiphany',
              'Fennec',
              'Flock',
              'Galeon',
              'GreenBrowser',
              'iCab',
              'Iceweasel',
              { 'label': 'SRWare Iron', 'pattern': 'Iron' },
              'K-Meleon',
              'Konqueror',
              'Lunascape',
              'Maxthon',
              'Midori',
              'Nook Browser',
              'PhantomJS',
              'Raven',
              'Rekonq',
              'RockMelt',
              'SeaMonkey',
              { 'label': 'Silk', 'pattern': '(?:Cloud9|Silk-Accelerated)' },
              'Sleipnir',
              'SlimBrowser',
              'Sunrise',
              'Swiftfox',
              'WebPositive',
              'Opera Mini',
              'Opera',
              { 'label': 'Opera', 'pattern': 'OPR' },
              'Chrome',
              { 'label': 'Chrome Mobile', 'pattern': '(?:CriOS|CrMo)' },
              { 'label': 'Firefox', 'pattern': '(?:Firefox|Minefield)' },
              { 'label': 'IE', 'pattern': 'MSIE' },
              'Safari'
            ]);

            /* Detectable products (order is important) */
            var product = getProduct([
              { 'label': 'BlackBerry', 'pattern': 'BB10' },
              'BlackBerry',
              { 'label': 'Galaxy S', 'pattern': 'GT-I9000' },
              { 'label': 'Galaxy S2', 'pattern': 'GT-I9100' },
              { 'label': 'Galaxy S3', 'pattern': 'GT-I9300' },
              { 'label': 'Galaxy S4', 'pattern': 'GT-I9500' },
              'Google TV',
              'iPad',
              'iPod',
              'iPhone',
              'Kindle',
              { 'label': 'Kindle Fire', 'pattern': '(?:Cloud9|Silk-Accelerated)' },
              'Nook',
              'PlayBook',
              'PlayStation 4',
              'PlayStation 3',
              'PlayStation Vita',
              'TouchPad',
              'Transformer',
              { 'label': 'Wii U', 'pattern': 'WiiU' },
              'Wii',
              'Xbox One',
              { 'label': 'Xbox 360', 'pattern': 'Xbox' },
              'Xoom'
            ]);

            /* Detectable manufacturers */
            var manufacturer = getManufacturer({
                'Apple': { 'iPad': 1, 'iPhone': 1, 'iPod': 1 },
                'Amazon': { 'Kindle': 1, 'Kindle Fire': 1 },
                'Asus': { 'Transformer': 1 },
                'Barnes & Noble': { 'Nook': 1 },
                'BlackBerry': { 'PlayBook': 1 },
                'Google': { 'Google TV': 1 },
                'HP': { 'TouchPad': 1 },
                'HTC': {},
                'LG': {},
                'Microsoft': { 'Xbox': 1, 'Xbox One': 1 },
                'Motorola': { 'Xoom': 1 },
                'Nintendo': { 'Wii U': 1, 'Wii': 1 },
                'Nokia': {},
                'Samsung': { 'Galaxy S': 1, 'Galaxy S2': 1, 'Galaxy S3': 1, 'Galaxy S4': 1 },
                'Sony': { 'PlayStation 4': 1, 'PlayStation 3': 1, 'PlayStation Vita': 1 }
            });

            /* Detectable OSes (order is important) */
            var os = getOS([
              'Android',
              'CentOS',
              'Debian',
              'Fedora',
              'FreeBSD',
              'Gentoo',
              'Haiku',
              'Kubuntu',
              'Linux Mint',
              'Red Hat',
              'SuSE',
              'Ubuntu',
              'Xubuntu',
              'Cygwin',
              'Symbian OS',
              'hpwOS',
              'webOS ',
              'webOS',
              'Tablet OS',
              'Linux',
              'Mac OS X',
              'Macintosh',
              'Mac',
              'Windows 98;',
              'Windows '
            ]);

            /*------------------------------------------------------------------------*/

            /**
             * Picks the layout engine from an array of guesses.
             *
             * @private
             * @param {Array} guesses An array of guesses.
             * @returns {null|string} The detected layout engine.
             */
            function getLayout(guesses) {
                return reduce(guesses, function (result, guess) {
                    return result || RegExp('\\b' + (
                      guess.pattern || qualify(guess)
                    ) + '\\b', 'i').exec(ua) && (guess.label || guess);
                });
            }

            /**
             * Picks the manufacturer from an array of guesses.
             *
             * @private
             * @param {Array} guesses An object of guesses.
             * @returns {null|string} The detected manufacturer.
             */
            function getManufacturer(guesses) {
                return reduce(guesses, function (result, value, key) {
                    // lookup the manufacturer by product or scan the UA for the manufacturer
                    return result || (
                      value[product] ||
                      value[0/*Opera 9.25 fix*/, /^[a-z]+(?: +[a-z]+\b)*/i.exec(product)] ||
                      RegExp('\\b' + qualify(key) + '(?:\\b|\\w*\\d)', 'i').exec(ua)
                    ) && key;
                });
            }

            /**
             * Picks the browser name from an array of guesses.
             *
             * @private
             * @param {Array} guesses An array of guesses.
             * @returns {null|string} The detected browser name.
             */
            function getName(guesses) {
                return reduce(guesses, function (result, guess) {
                    return result || RegExp('\\b' + (
                      guess.pattern || qualify(guess)
                    ) + '\\b', 'i').exec(ua) && (guess.label || guess);
                });
            }

            /**
             * Picks the OS name from an array of guesses.
             *
             * @private
             * @param {Array} guesses An array of guesses.
             * @returns {null|string} The detected OS name.
             */
            function getOS(guesses) {
                return reduce(guesses, function (result, guess) {
                    var pattern = guess.pattern || qualify(guess);
                    if (!result && (result =
                          RegExp('\\b' + pattern + '(?:/[\\d.]+|[ \\w.]*)', 'i').exec(ua)
                        )) {
                        // platform tokens defined at
                        // http://msdn.microsoft.com/en-us/library/ms537503(VS.85).aspx
                        // http://web.archive.org/web/20081122053950/http://msdn.microsoft.com/en-us/library/ms537503(VS.85).aspx
                        data = {
                            '6.3': '8.1',
                            '6.2': '8',
                            '6.1': 'Server 2008 R2 / 7',
                            '6.0': 'Server 2008 / Vista',
                            '5.2': 'Server 2003 / XP 64-bit',
                            '5.1': 'XP',
                            '5.01': '2000 SP1',
                            '5.0': '2000',
                            '4.0': 'NT',
                            '4.90': 'ME'
                        };
                        // detect Windows version from platform tokens
                        if (/^Win/i.test(result) &&
                            (data = data[0/*Opera 9.25 fix*/, /[\d.]+$/.exec(result)])) {
                            result = 'Windows ' + data;
                            isWindows7 = data == 'Server 2008 R2 / 7';
                        }
                        // correct character case and cleanup
                        result = format(String(result)
                          .replace(RegExp(pattern, 'i'), guess.label || guess)
                          .replace(/ ce$/i, ' CE')
                          .replace(/hpw/i, 'web')
                          .replace(/Macintosh/, 'Mac OS')
                          .replace(/_PowerPC/i, ' OS')
                          .replace(/(OS X) [^ \d]+/i, '$1')
                          .replace(/Mac (OS X)/, '$1')
                          .replace(/\/(\d)/, ' $1')
                          .replace(/_/g, '.')
                          .replace(/(?: BePC|[ .]*fc[ \d.]+)$/i, '')
                          .replace(/x86\.64/gi, 'x86_64')
                          .replace(/(Windows Phone)(?! OS)/, '$1 OS')
                          .split(' on ')[0]);
                    }
                    return result;
                });
            }

            /**
             * Picks the product name from an array of guesses.
             *
             * @private
             * @param {Array} guesses An array of guesses.
             * @returns {null|string} The detected product name.
             */
            function getProduct(guesses) {
                return reduce(guesses, function (result, guess) {
                    var pattern = guess.pattern || qualify(guess);
                    if (!result && (result =
                          RegExp('\\b' + pattern + ' *\\d+[.\\w_]*', 'i').exec(ua) ||
                          RegExp('\\b' + pattern + '(?:; *(?:[a-z]+[_-])?[a-z]+\\d+|[^ ();-]*)', 'i').exec(ua)
                        )) {
                        // split by forward slash and append product version if needed
                        if ((result = String((guess.label && !RegExp(pattern, 'i').test(guess.label)) ? guess.label : result).split('/'))[1] && !/[\d.]+/.test(result[0])) {
                            result[0] += ' ' + result[1];
                        }
                        // correct character case and cleanup
                        guess = guess.label || guess;
                        result = format(result[0]
                          .replace(RegExp(pattern, 'i'), guess)
                          .replace(RegExp('; *(?:' + guess + '[_-])?', 'i'), ' ')
                          .replace(RegExp('(' + guess + ')[-_.]?(\\w)', 'i'), '$1 $2'));
                    }
                    return result;
                });
            }

            /**
             * Resolves the version using an array of UA patterns.
             *
             * @private
             * @param {Array} patterns An array of UA patterns.
             * @returns {null|string} The detected version.
             */
            function getVersion(patterns) {
                return reduce(patterns, function (result, pattern) {
                    return result || (RegExp(pattern +
                      '(?:-[\\d.]+/|(?: for [\\w-]+)?[ /-])([\\d.]+[^ ();/_-]*)', 'i').exec(ua) || 0)[1] || null;
                });
            }

            /**
             * Returns `platform.description` when the platform object is coerced to a string.
             *
             * @name toString
             * @memberOf platform
             * @returns {string} Returns `platform.description` if available, else an empty string.
             */
            function toStringPlatform() {
                return this.description || '';
            }

            /*------------------------------------------------------------------------*/

            // convert layout to an array so we can add extra details
            layout && (layout = [layout]);

            // detect product names that contain their manufacturer's name
            if (manufacturer && !product) {
                product = getProduct([manufacturer]);
            }
            // clean up Google TV
            if ((data = /Google TV/.exec(product))) {
                product = data[0];
            }
            // detect simulators
            if (/\bSimulator\b/i.test(ua)) {
                product = (product ? product + ' ' : '') + 'Simulator';
            }
            // detect iOS
            if (/^iP/.test(product)) {
                name || (name = 'Safari');
                os = 'iOS' + ((data = / OS ([\d_]+)/i.exec(ua))
                  ? ' ' + data[1].replace(/_/g, '.')
                  : '');
            }
                // detect Kubuntu
            else if (name == 'Konqueror' && !/buntu/i.test(os)) {
                os = 'Kubuntu';
            }
                // detect Android browsers
            else if (manufacturer && manufacturer != 'Google' &&
                ((/Chrome/.test(name) && !/Mobile Safari/.test(ua)) || /Vita/.test(product))) {
                name = 'Android Browser';
                os = /Android/.test(os) ? os : 'Android';
            }
                // detect false positives for Firefox/Safari
            else if (!name || (data = !/\bMinefield\b|\(Android;/i.test(ua) && /Firefox|Safari/.exec(name))) {
                // escape the `/` for Firefox 1
                if (name && !product && /[\/,]|^[^(]+?\)/.test(ua.slice(ua.indexOf(data + '/') + 8))) {
                    // clear name of false positives
                    name = null;
                }
                // reassign a generic name
                if ((data = product || manufacturer || os) &&
                    (product || manufacturer || /Android|Symbian OS|Tablet OS|webOS/.test(os))) {
                    name = /[a-z]+(?: Hat)?/i.exec(/Android/.test(os) ? os : data) + ' Browser';
                }
            }
            // detect Firefox OS
            if ((data = /\((Mobile|Tablet).*?Firefox/i.exec(ua)) && data[1]) {
                os = 'Firefox OS';
                if (!product) {
                    product = data[1];
                }
            }
            // detect non-Opera versions (order is important)
            if (!version) {
                version = getVersion([
                  '(?:Cloud9|CriOS|CrMo|Iron|Opera ?Mini|OPR|Raven|Silk(?!/[\\d.]+$))',
                  'Version',
                  qualify(name),
                  '(?:Firefox|Minefield|NetFront)'
                ]);
            }
            // detect stubborn layout engines
            if (layout == 'iCab' && parseFloat(version) > 3) {
                layout = ['WebKit'];
            } else if ((data =
                  /Opera/.test(name) && (/OPR/.test(ua) ? 'Blink' : 'Presto') ||
                  /\b(?:Midori|Nook|Safari)\b/i.test(ua) && 'WebKit' ||
                  !layout && /\bMSIE\b/i.test(ua) && (os == 'Mac OS' ? 'Tasman' : 'Trident')
                )) {
                layout = [data];
            }
                // detect NetFront on PlayStation
            else if (/PlayStation(?! Vita)/i.test(name) && layout == 'WebKit') {
                layout = ['NetFront'];
            }
            // detect IE 11 and above
            if (name != 'IE' && layout == 'Trident' && (data = /\brv:([\d.]+)/.exec(ua))) {
                if (name) {
                    description.push('identifying as ' + name + (version ? ' ' + version : ''));
                }
                name = 'IE';
                version = data[1];
            }
            // leverage environment features
            if (useFeatures) {
                // detect server-side environments
                // Rhino has a global function while others have a global object
                if (isHostType(context, 'global')) {
                    if (java) {
                        data = java.lang.System;
                        arch = data.getProperty('os.arch');
                        os = os || data.getProperty('os.name') + ' ' + data.getProperty('os.version');
                    }
                    if (isModuleScope && isHostType(context, 'system') && (data = [context.system])[0]) {
                        os || (os = data[0].os || null);
                        try {
                            data[1] = context.require('ringo/engine').version;
                            version = data[1].join('.');
                            name = 'RingoJS';
                        } catch (e) {
                            if (data[0].global.system == context.system) {
                                name = 'Narwhal';
                            }
                        }
                    }
                    else if (typeof context.process == 'object' && (data = context.process)) {
                        name = 'Node.js';
                        arch = data.arch;
                        os = data.platform;
                        version = /[\d.]+/.exec(data.version)[0];
                    }
                    else if (rhino) {
                        name = 'Rhino';
                    }
                }
                    // detect Adobe AIR
                else if (getClassOf((data = context.runtime)) == airRuntimeClass) {
                    name = 'Adobe AIR';
                    os = data.flash.system.Capabilities.os;
                }
                    // detect PhantomJS
                else if (getClassOf((data = context.phantom)) == phantomClass) {
                    name = 'PhantomJS';
                    version = (data = data.version || null) && (data.major + '.' + data.minor + '.' + data.patch);
                }
                    // detect IE compatibility modes
                else if (typeof doc.documentMode == 'number' && (data = /\bTrident\/(\d+)/i.exec(ua))) {
                    // we're in compatibility mode when the Trident version + 4 doesn't
                    // equal the document mode
                    version = [version, doc.documentMode];
                    if ((data = +data[1] + 4) != version[1]) {
                        description.push('IE ' + version[1] + ' mode');
                        layout && (layout[1] = '');
                        version[1] = data;
                    }
                    version = name == 'IE' ? String(version[1].toFixed(1)) : version[0];
                }
                os = os && format(os);
            }
            // detect prerelease phases
            if (version && (data =
                  /(?:[ab]|dp|pre|[ab]\d+pre)(?:\d+\+?)?$/i.exec(version) ||
                  /(?:alpha|beta)(?: ?\d)?/i.exec(ua + ';' + (useFeatures && nav.appMinorVersion)) ||
                  /\bMinefield\b/i.test(ua) && 'a'
                )) {
                prerelease = /b/i.test(data) ? 'beta' : 'alpha';
                version = version.replace(RegExp(data + '\\+?$'), '') +
                  (prerelease == 'beta' ? beta : alpha) + (/\d+\+?/.exec(data) || '');
            }
            // detect Firefox Mobile
            if (name == 'Fennec' || name == 'Firefox' && /Android|Firefox OS/.test(os)) {
                name = 'Firefox Mobile';
            }
                // obscure Maxthon's unreliable version
            else if (name == 'Maxthon' && version) {
                version = version.replace(/\.[\d.]+/, '.x');
            }
                // detect Silk desktop/accelerated modes
            else if (name == 'Silk') {
                if (!/Mobi/i.test(ua)) {
                    os = 'Android';
                    description.unshift('desktop mode');
                }
                if (/Accelerated *= *true/i.test(ua)) {
                    description.unshift('accelerated');
                }
            }
                // detect Windows Phone desktop mode
            else if (name == 'IE' && (data = (/; *(?:XBLWP|ZuneWP)(\d+)/i.exec(ua) || 0)[1])) {
                name += ' Mobile';
                os = 'Windows Phone OS ' + data + '.x';
                description.unshift('desktop mode');
            }
                // detect Xbox 360 and Xbox One
            else if (/Xbox/i.test(product)) {
                os = null;
                if (product == 'Xbox 360' && /IEMobile/.test(ua)) {
                    description.unshift('mobile mode');
                }
            }
                // add mobile postfix
            else if ((name == 'Chrome' || name == 'IE' || name && !product && !/Browser|Mobi/.test(name)) &&
                (os == 'Windows CE' || /Mobi/i.test(ua))) {
                name += ' Mobile';
            }
                // detect IE platform preview
            else if (name == 'IE' && useFeatures && context.external === null) {
                description.unshift('platform preview');
            }
                // detect BlackBerry OS version
                // http://docs.blackberry.com/en/developers/deliverables/18169/HTTP_headers_sent_by_BB_Browser_1234911_11.jsp
            else if ((/BlackBerry/.test(product) || /BB10/.test(ua)) && (data =
                  (RegExp(product.replace(/ +/g, ' *') + '/([.\\d]+)', 'i').exec(ua) || 0)[1] ||
                  version
                )) {
                data = [data, /BB10/.test(ua)];
                os = (data[1] ? (product = null, manufacturer = 'BlackBerry') : 'Device Software') + ' ' + data[0];
                version = null;
            }
                // detect Opera identifying/masking itself as another browser
                // http://www.opera.com/support/kb/view/843/
            else if (this != forOwn && (
                  product != 'Wii' && (
                    (useFeatures && opera) ||
                    (/Opera/.test(name) && /\b(?:MSIE|Firefox)\b/i.test(ua)) ||
                    (name == 'Firefox' && /OS X (?:\d+\.){2,}/.test(os)) ||
                    (name == 'IE' && (
                      (os && !/^Win/.test(os) && version > 5.5) ||
                      /Windows XP/.test(os) && version > 8 ||
                      version == 8 && !/Trident/.test(ua)
                    ))
                  )
                ) && !reOpera.test((data = parse.call(forOwn, ua.replace(reOpera, '') + ';'))) && data.name) {

                // when "indentifying", the UA contains both Opera and the other browser's name
                data = 'ing as ' + data.name + ((data = data.version) ? ' ' + data : '');
                if (reOpera.test(name)) {
                    if (/IE/.test(data) && os == 'Mac OS') {
                        os = null;
                    }
                    data = 'identify' + data;
                }
                    // when "masking", the UA contains only the other browser's name
                else {
                    data = 'mask' + data;
                    if (operaClass) {
                        name = format(operaClass.replace(/([a-z])([A-Z])/g, '$1 $2'));
                    } else {
                        name = 'Opera';
                    }
                    if (/IE/.test(data)) {
                        os = null;
                    }
                    if (!useFeatures) {
                        version = null;
                    }
                }
                layout = ['Presto'];
                description.push(data);
            }
            // detect WebKit Nightly and approximate Chrome/Safari versions
            if ((data = (/\bAppleWebKit\/([\d.]+\+?)/i.exec(ua) || 0)[1])) {
                // correct build for numeric comparison
                // (e.g. "532.5" becomes "532.05")
                data = [parseFloat(data.replace(/\.(\d)$/, '.0$1')), data];
                // nightly builds are postfixed with a `+`
                if (name == 'Safari' && data[1].slice(-1) == '+') {
                    name = 'WebKit Nightly';
                    prerelease = 'alpha';
                    version = data[1].slice(0, -1);
                }
                    // clear incorrect browser versions
                else if (version == data[1] ||
                    version == (data[2] = (/\bSafari\/([\d.]+\+?)/i.exec(ua) || 0)[1])) {
                    version = null;
                }
                // use the full Chrome version when available
                data[1] = (/\bChrome\/([\d.]+)/i.exec(ua) || 0)[1];
                // detect Blink layout engine
                if (data[0] == 537.36 && data[2] == 537.36 && parseFloat(data[1]) >= 28) {
                    layout = ['Blink'];
                }
                // detect JavaScriptCore
                // http://stackoverflow.com/questions/6768474/how-can-i-detect-which-javascript-engine-v8-or-jsc-is-used-at-runtime-in-androi
                if (!useFeatures || (!likeChrome && !data[1])) {
                    layout && (layout[1] = 'like Safari');
                    data = (data = data[0], data < 400 ? 1 : data < 500 ? 2 : data < 526 ? 3 : data < 533 ? 4 : data < 534 ? '4+' : data < 535 ? 5 : data < 537 ? 6 : data < 538 ? 7 : '7');
                } else {
                    layout && (layout[1] = 'like Chrome');
                    data = data[1] || (data = data[0], data < 530 ? 1 : data < 532 ? 2 : data < 532.05 ? 3 : data < 533 ? 4 : data < 534.03 ? 5 : data < 534.07 ? 6 : data < 534.10 ? 7 : data < 534.13 ? 8 : data < 534.16 ? 9 : data < 534.24 ? 10 : data < 534.30 ? 11 : data < 535.01 ? 12 : data < 535.02 ? '13+' : data < 535.07 ? 15 : data < 535.11 ? 16 : data < 535.19 ? 17 : data < 536.05 ? 18 : data < 536.10 ? 19 : data < 537.01 ? 20 : data < 537.11 ? '21+' : data < 537.13 ? 23 : data < 537.18 ? 24 : data < 537.24 ? 25 : data < 537.36 ? 26 : layout != 'Blink' ? '27' : '28');
                }
                // add the postfix of ".x" or "+" for approximate versions
                layout && (layout[1] += ' ' + (data += typeof data == 'number' ? '.x' : /[.+]/.test(data) ? '' : '+'));
                // obscure version for some Safari 1-2 releases
                if (name == 'Safari' && (!version || parseInt(version) > 45)) {
                    version = data;
                }
            }
            // detect Opera desktop modes
            if (name == 'Opera' && (data = /(?:zbov|zvav)$/.exec(os))) {
                name += ' ';
                description.unshift('desktop mode');
                if (data == 'zvav') {
                    name += 'Mini';
                    version = null;
                } else {
                    name += 'Mobile';
                }
            }
                // detect Chrome desktop mode
            else if (name == 'Safari' && /Chrome/.exec(layout && layout[1])) {
                description.unshift('desktop mode');
                name = 'Chrome Mobile';
                version = null;

                if (/OS X/.test(os)) {
                    manufacturer = 'Apple';
                    os = 'iOS 4.3+';
                } else {
                    os = null;
                }
            }
            // strip incorrect OS versions
            if (version && version.indexOf((data = /[\d.]+$/.exec(os))) == 0 &&
                ua.indexOf('/' + data + '-') > -1) {
                os = trim(os.replace(data, ''));
            }
            // add layout engine
            if (layout && !/Avant|Nook/.test(name) && (
                /Browser|Lunascape|Maxthon/.test(name) ||
                /^(?:Adobe|Arora|Midori|Phantom|Rekonq|Rock|Sleipnir|Web)/.test(name) && layout[1])) {
                // don't add layout details to description if they are falsey
                (data = layout[layout.length - 1]) && description.push(data);
            }
            // combine contextual information
            if (description.length) {
                description = ['(' + description.join('; ') + ')'];
            }
            // append manufacturer
            if (manufacturer && product && product.indexOf(manufacturer) < 0) {
                description.push('on ' + manufacturer);
            }
            // append product
            if (product) {
                description.push((/^on /.test(description[description.length - 1]) ? '' : 'on ') + product);
            }
            // parse OS into an object
            if (os) {
                data = / ([\d.+]+)$/.exec(os);
                os = {
                    'architecture': 32,
                    'family': (data && !isWindows7) ? os.replace(data[0], '') : os,
                    'version': data ? data[1] : null,
                    'toString': function () {
                        var version = this.version;
                        return this.family + ((version && !isWindows7) ? ' ' + version : '') + (this.architecture == 64 ? ' 64-bit' : '');
                    }
                };
            }
            // add browser/OS architecture
            if ((data = /\b(?:AMD|IA|Win|WOW|x86_|x)64\b/i.exec(arch)) && !/\bi686\b/i.test(arch)) {
                if (os) {
                    os.architecture = 64;
                    os.family = os.family.replace(RegExp(' *' + data), '');
                }
                if (name && (/WOW64/i.test(ua) ||
                    (useFeatures && /\w(?:86|32)$/.test(nav.cpuClass || nav.platform)))) {
                    description.unshift('32-bit');
                }
            }

            ua || (ua = null);

            /*------------------------------------------------------------------------*/

            /**
             * The platform object.
             *
             * @name platform
             * @type Object
             */
            var platform = {};

            /**
             * The platform description.
             *
             * @memberOf platform
             * @type string|null
             */
            platform.description = ua;

            /**
             * The name of the browser's layout engine.
             *
             * @memberOf platform
             * @type string|null
             */
            platform.layout = layout && layout[0];

            /**
             * The name of the product's manufacturer.
             *
             * @memberOf platform
             * @type string|null
             */
            platform.manufacturer = manufacturer;

            /**
             * The name of the browser/environment.
             *
             * @memberOf platform
             * @type string|null
             */
            platform.name = name;

            /**
             * The alpha/beta release indicator.
             *
             * @memberOf platform
             * @type string|null
             */
            platform.prerelease = prerelease;

            /**
             * The name of the product hosting the browser.
             *
             * @memberOf platform
             * @type string|null
             */
            platform.product = product;

            /**
             * The browser's user agent string.
             *
             * @memberOf platform
             * @type string|null
             */
            platform.ua = ua;

            /**
             * The browser/environment version.
             *
             * @memberOf platform
             * @type string|null
             */
            platform.version = name && version;

            /**
             * The name of the operating system.
             *
             * @memberOf platform
             * @type Object
             */
            platform.os = os || {

                /**
                 * The CPU architecture the OS is built for.
                 *
                 * @memberOf platform.os
                 * @type number|null
                 */
                'architecture': null,

                /**
                 * The family of the OS.
                 *
                 * Common values include:
                 * "Windows", "Windows Server 2008 R2 / 7", "Windows Server 2008 / Vista",
                 * "Windows XP", "OS X", "Ubuntu", "Debian", "Fedora", "Red Hat", "SuSE",
                 * "Android", "iOS" and "Windows Phone OS"
                 *
                 * @memberOf platform.os
                 * @type string|null
                 */
                'family': null,

                /**
                 * The version of the OS.
                 *
                 * @memberOf platform.os
                 * @type string|null
                 */
                'version': null,

                /**
                 * Returns the OS string.
                 *
                 * @memberOf platform.os
                 * @returns {string} The OS string.
                 */
                'toString': function () { return 'null'; }
            };

            platform.parse = parse;
            platform.toString = toStringPlatform;

            if (platform.version) {
                description.unshift(version);
            }
            if (platform.name) {
                description.unshift(name);
            }
            if (os && name && !(os == String(os).split(' ')[0] && (os == name.split(' ')[0] || product))) {
                description.push(product ? '(' + os + ')' : 'on ' + os);
            }
            if (description.length) {
                platform.description = description.join(' ');
            }
            return platform;
        }
        
    }

})(window);

