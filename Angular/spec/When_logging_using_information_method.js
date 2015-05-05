describe('When logging using information method', function() {
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
    
    it('Should log expected caption & description', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody).logMessages[0];
            
            expect(data.category).toEqual('test');
            expect(data.caption).toEqual('information logging');
            expect(data.description).toEqual('testing logging using information method');
            expect(data.severity).toEqual(logService.logMessageSeverity.information);
            
            return true;
        }).respond(200);

        $scope.information('information logging','testing logging using information method');
        $httpBackend.flush();
    }));
    
    it('Should log expected exception', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody).logMessages[0];
            
            expect(data.exception).not.toBeNull();
            expect(data.exception.message).toEqual('supplied exception');
            return true;
        }).respond(200);

        var suppliedException = new Error("supplied exception");
        $scope.information('information logging','testing logging using information method',suppliedException);
        $httpBackend.flush();
    }));
    
    it('Should log expected details', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody).logMessages[0];
            
            expect(data.details).toEqual("<data>details</data>");
            expect(data.severity).toEqual(logService.logMessageSeverity.information);
            
            return true;
        }).respond(200);

        $scope.informationDetail('information logging','testing logging using information method',null,"<data>details</data>");
        $httpBackend.flush();
    }));            
});