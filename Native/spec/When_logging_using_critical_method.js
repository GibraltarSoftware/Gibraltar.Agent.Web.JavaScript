describe('When logging using critical method', function () {

    var common = testCommon();
    var messageFn = new Messages();

    beforeEach(function () {
        messageFn.init(common.requests());
    });
    
    it('Should log severity level critical', function(done) {
        loupe.critical('test', 'test logs message','test log description including parameter {0}',['test']);
        
        messageFn.waitToBeLogged(function(){
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].severity).toBe(loupe.logMessageSeverity.critical);
            expect(body.logMessages[0].exception).toBeNull();
            expect(body.logMessages[0].details).toBeNull();
            done();
        });        
    });
    	
    it('Should log severity level critical with exception', function(done) {
        var suppliedError = new Error("Custom error");
        loupe.critical('test', 'test logs message','test log description including parameter {0}',['test'], suppliedError);        
        
        messageFn.waitToBeLogged(function() {
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].exception).not.toBeNull();
            
            done();       
        });

    });    

    it('Should log severity level critical with string passed for exception', function(done) {
        loupe.critical('test', 'test logs message','test log description including parameter {0}',['test'], "Custom error");        
        
        messageFn.waitToBeLogged(function() {
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].exception).not.toBeNull();
            
            done();       
        });

    });    

    it('Should log severity level critical with details', function(done) {
        loupe.critical('test', 'test logs message','test log description including parameter {0}',['test'], null,"<data>test details</data>");

        messageFn.waitToBeLogged(function(){
            var body = messageFn.getRequestBody();
 
            expect(body.logMessages[0].details).toBe("<data>test details</data>");
            
            done();         
        });     
    });
   
});