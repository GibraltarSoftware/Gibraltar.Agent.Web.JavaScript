describe('When logging using information method', function() {
    
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
        common.executeTest($scope.information('information logging','testing logging using information method'),
                    function(requestBody) {
                        var data = JSON.parse(requestBody).logMessages[0];
                        
                        expect(data.category).toEqual('test');
                        expect(data.caption).toEqual('information logging');
                        expect(data.description).toEqual('testing logging using information method');
                        expect(data.severity).toEqual(logService.logMessageSeverity.information);
                        
                        return true;          
                   });                
    });
    
    it('Should log expected exception', function () {
        var suppliedException = new Error("supplied exception");
        
        common.executeTest($scope.information('information logging','testing logging using information method',suppliedException),
                    function(requestBody) {
                        var data = JSON.parse(requestBody).logMessages[0];
                        
                        expect(data.exception).not.toBeNull();
                        expect(data.exception.message).toEqual('supplied exception');
                        return true;               
                   });        
    });
    

    
    it('Should log expected details', function (){
        common.executeTest($scope.information('information logging','testing logging using information method',null,"<data>details</data>"),
                    function(requestBody) {
                        var data = JSON.parse(requestBody).logMessages[0];
                        
                        expect(data.details).toEqual("<data>details</data>");
                        expect(data.severity).toEqual(logService.logMessageSeverity.information);
                        
                        return true;                
                   });
    });          
});