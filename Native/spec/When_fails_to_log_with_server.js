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
		
		loupe.information('test', 'test logs message','test log description');
       
		messageFn.waitToBeLogged(function() {    
            expect(localStorage.length).toEqual(1);
			
			done();
		});
		
	});
	
	it('Should send all messages in local storage', function(done){
		messageFn.setResponseCodes([200,200, 200]);
        for (var index = 0; index < 20; index++) {
            var message = {
                sequence: null
            };
            message.sequence = index
            
            localStorage.setItem("Loupe-message-" + index, JSON.stringify(message))
        }

		loupe.information('test', 'test logs message','test log description');

		messageFn.waitToBeLogged(function() {    
			expect(localStorage.length).toEqual(11);
			
			common.requests().length=0;

			messageFn.waitToBeLogged(function() {    
				expect(localStorage.length).toEqual(1);		
				common.requests().length=0;
				
				done();	
			});
		});		
	});

	
    it('Should only remove items from localStorage for loupe', function(done){
        localStorage.setItem("myItem","a value");
        localStorage.setItem("Loupe","user loupe value should not be removed");
        
		loupe.information('test', 'test logs message','test log description');

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