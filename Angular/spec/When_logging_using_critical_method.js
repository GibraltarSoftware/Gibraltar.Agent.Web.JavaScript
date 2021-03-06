describe('When logging using critical method', function() {
    var common = testCommon('testApp');
    var $scope, ctrl, logService;

    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler) {
        logService = common.logService();
        $scope = $rootScope.$new();
        ctrl = $controller('TestCtrl', {
            $scope: $scope,
            $exceptionHandler: $exceptionHandler,
            logService: logService
        });
    }));        
    
    it('Should log expected caption & description',function () {
        common.executeTest($scope.critical('critical logging','testing logging using critical method'),
                    function(requestBody) {
                        var data = JSON.parse(requestBody).logMessages[0];
                        
                        expect(data.category).toEqual('test');
                        expect(data.caption).toEqual('critical logging');
                        expect(data.description).toEqual('testing logging using critical method');
                        expect(data.severity).toEqual(logService.logMessageSeverity.critical);
                        
                        return true;          
                   });                
    });
    
    it('Should log expected exception', function () {
        var suppliedException = new Error("supplied exception");
        
        common.executeTest($scope.critical('critical logging','testing logging using critical method',suppliedException),
                    function(requestBody) {
                        var data = JSON.parse(requestBody).logMessages[0];
                        
                        expect(data.exception).not.toBeNull();
                        expect(data.exception.message).toEqual('supplied exception');
                        return true;               
                   });        
    });
    

    
    it('Should log expected details', function (){
        common.executeTest($scope.critical('critical logging','testing logging using critical method',null,"<data>details</data>"),
                    function(requestBody) {
                        var data = JSON.parse(requestBody).logMessages[0];
                        
                        expect(data.details).toEqual("<data>details</data>");
                        expect(data.severity).toEqual(logService.logMessageSeverity.critical);
                        
                        return true;                
                   });
    });             
    
});