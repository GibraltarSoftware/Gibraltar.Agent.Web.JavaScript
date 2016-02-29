function testCommon() {
	var xhr, requests;
    var responseCodes =[];
    var storageIsSupported = webStorageSupported();
    
    beforeAll(function(){
        if(storageIsSupported){
            localStorage.clear(); 
        }
    });	
	
    beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        };
	});	
	
    afterEach(function() {
        xhr.restore();
    });	
	
	afterEach(function(){
        if(storageIsSupported){
		  expect(localStorage.length).toEqual(0, "Local storage not cleared of messages");
        }
	});
    
    function requestComplete(done, beenCalled) {
        if (!beenCalled) {
            beenCalled = 1;
        } else {
            beenCalled++;
        }

        // we check if we have a reqeust or exceeded number
        // of times we should be called
        if (requests.length > 0 || beenCalled > 4) {
            if(requests.length){
                var code = 204;
                
                if(responseCodes.length){
                    code = responseCodes.shift();
                }
                
                requests[0].respond(code);
            }
            
            done();
        } else {
            // no requests & not hit max number of times
            // called so use setTimeout to wait 10 ms
            setTimeout(requestComplete, 10, done, beenCalled);
        }
    }    
    
    function getRequests(){
        return requests;
    }
    
    function getRequestBody(){
        return JSON.parse(requests[0].requestBody);
    }
    
    function setResponseCodes(codes){
        responseCodes = codes;
    }
    
    function getStorageSupported(){
        return storageIsSupported;        
    }
    
    function clearRequests(){
        requests.length = 0;
    }
    
    return {
        requestComplete: requestComplete,
        requests: getRequests,
        requestBody: getRequestBody,
        setResponseCodes: setResponseCodes,
        storageSupported: getStorageSupported,
        clearRequests: clearRequests
    };
}