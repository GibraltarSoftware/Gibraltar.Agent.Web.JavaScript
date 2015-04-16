describe('When_user_is_handling_error', function () {

    var xhr, requests;

    beforeEach(function () {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        };
    });


    afterEach(function () {
        xhr.restore();
    });

    it('Should_call_users_catch_not_loupe', function (done) {

        try {
            throw "Expect Catch";
        } catch (e) {
            expect(e).toBe('Expect Catch');
        }

        requestComplete(done);
        expect(requests.length).toBe(0);

    });

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