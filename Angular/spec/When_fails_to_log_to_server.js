describe("When fails to log to server", function(){
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
        localStorage.clear();
    }));    
        
    
	it('Should keep message in local storage', inject(function($httpBackend, $timeout){
        $scope.logMessage("1st message");
        $httpBackend.when('POST',expectedUrl).respond(500);
        $timeout.flush();
        $httpBackend.flush();
        expect(localStorage.length).toEqual(1);			
	}));
	
    it('Should send all messages in local storage', inject(function($httpBackend, $timeout){
        $httpBackend.when('POST',expectedUrl).respond(function(method, url, data, headers){
            // first call return 500 so message not removed
            if(localStorage.length === 1){
                return [500, {}, {}];
            } else {
                return [200, {}, {}];
            }
        });
        
        $scope.logMessage("1st message");
        $timeout.flush();
        $httpBackend.flush();
        expect(localStorage.length).toEqual(1);	  
       
        $scope.logMessage("2nd message");        
        $timeout.flush();
        $httpBackend.flush();
                
        expect(localStorage.length).toEqual(0);	        
    }));
    
    it('Should only remove items from localStorage for loupe', inject(function($httpBackend, $timeout){
        localStorage.setItem("myItem","a value");
        localStorage.setItem("Loupe","user loupe value");
        
        $httpBackend.when('POST', expectedUrl).respond(200);
        $scope.logMessage();
        $timeout.flush();
        $httpBackend.flush();
        expect(localStorage.length).toEqual(2);
    }));
});