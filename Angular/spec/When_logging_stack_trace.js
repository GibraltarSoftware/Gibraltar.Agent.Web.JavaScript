describe("When logging stack trace", function() {
    var expectedUrl = '/Loupe/Log';
    var $scope, ctrl, logService, clientDetails;
    var common = testCommon('testErrorApp');


    beforeAll(function () {
        BrowserDetect.init();
    });

    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler) {
        $scope = $rootScope.$new();

        ctrl = $controller('TestCtrl', {
            $scope: $scope,
            $exceptionHandler: $exceptionHandler,
            logService: logService
        });
    }));


    it('Should have expected stack trace for simple error', function() {
        common.executeTest(ctrl.throwSimpleError(),
                           function (requestBody) {
                                var data = JSON.parse(requestBody);
                    
                                var expectedFrames = ['{anonymous}("Throw with message")'];
                                expect(data.logMessages[0].exception.message).toEqual('Throw with message');
                                expect(hasExpectedStack(data.logMessages[0].exception.stackTrace, expectedFrames)).toBe(true, "Expected frames do not match");
                                expect(data.logMessages[0].exception.stackTrace.some(hasLoupeFrame)).toBe(false, "Loupe frames found in stack");
                    
                                return true;
                            });
    });

    it('Should have expected stack trace for custom error details', function() {
        var expectedFrames;

        switch (BrowserDetect.browser) {
            case "Firefox":
                expectedFrames = ["InnerItem/this.throwCustomError", "TestingStack/this.createCustomError", "throwCustomError"];
                break;
            case "Explorer":
                expectedFrames = ["throwCustomError", "createCustomError", "throwCustomError","Anonymous function"];
                break;
            case "Safari":
                expectedFrames = ['{anonymous}(?)'];
                break;
            case "Chrome":
                expectedFrames = ["InnerItem.throwCustomError", "TestingStack.createCustomError", "throwCustomError"];
                break;
        }
        
        common.executeTest(ctrl.throwCustomError(),
                           function (requestBody) {
                                var data = JSON.parse(requestBody);
                                var exception = data.logMessages[0].exception;
                    
                                expect(exception.message).toEqual("Error: My custom error");
                                expect(hasExpectedStackFrames(exception.stackTrace, expectedFrames)).toBe(true, "Expected frames do not match");
                                expect(exception.stackTrace.some(hasLoupeFrame)).toBe(false, "Loupe frames found in stack");
                    
                                return true;
                           });
    });

    it('Should have expected stack trace for Unitialized error', function() {

        var expectedFrames;
        var expectedMessage;


        switch (BrowserDetect.browser) {
            case "Firefox":
                expectedFrames = ["InnerItem/this.throwUnitializeError", "TestingStack/this.createError", "throwUninitializeError"];
                expectedMessage = "TypeError: uninitializedObject is undefined";
                break;
            case "Explorer":
                expectedFrames = ["throwUnitializeError", "createError","throwUninitializeError"];
                expectedMessage = "TypeError: Unable to get property 'doStuff' of undefined or null reference";
                break;
            case "Safari":
                expectedFrames = ['{anonymous}(?)'];
                expectedMessage = "TypeError: 'undefined' is not an object (evaluating 'uninitializedObject.doStuff')";
                break;
            case "Chrome":
                expectedFrames = ["InnerItem.throwUnitializeError", "TestingStack.createError", "throwUninitializeError"];
                expectedMessage = "TypeError: Cannot read property 'doStuff' of undefined";
                break;
        }

        common.executeTest(ctrl.throwUninitializeError(),
                           function (requestBody) {
                                var data = JSON.parse(requestBody);
                                var exception = data.logMessages[0].exception;
                    
                                expect(exception.message).toEqual(expectedMessage);
                                expect(hasExpectedStackFrames(exception.stackTrace, expectedFrames)).toBe(true,"Expected frames do not match");
                                expect(exception.stackTrace.some(hasLoupeFrame)).toBe(false, "Loupe frames found in stack");
                    
                                return true;
                           });
    });


     function hasExpectedStackFrames(stack, expectedFrames) {
         var stackTrace = stack.reverse();

         for (var i = 0; i < expectedFrames.length; i++) {
             if (stackTrace[i].indexOf(expectedFrames[i]) === -1) {
                 return false;
             }
         }

         return true;
     }
});