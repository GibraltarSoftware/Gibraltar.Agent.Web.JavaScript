describe('When logging a message', function() {
    var expectedUrl = '/Gibraltar/Log/Message';
    var $scope, ctrl, logService;

    beforeEach(module('testApp', function ($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
    }));

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

            expect(data.Severity).toEqual(logService.logMessageSeverity.information);
            return true;
        }).respond(200);

        $scope.logMessage();
        $httpBackend.flush();
    }));

    it('Should have correct category', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);

            expect(data.Category).toEqual("test");
            return true;
        }).respond(200);

        $scope.logMessage();
        $httpBackend.flush();
    }));

    it('Should have expected message', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);

            expect(data.Caption).toEqual("Test expected message");
            return true;
        }).respond(200);

        $scope.logMessage("Test expected message");
        $httpBackend.flush();
    }));

});