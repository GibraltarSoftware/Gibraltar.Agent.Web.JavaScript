function FakeConsole(){
    
    var self = this;
    
    self.msgs= [];
    
    function log(msg){
        self.msgs.push(msg);      
    }
    
    function getMsgs(){
        return self.msgs;
    }
    
    function clearMsgs(){
        self.msgs.length=0;
    }
    
    return {
        log: log,
        getMsgs: getMsgs,
        clearMsgs: clearMsgs
    }
};

describe('When setting authorization header', function() {

    var common = testCommon();
	var fake = new FakeConsole();
    var existingConsole = window.console;
    
    beforeAll(function(){
        window.console = fake;
    });
    
    it('Should write failure to console if no header provided', function() {
        loupe.setAuthorizationHeader();
        var msgs= fake.getMsgs();
        expect(msgs[0]).toEqual("setAuthorizationHeader failed. No header object provided") ;
    });    
    
    it('Should write failure to console if header is incorrect format', function() {
        loupe.setAuthorizationHeader({name:'me'});
        var msgs= fake.getMsgs();
        expect(msgs[0]).toEqual("setAuthorizationHeader failed. The header provided appears invalid as it doesn't have name & value") ;
    });    
    
    it('Should not write failure to console if header is correct', function() {
        loupe.setAuthorizationHeader({name:'Authorization', value: 'abc'});
        var msgs= fake.getMsgs();
        expect(msgs.length).toEqual(0) ;
    });   
    
    afterEach(function(){
        fake.clearMsgs();
    });
    
    afterAll(function(){
        window.console = existingConsole;
    });
});

