describe('When propagating error', function() {

    var xhr, requests;

    beforeEach(function(done) {

        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function(req) {
            requests.push(req);
        };

        gibraltar.agent.propagateOnError = true;
        spyOn(console, 'error');
        createSimpleError();
        requestComplete(done);
    });

    afterEach(function() {
        xhr.restore();
    });

    it('Should propagate error outside of agent', function() {
        expect(console.error).toHaveBeenCalled();
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
