describe('When_user_is_handling_error', function () {

    var common = testCommon();

    it('Should_call_users_catch_not_loupe', function (done) {

        try {
            throw "Expect Catch";
        } catch (e) {
            expect(e).toBe('Expect Catch');
        }

        common.requestComplete(done);
        expect(common.requests().length).toBe(0);

    });
});