describe('When propagating error', function() {

    var xhr, requests, existingOnError;

    beforeEach(function(){
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

        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function(req) {
            requests.push(req);
        };

        loupe.agent.propagateOnError = true;
        spyOn(console, 'error');
        createSimpleError();
        requestComplete(done);
    });

    afterEach(function() {
        xhr.restore();
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

    function requestComplete(done) {
        if (requests.length > 0) {
            done();
        } else {
            setTimeout(requestComplete, 10, done);
        }
    }
});
