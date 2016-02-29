describe('When message too large', function(){
    var maxRequestSize = 204800;
    var common = testCommon();

	if(!common.storageSupported()){
		pending("Tests not run as web storage is not supported");
	}

    beforeEach(function () {
        jasmine.clock().install();
    });

	afterEach(function(){
		localStorage.clear();
        jasmine.clock().uninstall();
	});
        
    it('Should strip details', function(done){
        
        var overlargeDetails = '';
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeDetails = overlargeDetails + "M";
        }
         
        loupe.information('test', 'oversize details','testing logging with oversize details', null, null, overlargeDetails);
        jasmine.clock().tick(10);
                        
        var body = common.requestBody();                             

        expect(body.logMessages[0].details).toEqual('{"message":"User supplied details truncated as log message exceeded maximum size."}');
        
        done();

               
	});
    
    it('Should drop message if oversized and cannot reduce size', function(done){
        
        var overlargeMethod;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeMethod = overlargeMethod + "M";
        }
        
        var invalidMethodSourceInfo = new loupe.MethodSourceInfo("app.js", overlargeMethod);
        
        loupe.information('test', 'oversize details','testing logging with oversize details', null, null, null, invalidMethodSourceInfo);        
        
        jasmine.clock().tick(10);
        
        // check we had no requests to send
        expect(common.requests.length).toEqual(0);
        
        done();
    });
    
    it('Should create message stating a message has been dropped', function(done){
        
        var overlargeMethod;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeMethod = overlargeMethod + "M";
        }
        
        var invalidMethodSourceInfo = new loupe.MethodSourceInfo("app.js", overlargeMethod);
        
        loupe.information('test', 'oversize details','testing logging with oversize details',null,null, null, invalidMethodSourceInfo);

        jasmine.clock().tick(10);
       
        expect(localStorage.length).toEqual(1);
        
        var message = getLoupeMessagesFromLocalStorage()[0]
        expect(message.caption).toEqual("Dropped message");        
        
        done();        
    });
    
    it('Should include caption & description from the dropped message', function(done){
        
        var overlargeMethod;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeMethod = overlargeMethod + "M";
        }
        
        var invalidMethodSourceInfo = new loupe.MethodSourceInfo("app.js", overlargeMethod);
        
        loupe.information('test', 'oversize details','testing logging with oversize details',null,null, null,  invalidMethodSourceInfo);

        jasmine.clock().tick(10);

        expect(localStorage.length).toEqual(1);
        
        var message = getLoupeMessagesFromLocalStorage()[0]
        expect(message.caption).toEqual("Dropped message");
        expect(message.description).toContain("{0}")
        expect(message.description).toContain("{1}")
        expect(message.parameters[0]).toEqual("oversize details");
        expect(message.parameters[1]).toEqual("testing logging with oversize details");

        
        done();
    });
    
    
    it('Should include caption from the dropped message if description is too large', function(){
        
        var overlargeDescription;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeDescription = overlargeDescription + "M";
        }
       
        
        loupe.information('test', 'oversize details',overlargeDescription);
        jasmine.clock().tick(10);

        expect(localStorage.length).toEqual(1);
        
        var message = getLoupeMessagesFromLocalStorage()[0]
        expect(message.caption).toEqual("Dropped message");
        expect(message.description).toContain("{0}")
        expect(message.parameters[0]).toEqual("oversize details");
        
    });         
    
    it('Should not include any details from the dropped message', function(){
        
        var overlargeCaption;
        for (var index = 0; index < maxRequestSize; index++) {
            overlargeCaption = overlargeCaption + "M";
        }
        
        loupe.information('test', overlargeCaption,'testing logging with oversize details');
        jasmine.clock().tick(10);
        expect(localStorage.length).toEqual(1);
        
        var message = getLoupeMessagesFromLocalStorage()[0]
        expect(message.caption).toEqual("Dropped message");
        expect(message.description).toContain("Unable to log caption or description as they exceed max request size");
        
    });         
    
});