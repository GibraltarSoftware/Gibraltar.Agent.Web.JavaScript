describe('When logging using error method', function () {

    var common = testCommon();
    var messageFn = new Messages();

    beforeEach(function () {
        messageFn.init(common.requests());
    });
	
    
    it('Should log severity level error', function(done) {
        loupe.error('test', 'test logs message','test log description including parameter {0}',['test']);
        
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
        loupe.error('test', 'test logs message','test log description including parameter {0}',['test'], suppliedError);        
        
        messageFn.waitToBeLogged(function() {
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].exception).not.toBeNull();
            expect(body.logMessages[0].exception.message).toEqual('Custom error');            
            done();       
        });

    });    

    it('Should log severity level error with string passed for exception', function(done) {
        loupe.error('test', 'test logs message','test log description including parameter {0}',['test'], "Custom error");        
        
        messageFn.waitToBeLogged(function() {
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].exception).not.toBeNull();
            
            done();       
        });

    }); 

    it('Should log severity level warning with details', function(done) {
        loupe.error('test', 'test logs message','test log description including parameter {0}',['test'], null,"<data>test details</data>");

        messageFn.waitToBeLogged(function(){
            var body = messageFn.getRequestBody();
 
            expect(body.logMessages[0].details).toBe("<data>test details</data>");
            
            done();         
        });     
    });
   
});