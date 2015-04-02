describe('When_logging_simple_uncaught_error', function () {

    var xhr, requests;


    beforeEach(function (done) {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function(req) {
            requests.push(req);
        };
        createSimpleError();
        requestComplete(done);
    });

    afterEach(function() {
        xhr.restore();
    });


    it('Should POST request to correct url', function () {

        var body = JSON.parse(requests[0].requestBody);

        expect(requests[0].url).toBe(window.location.origin + '/Gibraltar/Log/Exception');
        expect(requests[0].method).toBe('POST');
        expect(body.Message).toBe("uncaught exception: Test Error");
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