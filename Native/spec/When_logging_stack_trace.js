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

        expect(body.logMessages[0].exception.message).toBe(expectedMessage);
        expect(body.logMessages[0].exception.stackTrace).not.toBeUndefined();
        expect(hasExpectedStack(body.logMessages[0].exception.stackTrace, expectedFrames)).toBe(true);


    });


    it('Should have trace for custom error details', function () {

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

        expect(body.logMessages[0].exception.message).toBe(expectedMessage);
        expect(body.logMessages[0].exception.stackTrace).not.toBeUndefined();
        expect(hasExpectedStack(body.logMessages[0].exception.stackTrace, expectedFrames)).toBe(true);
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

        expect(body.logMessages[0].exception.message).toBe(expectedMessage);
        expect(hasExpectedStack(body.logMessages[0].exception.stackTrace, expectedFrames)).toBe(true);
        expect(body.logMessages[0].exception.stackTrace.some(hasLoupeFrame)).toBe(false);
    });

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

});
