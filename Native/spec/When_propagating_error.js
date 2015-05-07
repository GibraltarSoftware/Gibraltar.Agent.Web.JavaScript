describe('When propagating error', function() {

    var common = testCommon();

    var existingOnError;

    beforeAll(function(){
        existingOnError = window.onerror;
        window.postErrorHandlerCalled = false;
        
        window.onerror = function() { 
            
            if(existingOnError){
                 existingOnError.apply(this, arguments);
            }
            
            window.postErrorHandlerCalled = true;
        };
    });

    beforeEach(function(done) {
        loupe.agent.propagateOnError = true;
        createSimpleError();
        common.requestComplete(done);
    });

    afterEach(function() {
        window.onerror = existingOnError;
    });

    it('Should propagate error outside of agent', function() {
        expect(window.postErrorHandlerCalled).toEqual(true) ;
    });


    function createSimpleError() {
        setTimeout(function() {
            throw "Test Error";
        }, 5);
    }
});
