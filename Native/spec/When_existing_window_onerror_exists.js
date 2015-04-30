describe('When existing window.onerror exists', function () {

    var xhr, requests;

    beforeEach(function (done) {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        };

        window.existingErrorHandlerCalled = false;

        createSimpleError();
        requestComplete(done);
    });

    afterEach(function () {
        xhr.restore();
    });

    it('Should call existing error handler', function () {
        expect(window.existingErrorHandlerCalled).toBe(true);
    });

    function createSimpleError() {
        setTimeout(function () {
            throw "Test Error";
        }, 5);

    }

    // we limit the number of times we call this
    // function to ensure don't just wait to hit
    // jasmine async timeout. 
    function requestComplete(done, beenCalled) {

        if (!beenCalled) {
            beenCalled = 1;
        } else {
            beenCalled++;
        }

        if (requests.length > 0 || beenCalled > 4) {
            done();
        } else {
            setTimeout(requestComplete, 10, done, beenCalled);
        }

    }

});