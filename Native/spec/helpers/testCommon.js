function testCommon() {
	var xhr, requests;
    var responseCodes =[];
    
    beforeAll(function(){
       localStorage.clear(); 
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
		expect(localStorage.length).toEqual(0, "Local storage not cleared of messages");
	});
    
    function requestComplete(done, beenCalled) {
        if (!beenCalled) {
            beenCalled = 1;
        } else {
            beenCalled++;
        }

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
    
    return {
        requestComplete: requestComplete,
        requests: getRequests,
        requestBody: getRequestBody,
        setResponseCodes: setResponseCodes
    };
}