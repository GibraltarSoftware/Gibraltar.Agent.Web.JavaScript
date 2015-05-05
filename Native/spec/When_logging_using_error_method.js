describe('When logging using error method', function () {

    var xhr, requests;
    var messageFn = new Messages();

    beforeEach(function () {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        messageFn.init(requests);
        xhr.onCreate = function(req) {
            requests.push(req);
        };
    });

    afterEach(function() {
        xhr.restore();
    });
	
    
    
    it('Should log severity level error', function(done) {
        loupe.agent.error('test', 'test logs message','test log description including parameter {0}',['test']);
        
        messageFn.waitToBeLogged(function(){
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].severity).toBe(loupe.logMessageSeverity.error);
            expect(body.logMessages[0].exception).toBeNull();
            expect(body.logMessages[0].details).toBeNull();
            done();
        });        
    });
    	
    it('Should log severity level error with exception', function(done) {
        var suppliedError = new Error("Custom error");
        loupe.agent.error('test', 'test logs message','test log description including parameter {0}',['test'], suppliedError);        
        
        messageFn.waitToBeLogged(function() {
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].exception).not.toBeNull();
            
            done();       
        });

    });    

    it('Should log severity level warning with details', function(done) {
        loupe.agent.error('test', 'test logs message','test log description including parameter {0}',['test'], null,"<data>test details</data>");

        messageFn.waitToBeLogged(function(){
            var body = messageFn.getRequestBody();
 
            expect(body.logMessages[0].details).toBe("<data>test details</data>");
            
            done();         
        });     
    });
   
});