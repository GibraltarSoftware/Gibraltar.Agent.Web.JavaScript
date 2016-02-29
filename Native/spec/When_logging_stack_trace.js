describe('When logging stack trace', function () {

    var common = testCommon();
    var messageFn = new Messages();

    beforeAll(function() {
        BrowserDetect.init();
    });

    beforeEach(function () {
        messageFn.init(common.requests());
    });


    it('Should have trace for uninitialized Object details', function (done) {
        throwUninitializeError();
        
         messageFn.waitToBeLogged(function() {    
            body = messageFn.getRequestBody();
    
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
                    expectedFrames = ["TypeError", "at InnerItem.throwUnitializeError", "at TestingStack.createError", "at " + window.location.origin + "/spec/When_logging_stack_trace.js"];
                    expectedMessage = "Uncaught TypeError: Cannot read property 'doStuff' of undefined";
                    break;
            }
    
            expect(body.logMessages[0].exception.message).toBe(expectedMessage);
            expect(body.logMessages[0].exception.stackTrace).not.toBeUndefined();
            expect(hasExpectedStack(body.logMessages[0].exception.stackTrace, expectedFrames)).toBe(true);
            
            done();
        });

    });


    it('Should have trace for custom error details', function (done) {
        throwCustomError();
        
        messageFn.waitToBeLogged(function() {    
            
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
                    expectedFrames = ["Error: My custom error", "at InnerItem.throwCustomError", "at TestingStack.createCustomError", "at " + window.location.origin + "/spec/When_logging_stack_trace.js"];
                    expectedMessage = "Uncaught Error: My custom error";
                    break;
            }
    
            body = messageFn.getRequestBody();
    
            expect(body.logMessages[0].exception.message).toBe(expectedMessage);
            expect(body.logMessages[0].exception.stackTrace).not.toBeUndefined();
            expect(hasExpectedStack(body.logMessages[0].exception.stackTrace, expectedFrames)).toBe(true);
            
            done();
        });
    });

    it('Should have trace anonymous error', function(done) {
         throwWithMessage();
        
         messageFn.waitToBeLogged(function() {  
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
    
            body = messageFn.getRequestBody();
    
            expect(body.logMessages[0].exception.message).toBe(expectedMessage);
            expect(hasExpectedStack(body.logMessages[0].exception.stackTrace, expectedFrames)).toBe(true);
            expect(body.logMessages[0].exception.stackTrace.some(hasLoupeFrame)).toBe(false);
            
            done();
         });
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
});
