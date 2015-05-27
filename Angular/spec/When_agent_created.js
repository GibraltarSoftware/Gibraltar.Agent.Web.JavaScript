describe('When agent created', function(){
    var $scope, ctrl, logService;
    var common = testCommon('testApp');

    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler) {
        logService = common.logService();
        $scope = $rootScope.$new();
        ctrl = $controller('TestCtrl', {
            $scope: $scope,
            $exceptionHandler: $exceptionHandler,
            logService: logService
        });
    }));
    
    it('Should have client session header', function(){
        var headerObject = $scope.clientSessionHeader();
        expect(headerObject).not.toBeNull();
        expect(headerObject.headerName).toEqual("loupe-agent-sessionId");
        expect(headerObject.headerValue).not.toEqual(""); 
    });
});