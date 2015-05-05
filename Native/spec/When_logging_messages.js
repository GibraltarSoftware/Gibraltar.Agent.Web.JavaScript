describe('When_logging_messages', function () {

    var xhr, requests;
    var sessionId = "session-123-abc";

    beforeEach(function (done) {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function(req) {
            requests.push(req);
        };
        loupe.agent.setSessionId(sessionId);
        log();
        requestComplete(done);
    });

    afterEach(function() {
        xhr.restore();
    });


    it('Should make request to correct url', function() {
        expect(requests[0].url).toBe(window.location.origin + '/loupe/log');
    });

    it('Should post request', function() {
        expect(requests[0].method).toBe('POST');
        expect(requests[0].url).toBe(window.location.origin + '/loupe/log');
    });


    it('Should log severity level information', function() {

        var body = JSON.parse(requests[0].requestBody);

        expect(body.logMessages[0].severity).toBe(loupe.logMessageSeverity.information);
    });

    it('Should have expected message structure', function(){
       var body = JSON.parse(requests[0].requestBody);
        expect(body['session']).toBeDefined();
        expect(body['logMessages']).toBeDefined();
        
        expect(body.session['client']).toBeDefined();
        
        checkClientMessageStructure(body.session.client);
        
        expect(body.logMessages[0]).toBeDefined();
        checkMessageStructure(body.logMessages[0]);
        
    });

    it('Should have timestamp', function(){
        var partialTimeStamp = createTimeStamp();
        
        var body = JSON.parse(requests[0].requestBody);
        
        expect(body.logMessages[0].timeStamp).toContain(partialTimeStamp);
    });

    it('Should have sequence number', function(){
        var body = JSON.parse(requests[0].requestBody); 
        expect(body.logMessages[0].sequence).not.toBeNull();
    });

    it('Should have client assigned session id', function(){
        var body = JSON.parse(requests[0].requestBody); 
        expect(body.session.sessionId).toEqual(sessionId);        
    })

    function log() {
        loupe.agent.write(loupe.logMessageSeverity.information, 'test', 'test logs message','test log description including parameter {0}',['test'],null, 'with details');
    }

    function requestComplete(done) {
        if (requests.length > 0) {
            done();
        } else {
            setTimeout(requestComplete, 10, done);
        }
        
    }

});