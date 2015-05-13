describe('When application starts', function () {

    it('Should have an agent created', function() {
        expect(loupe).not.toBeUndefined();
    });
    
    it('Should have client session header', function(){
        var headerObject = loupe.clientSessionHeader();
        expect(headerObject).not.toBeNull();
        expect(headerObject.headerName).toEqual("loupe-client-session");
        expect(headerObject.headerValue).not.toEqual(""); 
    });
});