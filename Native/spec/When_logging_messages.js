describe('When_logging_messages', function () {

    var xhr, requests;
    var sessionId = "session-123-abc";
    
    var common = testCommon();
    
    beforeEach(function (done) {
        loupe.setSessionId(sessionId);
        log();
        common.requestComplete(done);
    });

    it('Should make request to correct url', function() {
        var requests = common.requests();
        expect(requests[0].url).toBe(window.location.origin + '/loupe/log');
    });

    it('Should post request', function() {
        var requests = common.requests();
        expect(requests[0].method).toBe('POST');
        expect(requests[0].url).toBe(window.location.origin + '/loupe/log');
    });


    it('Should log severity level information', function() {

        var body = common.requestBody();

        expect(body.logMessages[0].severity).toBe(loupe.logMessageSeverity.information);
    });

    it('Should have expected message structure', function(){
       var body =common.requestBody();
        expect(body['session']).toBeDefined();
        expect(body['logMessages']).toBeDefined();
        
        expect(body.session['client']).toBeDefined();
        expect(body.session.currentAgentSessionId).toBeDefined();
        
        checkClientMessageStructure(body.session.client);
        
        expect(body.logMessages[0]).toBeDefined();
        checkMessageStructure(body.logMessages[0]);
        
    });

    it('Should have current agent session Id', function () {
        var body =common.requestBody();
        var agentSessionId = loupe.clientSessionHeader().headerValue;
        
        expect(body.session.currentAgentSessionId).toEqual(agentSessionId);
    });

    it('Should have timestamp', function(){
        var partialTimeStamp = createTimeStamp();
        
        var body =common.requestBody();
        
        expect(body.logMessages[0].timeStamp).toContain(partialTimeStamp);
    });

    it('Should have sequence number', function(){
        var body =common.requestBody(); 
        expect(body.logMessages[0].sequence).not.toBeNull();
    });

    it('Should have client assigned session id', function(){
        var body = common.requestBody(); 
        expect(body.logMessages[0].sessionId).toEqual(sessionId);        
    })

    it('Should have agent assigned session id', function(){
        var body = common.requestBody(); 
        var agentSessionId = loupe.clientSessionHeader().headerValue;
        expect(body.logMessages[0].agentSessionId).toEqual(agentSessionId);        
    })

    it('Should have expected method source info', function () {
       var body = common.requestBody(); 
       var msi = body.logMessages[0].methodSourceInfo;
       expect(msi).not.toBeUndefined();
       expect(msi.file).toEqual('a file');
       expect(msi.method).toEqual('theFunction');
       expect(msi.line).toEqual(18);
       expect(msi.column).toEqual(1);
    });

    function log() {
        
        var methodSourceInfo = new loupe.MethodSourceInfo('a file','theFunction',18,1);

        loupe.write(loupe.logMessageSeverity.information, 'test', 'test logs message','test log description including parameter {0}',['test'],null, 'with details', methodSourceInfo);
    }
    
});