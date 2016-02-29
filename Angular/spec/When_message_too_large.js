describe('When message too large', function() {
    var $scope, ctrl, logService;
    var common = testCommon('testApp');
    var maxRequestSize = 204800
    
    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler) {
        logService = common.logService();
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


    it('Should strip details', function(){
        
        var overlargeDetails;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeDetails = overlargeDetails + "M";
        }
        
        common.executeTest($scope.information('oversize details','testing logging with oversize details',null,"<data>" + overlargeDetails + "</data>"),
                    function(requestBody) {
                        var data = JSON.parse(requestBody).logMessages[0];
                        
                        expect(data.details).toEqual('{"message":"User supplied details truncated as log message exceeded maximum size."}');
                        return true;                                     
                   });        
    });

    it('Should drop message if oversized and cannot reduce size', inject(function($httpBackend, $timeout){
        
        var overlargeMethod;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeMethod = overlargeMethod + "M";
        }
        
        var invalidMethodSourceInfo = new logService.MethodSourceInfo("app.js", overlargeMethod);
        
        $scope.information('oversize details','testing logging with oversize details',null,null, invalidMethodSourceInfo);
        $timeout.flush();
        
        // there should be no http requests to flush (message having been dropped)
        // so when we tell $httpBackend to flush it should throw an execption
        expect($httpBackend.flush).toThrow();       
        
    }));


    it('Should create message stating a message has been dropped', inject(function($httpBackend, $timeout){
        
        var overlargeMethod;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeMethod = overlargeMethod + "M";
        }
        
        var invalidMethodSourceInfo = new logService.MethodSourceInfo("app.js", overlargeMethod);
        
        $scope.information('oversize details','testing logging with oversize details',null,null, invalidMethodSourceInfo);
        $timeout.flush();
       
        expect(localStorage.length).toEqual(1);
        
        var message = getLoupeMessagesFromLocalStorage()[0]
        expect(message.caption).toEqual("Dropped message");        
        
    }));

    it('Should include caption & description from the dropped message', inject(function($httpBackend, $timeout){
        
        var overlargeMethod;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeMethod = overlargeMethod + "M";
        }
        
        var invalidMethodSourceInfo = new logService.MethodSourceInfo("app.js", overlargeMethod);
        
        $scope.information('oversize details','testing logging with oversize details',null,null, invalidMethodSourceInfo);
        $timeout.flush();
        expect(localStorage.length).toEqual(1);
        
        var message = getLoupeMessagesFromLocalStorage()[0]
        expect(message.caption).toEqual("Dropped message");
        expect(message.description).toContain("{0}")
        expect(message.description).toContain("{1}")
        expect(message.parameters[0]).toEqual("oversize details");
        expect(message.parameters[1]).toEqual("testing logging with oversize details");
        
    })); 
    
    it('Should include caption from the dropped message if description is too large', inject(function($httpBackend, $timeout){
        
        var overlargeDescription;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeDescription = overlargeDescription + "M";
        }
       
        
        $scope.information('oversize details',overlargeDescription);
        $timeout.flush();
        expect(localStorage.length).toEqual(1);
        
        var message = getLoupeMessagesFromLocalStorage()[0]
        expect(message.caption).toEqual("Dropped message");
        expect(message.description).toContain("{0}")
        expect(message.parameters[0]).toEqual("oversize details");
        
    }));     
    
    it('Should not include any details from the dropped in message', inject(function($httpBackend, $timeout){
        
        var overlargeCaption;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeCaption = overlargeCaption + "M";
        }
        
        $scope.information(overlargeCaption,'testing logging with oversize details');
        $timeout.flush();
        expect(localStorage.length).toEqual(1);
        
        var message = getLoupeMessagesFromLocalStorage()[0]
        expect(message.caption).toEqual("Dropped message");
        expect(message.description).toContain("Unable to log caption or description as they exceed max request size");
        
    }));     
});