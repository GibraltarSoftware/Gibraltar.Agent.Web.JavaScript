 function testCommon(moduleToLoad) {
    var expectedUrl = '/Loupe/Log';
    var logService;
    var httpBackend, timeout;
   
    if(typeof moduleToLoad == "undefined"){
        moduleToLoad = 'testApp';
    }
   
    
    beforeEach(module(moduleToLoad, function ($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
    }));
    
    beforeEach(inject(["loupe.logService", function (_logService_) {
        logService = _logService_;
    }]));


    beforeEach(inject(function($httpBackend, $timeout){
        httpBackend = $httpBackend;
        timeout = $timeout;
    }));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }));    
    
   function executeTest(logFn, fn){
        httpBackend.expectPOST(expectedUrl, fn).respond(200);

        timeout.flush();
        httpBackend.flush();        
    }     
    
    function getLogService(){
        return logService;
    }

    
    return {
        logService: getLogService,
        executeTest:executeTest
    };
 }