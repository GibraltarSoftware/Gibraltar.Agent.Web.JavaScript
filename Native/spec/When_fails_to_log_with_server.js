describe("When fails to log with server", function(){
	
    var common = testCommon();
	
	if(!common.storageSupported()){
		pending("Tests not run as web storage is not supported");
	}
	
    var messageFn = new Messages();
	
    beforeEach(function () {
        messageFn.init(common.requests());
    });
	
	it('Should keep message in local storage', function(done){
		
		messageFn.setResponseCodes([500]);
		
		loupe.agent.information('test', 'test logs message','test log description');
       
		messageFn.waitToBeLogged(function() {    
            expect(localStorage.length).toEqual(1);
			
			done();
		});
		
	});
	
	it('Should send all messages in local storage', function(done){
		messageFn.setResponseCodes([500,200]);
		loupe.agent.information('test', '1st message');

		messageFn.waitToBeLogged(function() {    
			expect(localStorage.length).toEqual(1);
			common.requests().length=0;

			loupe.agent.information('test', '2nd message');
			
			messageFn.waitToBeLogged(function() {    
	            var data = messageFn.getRequestBody();
				
				expect(data.logMessages.length).toEqual(2);
				
				expect(data.logMessages[0].caption).toEqual('1st message');
				expect(data.logMessages[1].caption).toEqual('2nd message');
				
				done();
			});			
		});
			

	});
	
    it('Should only remove items from localStorage for loupe', function(done){
        localStorage.setItem("myItem","a value");
        localStorage.setItem("Loupe","user loupe value should not be removed");
        
		loupe.agent.information('test', 'test logs message','test log description');

		messageFn.waitToBeLogged(function() {    
            expect(localStorage.length).toEqual(2);
			var myItem = localStorage.getItem("myItem");
			expect(myItem).not.toBeNull();
			
			var userLoupeItem = localStorage.getItem("Loupe");
			expect(userLoupeItem).not.toBeNull();
			done();
		});
    });	
	
	afterEach(function(){
		localStorage.clear();
		console.log("afterEach - storage count: " + localStorage.length);
	});
});