describe('When unable to send message should back off', function(){
    var common = testCommon();
    var messageFn = new Messages();
    var messagesLogged;
    
	if(!common.storageSupported()){
		pending("Tests not run as web storage is not supported");
	}
    
    beforeEach(function () {
        loupe.resetMessageDelay();
        messageFn.init(common.requests());
        jasmine.clock().install();
        messagesLogged = 0;
    });

	afterEach(function(){
		localStorage.clear();
        jasmine.clock().uninstall();
	});    
    
    it('Should back off for 100ms on first failure', function(done){
       messageFn.setResponseCodes([0]);
       logMessages([10,100], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(1);
                expect(localStorage.length).toEqual(1);
                done();                   
       });

    });
    
    it('Should back off for 1 sec on second failure', function(done){
       messageFn.setResponseCodes([0, 0]);
       
       logMessages([10, 100, 1000], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(1);
                expect(localStorage.length).toEqual(2);
                done();                   
       });
      
    });    
    
    it('Should back off for 10 seconds on third failure', function(done){
       messageFn.setResponseCodes([0, 0, 0]);

       logMessages([10,100, 1000, 10000], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(1);
                expect(localStorage.length).toEqual(3);
                done();                   
       });
      
    });   

    it('Should back off for 30 secs on fourth failure', function(done){
       messageFn.setResponseCodes([0, 0, 0, 0]);

       logMessages([10,100, 1000, 10000, 30000], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(1);
                expect(localStorage.length).toEqual(4);
                done();                   
       });
      
    });       
    
    it('Should back off for 60 secs on fifth failure', function(done){
       messageFn.setResponseCodes([0, 0, 0, 0, 0]);

       logMessages([10,100, 1000, 10000, 30000, 60000], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(1);
                expect(localStorage.length).toEqual(5);
                done();                   
       });
    });        
    
    
    it('Should back off for 120 secs on sixth failure', function(done){
       messageFn.setResponseCodes([0, 0, 0, 0, 0, 0]);
       logMessages([10,100, 1000, 10000, 30000, 60000,120000], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(1);
                expect(localStorage.length).toEqual(6);
                done();                   
       });
    });        
        
    it('Should back off for 240 secs on seventh failure', function(done){
       messageFn.setResponseCodes([0, 0, 0, 0, 0, 0, 0]);
       logMessages([10,100, 1000, 10000, 30000, 60000,120000, 240000], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(1);
                expect(localStorage.length).toEqual(7);
                done();                   
       });
    });           
    
    it('Should back off for 480 secs on eigth failure', function(done){
       messageFn.setResponseCodes([0, 0, 0, 0, 0, 0, 0, 0]);
       logMessages([10,100, 1000, 10000, 30000, 60000,120000, 240000, 480000], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(1);
                expect(localStorage.length).toEqual(8);
                done();                   
       });
    });           
        
    it('Should back off for 960 secs on ninth failure', function(done){
       messageFn.setResponseCodes([0, 0, 0, 0, 0, 0, 0, 0, 0]);
       logMessages([10,100, 1000, 10000, 30000, 60000,120000, 240000, 480000, 960000], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(1);
                expect(localStorage.length).toEqual(9);
                done();                   
       });
    });            
    
    it('Should stay at 960 secs on tenth failure', function(done){
       messageFn.setResponseCodes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
       logMessages([10,100, 1000, 10000, 30000, 60000,120000, 240000, 480000, 960000, 960000], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(1);
                expect(localStorage.length).toEqual(10);
                done();                   
       });
    });                
    
    function logMessages(ticks, callback){
        
        if(messagesLogged < ticks.length){
          
          // we may need to move clock on so we don't hit
          // the debounce logic
          if(ticks[messagesLogged] < 500){
            jasmine.clock().tick(500);  
          }
          
          loupe.information('test','message ' + messagesLogged,'testing delays');
        
          messageFn.waitToBeLogged(function(){
                                  
            messagesLogged++;

            if(messagesLogged < ticks.length){
                expect(localStorage.length).toEqual(messagesLogged);
                common.clearRequests();
            }
               
            logMessages(ticks, callback)
            
          });
          
          // tick over so log message sent
          jasmine.clock().tick(ticks[messagesLogged]);          
        } else {
            callback();
        }
        
    }
    
});