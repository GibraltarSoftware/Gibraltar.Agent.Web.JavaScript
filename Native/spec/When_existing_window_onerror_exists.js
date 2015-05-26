describe('When existing window.onerror exists', function () {

    var common = testCommon();

    beforeEach(function (done) {
        window.existingErrorHandlerCalled = false;

        createSimpleError();
        common.requestComplete(done);
    });

    it('Should call existing error handler', function () {
        expect(window.existingErrorHandlerCalled).toBe(true);
    });

    function createSimpleError() {
        setTimeout(function () {
            throw "Test Error";
        }, 5);

    }

});