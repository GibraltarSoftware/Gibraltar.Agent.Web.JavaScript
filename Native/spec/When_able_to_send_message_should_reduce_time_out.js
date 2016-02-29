describe('When able to send message should reduce time out', function(){
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
        expect(localStorage.length).toEqual(0);
		localStorage.clear();
        jasmine.clock().uninstall();
	});    
    
    it('Should step back down from 100ms', function(done){
       messageFn.setResponseCodes([0]);
       logMessages([10,100, 10], function(){
            var body = messageFn.getRequestBody();
                expect(body.logMessages.length).toEqual(2);
                done();                   
       });

    });
    
    it('Should step back down from 1 sec', function(done){
       messageFn.setResponseCodes([0, 0]);
       
       logMessages([10, 100, 1000, 100, 10], function(){
            var body = messageFn.getRequestBody();
                expect(body.logMessages.length).toEqual(3);
                done();                   
       });
      
    });    
    
    it('Should step back down from 10 seconds', function(done){
       messageFn.setResponseCodes([0, 0, 0]);

       logMessages([10,100, 1000, 10000, 1000, 100, 10], function(){
            var body = messageFn.getRequestBody();
                expect(body.logMessages.length).toEqual(4);
                done();                   
       });
      
    });   

    it('Should step back down from 30 secs', function(done){
       messageFn.setResponseCodes([0, 0, 0, 0]);

       logMessages([10,100, 1000, 10000, 30000, 10000, 1000, 100, 10], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(5);
                done();                   
       });
      
    });       
    
    it('Should step back down from 60 secs', function(done){
       messageFn.setResponseCodes([0, 0, 0, 0, 0]);

       logMessages([10,100, 1000, 10000, 30000, 60000, 30000, 10000, 1000, 100, 10], function(){
            var body = messageFn.getRequestBody();
                
                expect(body.logMessages.length).toEqual(6);
                done();                   
       });
    });        
    
    
    it('Should step back down from 120 secs', function(done){
       messageFn.setResponseCodes([0, 0, 0, 0, 0, 0]);
       logMessages([10,100, 1000, 10000, 30000, 60000, 120000, 60000, 30000, 10000, 1000, 100, 10], function(){
            var body = messageFn.getRequestBody();
                expect(body.logMessages.length).toEqual(7);
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
                //expect(localStorage.length).toEqual(messagesLogged);
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