describe('When logging a message', function() {
    var expectedUrl = '/Loupe/Log';
    var $scope, ctrl, logService;

    beforeEach(module('testApp', function ($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
    }));

    beforeEach(inject(["loupe.logService", function (_logService_) {
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

    it('Should POST to expected url', inject(function($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function(requestBody) {
            expect(requestBody).not.toEqual("");
            return true;
        }).respond(200);
        $scope.logMessage();
        $httpBackend.flush();
    }));

    it('Should have correct severity', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);

            expect(data.logMessages[0].severity).toEqual(logService.logMessageSeverity.information);
            return true;
        }).respond(200);

        $scope.logMessage();
        $httpBackend.flush();
    }));

    it('Should have correct category', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);

            expect(data.logMessages[0].category).toEqual("test");
            return true;
        }).respond(200);

        $scope.logMessage();
        $httpBackend.flush();
    }));

    it('Should have expected message', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);

            expect(data.logMessages[0].caption).toEqual("Test expected message");
            return true;
        }).respond(200);

        $scope.logMessage("Test expected message");
        $httpBackend.flush();
    }));

    it('Should have expected message structure', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);

            expect(data['session']).toBeDefined('session missing');
            var session = data.session;
            expect(session['client']).toBeDefined('client details missing');
            checkClientMessageStructure(session.client);
            
            expect(data['logMessages']).toBeDefined('log messages missing');
            checkMessageStructure(data.logMessages[0]);
            
            return true;
        }).respond(200);

        $scope.logMessage("Test expected message");
        $httpBackend.flush();
    }));

    it('Should have time stamp', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var partialTimeStamp = createTimeStamp();
            var data = JSON.parse(requestBody);

            expect(data.logMessages[0].timeStamp).toContain(partialTimeStamp);
            return true;
        }).respond(200);

        $scope.logMessage("Test expected message");
        $httpBackend.flush();
    }));

});