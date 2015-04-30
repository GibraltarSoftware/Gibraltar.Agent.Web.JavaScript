describe('When logging exception', function() {

    var xhr, requests;

	beforeAll(function() {
        BrowserDetect.init();
    });
	
    beforeEach(function (done) {

        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        };

        createError();
        requestsComplete(done);

    });

    afterEach(function () {
        xhr.restore();
    });

    it('Should send to expected URL', function() {
        expect(requests[0].url).toBe(window.location.origin + '/loupe/log');
    });

    it('Should POST to server', function() {
        expect(requests[0].method).toBe('POST');
    });

    it('Should have expected message', function() {
		console.log(BrowserDetect.browser);
        var body = JSON.parse(requests[0].requestBody);
        expect(body.Message).toMatch(/Test Error/);
    });

    function createError() {
        setTimeout(function () {
            throw new Error("Test Error");
        }, 5);

    }

    function requestsComplete(done) {
        if (requests.length > 0) {
            done();
        } else {
            setTimeout(requestsComplete, 10, done);
        }

    }
});