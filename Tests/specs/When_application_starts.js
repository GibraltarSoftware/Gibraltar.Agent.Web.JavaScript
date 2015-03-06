describe('When application starts', function() {

    it('Should have an agent created', function() {
        expect(gibraltar.agent).not.toBeUndefined();
    });
});