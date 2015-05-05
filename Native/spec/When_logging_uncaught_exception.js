﻿describe('When logging uncaught exception', function() {

    var xhr, requests;
    var sessionId = "session-456-def";
    
	beforeAll(function() {
        BrowserDetect.init();
    });
	
    beforeEach(function (done) {

        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        };

        loupe.agent.setSessionId(sessionId);
        createError();
        requestsComplete(done);

    });

    afterEach(function () {
        xhr.restore();
    });

    it('Should send to expected URL', function() {
        expect(requests[0].url).toBe(window.location.origin + '/loupe/log');
    });

    it('Should POST to server', function() {
        expect(requests[0].method).toBe('POST');
    });

    it('Should have expected message', function() {
        var body = JSON.parse(requests[0].requestBody);
        expect(body.logMessages[0].exception.message).toMatch(/Test Error/);
    });

    it('Should have expected structure', function () {
        var body = JSON.parse(requests[0].requestBody);     
        expect(body.session['client']).toBeDefined();
        
        checkClientMessageStructure(body.session.client);
        
        expect(body.logMessages[0]).toBeDefined();
        checkMessageStructure(body.logMessages[0]);
        
        checkExceptionStructure(body.logMessages[0].exception);           
    });

    function checkExceptionStructure(exception){
        expect(exception['message']).toBeDefined('exception message missing');
        expect(exception['url']).toBeDefined('exception url missing');
        expect(exception['stackTrace']).toBeDefined('exception stackTrace missing');
        expect(exception['cause']).toBeDefined('exception cause missing');
        expect(exception['line']).toBeDefined('exception line missing');    
    }

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

    function createError() {
        setTimeout(function () {
            throw new Error("Test Error");
        }, 5);
    }

    function requestsComplete(done) {
        if (requests.length > 0) {
            done();
        } else {
            setTimeout(requestsComplete, 10, done);
        }

    }
});