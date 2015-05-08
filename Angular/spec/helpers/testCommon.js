 function testCommon(moduleToLoad) {
    var expectedUrl = '/Loupe/Log';
    var logService;
    var httpBackend, timeout;
    var getStorageIsSupported = webStorageSupported();
   
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
    
	afterEach(function(){
        if(getStorageIsSupported){
		  expect(localStorage.length).toEqual(0, "Local storage not cleared of messages");
        }
	});    
    
   function executeTest(logFn, fn, responseCode){
       if(typeof responseCode == "undefined"){
           responseCode = 204;
       };
       
        httpBackend.expectPOST(expectedUrl, fn).respond(responseCode);

        timeout.flush();
        httpBackend.flush();        
    }     
    
    function getLogService(){
        return logService;
    }

    function getStorageIsSupported(){
        return getStorageIsSupported;
    }
    
    return {
        logService: getLogService,
        executeTest:executeTest,
        storageSupported: getStorageIsSupported
    };
 }