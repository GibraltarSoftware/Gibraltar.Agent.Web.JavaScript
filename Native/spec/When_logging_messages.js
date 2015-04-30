describe('When_logging_messages', function () {

    var xhr, requests;


    beforeEach(function (done) {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function(req) {
            requests.push(req);
        };
        log();
        requestComplete(done);
    });

    afterEach(function() {
        xhr.restore();
    });


    it('Should make request to correct url', function() {
        expect(requests[0].url).toBe(window.location.origin + '/Gibraltar/Log/Message');
    });

    it('Should post request', function() {
        expect(requests[0].method).toBe('POST');
        expect(requests[0].url).toBe(window.location.origin + '/Gibraltar/Log/Message');
    });


    it('Should log severity level information', function() {

        var body = JSON.parse(requests[0].requestBody);

        expect(body.Severity).toBe(gibraltar.logMessageSeverity.information);
    });

    function log() {
        gibraltar.agent.log(gibraltar.logMessageSeverity.information, 'test', 'test logs message');
    }

    function requestComplete(done) {
        if (requests.length > 0) {
            done();
        } else {
            setTimeout(requestComplete, 10, done);
        }
        
    }

});