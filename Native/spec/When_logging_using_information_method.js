describe('When logging using information methods', function () {

    var common = testCommon();
    var messageFn = new Messages();

    beforeEach(function () {
        messageFn.init(common.requests());
    });
    
    it('Should log severity level information', function(done) {
        loupe.agent.information('test', 'test logs message','test log description including parameter {0}',['test']);
        
        messageFn.waitToBeLogged(function(){
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].severity).toBe(loupe.logMessageSeverity.information);
            done();
        });        
    });
    	
    it('Should log severity level information with exception', function(done) {
        var suppliedError = new Error("Custom error");
        loupe.agent.information('test', 'test logs message','test log description including parameter {0}',['test'], suppliedError);        
        
        messageFn.waitToBeLogged(function() {
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].exception).not.toBeNull();
            
            done();       
        });

    });    

    it('Should log details', function(done) {
        loupe.agent.information('test', 'test logs message','test log description including parameter {0}',['test'], null,"<data>test details</data>");

        messageFn.waitToBeLogged(function(){
            var body = messageFn.getRequestBody();
 
            expect(body.logMessages[0].details).toBe("<data>test details</data>");
            
            done();         
        });     
    });
   
});