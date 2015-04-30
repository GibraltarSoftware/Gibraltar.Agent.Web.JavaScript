describe('When logging client details', function() {

    var xhr, requests;
    var clientDetails;

    beforeEach(function(done) {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        };

        createError();
        requestsComplete(done);

    });

    beforeEach(function() {
        clientDetails = getClientDetails();
    });

    it('Should have client details', function() {
        var body = JSON.parse(requests[0].requestBody);
        expect(body.Details).not.toEqual("");
    });

    it('Should have size information', function() {

        var expectedWidth = window.innerWidth || document.body.clientWidth;
        var expectedHeight = window.innerHeight || document.body.clientHeight;

        expect(clientDetails.size).not.toBeUndefined();
        expect(clientDetails.size.width).toEqual(expectedWidth);
        expect(clientDetails.size.height).toEqual(expectedHeight);
    });


    it('Should have description', function() {
        expect(clientDetails.description).toEqual(platform.description);
    });

    it('Should have user agent details', function () {
        expect(clientDetails.ua).toEqual(platform.ua);
    });

    it('Should have browser name', function () {
        expect(clientDetails.name).not.toEqual("");
        expect(clientDetails.name).toEqual(platform.name);
    });

    it('Should have browser version', function () {
        expect(clientDetails.version).not.toEqual("");
        expect(clientDetails.version).toEqual(platform.version);
    });

    it('Should have os details', function() {
        var expectedOS = platform.os;
        var agentOS = clientDetails.os;

        expect(agentOS.architecture).toEqual(expectedOS.architecture);
        expect(agentOS.family).toEqual(expectedOS.family);
        expect(agentOS.version).toEqual(expectedOS.version);
    });

    function getClientDetails() {
        var body = JSON.parse(requests[0].requestBody);
        return body.session.client;
    }

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