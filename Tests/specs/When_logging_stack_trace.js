describe('When logging stack trace', function () {

    var xhr, requests, body;

    beforeAll(function() {
        BrowserDetect.init();
    });

    beforeEach(function (done) {

        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function(req) {
            requests.push(req);
        };

        throwUninitializeError();
        throwCustomError();
        throwWithMessage();
        requestsComplete(done);

    });

    afterEach(function() {
        xhr.restore();
    });

    it('Should have trace for uninitialized Object details', function () {
        var request = requests[0];

        body = JSON.parse(request.requestBody);

        var expectedFrames;
        var expectedMessage;

        switch (BrowserDetect.browser) {
            case "Firefox":
                expectedFrames = ["InnerItem/this.throwUnitializeError", "TestingStack/this.createError", "throwUninitializeError"];
                expectedMessage = "TypeError: uninitializedObject is undefined";
                break;
            case "Explorer":
                expectedFrames = ["TypeError", " at throwUnitializeError", " at createError", " at Anonymous function"];
                expectedMessage = "Unable to get property 'doStuff' of undefined or null reference";
                break;
            case "Safari":
                expectedFrames = ['{anonymous}("TypeError:'];
                expectedMessage = "TypeError: 'undefined' is not an object (evaluating 'uninitializedObject.doStuff')";
                break;
            case "Chrome":
                expectedFrames = ["TypeError", "at InnerItem.throwUnitializeError", "at TestingStack.createError", "at " + window.location.origin + "/specs/When_logging_stack_trace.js"];
                expectedMessage = "Uncaught TypeError: Cannot read property 'doStuff' of undefined";
                break;
        }

        expect(body.Message).toBe(expectedMessage);
        expect(body.StackTrace).not.toBeUndefined();
        expect(hasExpectedStack(body.StackTrace, expectedFrames)).toBe(true);


    });


    it('Should have trace for custom error details', function () {

        var expectedFrames;

        switch (BrowserDetect.browser) {
            case "Firefox":
                expectedFrames = ["InnerItem/this.throwCustomError", "TestingStack/this.createError", "throwUninitializeError"];
                break;
            default:
        }

        var expectedFrames;
        var expectedMessage;

        switch (BrowserDetect.browser) {
            case "Firefox":
                expectedFrames = ["InnerItem/this.throwCustomError", "TestingStack/this.createCustomError", "throwCustomError"];
                expectedMessage = "Error: My custom error";
                break;
            case "Explorer":
                expectedFrames = ["Error: My custom error", " at throwCustomError", " at createCustomError", " at Anonymous function"];
                expectedMessage = "My custom error";
                break;
            case "Safari":
                expectedFrames = ['{anonymous}("Error:'];
                expectedMessage = "Error: My custom error";
                break;
            case "Chrome":
                expectedFrames = ["Error: My custom error", "at InnerItem.throwCustomError", "at TestingStack.createCustomError", "at " + window.location.origin + "/specs/When_logging_stack_trace.js"];
                expectedMessage = "Uncaught Error: My custom error";
                break;
        }

        var request = requests[1];

        body = JSON.parse(request.requestBody);

        expect(body.Message).toBe(expectedMessage);
        expect(body.StackTrace).not.toBeUndefined();
        expect(hasExpectedStack(body.StackTrace, expectedFrames)).toBe(true);
    });

    it('Should have trace anonymous error', function() {
        var request = requests[2];
        var expectedFrames = ["{anonymous}"];


        switch (BrowserDetect.browser) {
            case "Firefox":
                expectedMessage = "uncaught exception: Throw with message";
                break;
            case "Explorer":
                expectedMessage = "Throw with message";
                break;
            case "Safari":
                expectedMessage = "Throw with message";
                break;
            case "Chrome":
                expectedMessage = "Uncaught Throw with message";
                break;
        }

        body = JSON.parse(request.requestBody);

        expect(body.Message).toBe(expectedMessage);
        expect(hasExpectedStack(body.StackTrace, expectedFrames)).toBe(true);
        expect(body.StackTrace.some(hasLoupeFrame)).toBe(false);
    });



    function hasExpectedStack(stackTrace, expectedFrames) {
        return expectedFrames.every(function(item) {
            return stackTrace.some(function(frame) {
                return frame.indexOf(item) > -1;
            });
        });
    }

    function hasLoupeFrame(item) {
        var loupeItems = ["printStackTrace", "getStackTrace", "logError"];

        return loupeItems.some(function (check) {
            return item.indexOf(check) > -1;
        });
    }


    function throwUninitializeError() {
        setTimeout(function () {
            var object = new TestingStack();
            object.createError();
        }, 1);

    }

    function throwCustomError() {
        setTimeout(function () {
            var object = new TestingStack();
            object.createCustomError();
        }, 1);

    }

    function throwWithMessage() {
        setTimeout(function () {
            var object = new TestingStack();
            object.createThrowWithMessage();
        }, 1);

    }

    function requestsComplete(done) {
        if (requests.length > 2) {
            done();
        } else {
            setTimeout(requestsComplete, 10, done);
        }
        
    }

    var BrowserDetect = {
        init: function () {
            this.browser = this.searchString(this.dataBrowser) || "Other";
            this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "Unknown";
        },
        searchString: function (data) {
            for (var i = 0; i < data.length; i++) {
                var dataString = data[i].string;
                this.versionSearchString = data[i].subString;

                if (dataString.indexOf(data[i].subString) !== -1) {
                    return data[i].identity;
                }
            }
        },
        searchVersion: function (dataString) {
            var index = dataString.indexOf(this.versionSearchString);
            if (index === -1) {
                return;
            }

            var rv = dataString.indexOf("rv:");
            if (this.versionSearchString === "Trident" && rv !== -1) {
                return parseFloat(dataString.substring(rv + 3));
            } else {
                return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
            }
        },

        dataBrowser: [
            { string: navigator.userAgent, subString: "Chrome", identity: "Chrome" },
            { string: navigator.userAgent, subString: "MSIE", identity: "Explorer" },
            { string: navigator.userAgent, subString: "Trident", identity: "Explorer" },
            { string: navigator.userAgent, subString: "Firefox", identity: "Firefox" },
            { string: navigator.userAgent, subString: "Safari", identity: "Safari" },
            { string: navigator.userAgent, subString: "Opera", identity: "Opera" }
        ]

    };


});

function TestingStack() {


    var inner = new InnerItem();

    this.createError = function() {
        inner.throwUnitializeError();
    };

    this.createCustomError = function() {
        inner.throwCustomError();
    };

    this.createThrowWithMessage = function() {
        inner.throwWithMessage();
    };
}

function InnerItem() {


    var uninitializedObject;

    this.throwUnitializeError = function() {
        uninitializedObject.doStuff();
    };

    this.throwCustomError = function() {
        throw new Error("My custom error");
    };

    this.throwWithMessage = function() {
        throw "Throw with message";
    };
}