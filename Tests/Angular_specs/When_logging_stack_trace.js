describe("When logging stack trace", function() {
    var expectedUrl = '/Gibraltar/Log/Exception';
    var $scope, ctrl, logService, clientDetails;

    beforeAll(function () {
        BrowserDetect.init();
    });

    beforeEach(function () {
        module('testErrorApp', function ($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
        });
    });

    beforeEach(inject(["gibraltar.logService", function (_logService_) {
        logService = _logService_;
    }]));


    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler) {
        $scope = $rootScope.$new();

        ctrl = $controller('TestCtrl', {
            $scope: $scope,
            $exceptionHandler: $exceptionHandler,
            logService: logService
        });
    }));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }));


    it('Should have expected stack trace for simple error', inject(function($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);

            var expectedFrames = ['{anonymous}("Throw with message")'];
            expect(data.Message).toEqual('Throw with message');
            expect(hasExpectedStack(data.StackTrace, expectedFrames)).toBe(true);
            expect(data.StackTrace.some(hasLoupeFrame)).toBe(false);

            return true;
        }).respond(200);

        ctrl.throwSimpleError();
        $httpBackend.flush();
    }));

    it('Should have expected stack trace for custom error details', inject(function ($httpBackend) {
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
                expectedFrames = ["InnerItem.throwCustomError", "TestingStack.createCustomError", "throwCustomError" ,window.location.origin + "/Angular_specs/When_logging_stack_trace.js"];
                break;
        }


        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);

            expect(data.Message).toEqual("Error: My custom error");
            expect(hasExpectedStackFrames(data.StackTrace, expectedFrames)).toBe(true);
            expect(data.StackTrace.some(hasLoupeFrame)).toBe(false);

            return true;
        }).respond(200);

        ctrl.throwCustomError();
        $httpBackend.flush();
    }));

    it('Should have expected stack trace for Unitialized error', inject(function ($httpBackend) {

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
                expectedFrames = ["InnerItem.throwUnitializeError", "TestingStack.createError", "throwUninitializeError", window.location.origin + "/Angular_specs/When_logging_stack_trace.js"];
                expectedMessage = "TypeError: Cannot read property 'doStuff' of undefined";
                break;
        }

        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);
            expect(data.Message).toEqual(expectedMessage);
            expect(hasExpectedStackFrames(data.StackTrace, expectedFrames)).toBe(true);
            expect(data.StackTrace.some(hasLoupeFrame)).toBe(false);

            return true;
        }).respond(200);

        ctrl.throwUninitializeError();
        $httpBackend.flush();
    }));


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