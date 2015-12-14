describe("When fails to log to server", function(){
    var expectedUrl = '/Loupe/Log';
    var $scope, ctrl, logService;
    
    if(!webStorageSupported()){
        pending("Tests not run as web storage is not supported");
    }
    
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
        var data;
        $httpBackend.when('POST',expectedUrl).respond(200);
        for (var index = 0; index < 20; index++) {
            var message = {
                sequence: null
            };
            message.sequence = index
            
            localStorage.setItem("Loupe-message-" + index, JSON.stringify(message))
        }

        $scope.logMessage("1st message");
        $timeout.flush();
        $httpBackend.flush();
        expect(localStorage.length).toEqual(11);	  
       
        $timeout.flush();
        $httpBackend.flush();
        expect(localStorage.length).toEqual(1);
       

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
        
		var myItem = localStorage.getItem("myItem");
		expect(myItem).not.toBeNull();
		
		var userLoupeItem = localStorage.getItem("Loupe");
		expect(userLoupeItem).not.toBeNull();        
    }));
});