describe('When_logging_messages', function () {

    var xhr, requests;


    beforeEach(function (done) {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function(req) {
            requests.push(req);
        };
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
        console.info(body.logMessages[0].timeStamp);
        expect(body.logMessages[0].timeStamp).toContain(partialTimeStamp);
    });

    function log() {
        loupe.agent.log(loupe.logMessageSeverity.information, 'test', 'test logs message','test log description including parameter {0}',['test'], 'with details');
    }

    function requestComplete(done) {
        if (requests.length > 0) {
            done();
        } else {
            setTimeout(requestComplete, 10, done);
        }
        
    }

});