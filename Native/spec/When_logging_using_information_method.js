describe('When logging using information methods', function () {

    var common = testCommon();
    var messageFn = new Messages();

    beforeEach(function () {
        messageFn.init(common.requests());
    });
    
    it('Should log severity level information', function(done) {
        loupe.information('test', 'test logs message','test log description including parameter {0}',['test']);
        
        messageFn.waitToBeLogged(function(){
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].severity).toBe(loupe.logMessageSeverity.information);
            done();
        });        
    });
    	
    it('Should log severity level information with exception', function(done) {
        var suppliedError = new Error("Custom error");
        loupe.information('test', 'test logs message','test log description including parameter {0}',['test'], suppliedError);        
        
        messageFn.waitToBeLogged(function() {
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].exception).not.toBeNull();
            
            done();       
        });

    });    

    it('Should log severity level information with string passed for exception', function(done) {
        loupe.information('test', 'test logs message','test log description including parameter {0}',['test'], "Custom error");        
        
        messageFn.waitToBeLogged(function() {
            var body = messageFn.getRequestBody();

            expect(body.logMessages[0].exception).not.toBeNull();
            
            done();       
        });

    }); 

    it('Should log details', function(done) {
        loupe.information('test', 'test logs message','test log description including parameter {0}',['test'], null,"<data>test details</data>");

        messageFn.waitToBeLogged(function(){
            var body = messageFn.getRequestBody();
 
            expect(body.logMessages[0].details).toBe("<data>test details</data>");
            
            done();         
        });     
    });
   
   it('Should log method source using data it has', function(done){
       loupe.information('test', 'test logs message','test log description including parameter {0}',['test'], null,"<data>test details</data>", {file:'app.js', method: 'theFunction'});
       
        messageFn.waitToBeLogged(function(){
            var body = messageFn.getRequestBody();
 
            expect(body.logMessages[0].methodSourceInfo.file).toBe("app.js");
            expect(body.logMessages[0].methodSourceInfo.method).toBe("theFunction");
            
            done();         
        });         
   });
   
});