 function testCommon(moduleToLoad, url) {
    var expectedUrl = '/Loupe/Log';
    var logService;
    var httpBackend, timeout;
    var storageIsSupported = webStorageSupported();
   
    if(typeof moduleToLoad == "undefined"){
        throw 'No module specified to load, unable to execute specs';
    }

    beforeEach(function () {
        if(url){
            module(function ($provide) {
                $provide.factory('$location', function () {
                    return {
                        absUrl: function () { return url; }
                    }
                });
            });
        }
    });   
       
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
        return storageIsSupported;
    }
    
    function getHttpBackend(){
        return httpBackend;
    }
    
    return {
        logService: getLogService,
        executeTest:executeTest,
        storageSupported: getStorageIsSupported,
        httpBackend: getHttpBackend
    };
 }