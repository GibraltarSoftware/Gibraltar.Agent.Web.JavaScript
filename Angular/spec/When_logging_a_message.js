describe('When logging a message', function() {
    var $scope, ctrl, logService;
    var sessionId = "angular-session-abc-123";
    var common = testCommon('testApp');

    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler) {
        logService = common.logService();
        $scope = $rootScope.$new();
        ctrl = $controller('TestCtrl', {
            $scope: $scope,
            $exceptionHandler: $exceptionHandler,
            logService: logService
        });
    }));

    it('Should POST to expected url',function() {
        common.executeTest($scope.logMessage(),
                           function(requestBody){
                                expect(requestBody).not.toEqual("");
                                return true;                               
                           });
    });

    it('Should have correct severity',function () {
        common.executeTest($scope.logMessage(),
                           function(requestBody){
                                var data = JSON.parse(requestBody);
                    
                                expect(data.logMessages[0].severity).toEqual(logService.logMessageSeverity.information);
                                return true;                          
                           });
    });

    it('Should have correct category', function () {
        common.executeTest($scope.logMessage(),
                           function(requestBody){
                                var data = JSON.parse(requestBody);
                    
                                expect(data.logMessages[0].category).toEqual("test");
                                return true;                             
                           });
    });

    it('Should have expected message', function () {
        common.executeTest($scope.logMessage("Test expected message"),
                           function(requestBody){
                                var data = JSON.parse(requestBody);
                    
                                expect(data.logMessages[0].caption).toEqual("Test expected message");
                                return true;                            
                           });
    });

    it('Should have expected message structure', function () {
        logService.setSessionId(sessionId);
        common.executeTest($scope.logMessage("Test expected message"),
                           function(requestBody){
                                var data = JSON.parse(requestBody);
                    
                                expect(data['session']).toBeDefined('session missing');
                                var session = data.session;
                                expect(session['client']).toBeDefined('client details missing');
                                checkClientMessageStructure(session.client);
                                
                                expect(data['logMessages']).toBeDefined('log messages missing');
                                checkMessageStructure(data.logMessages[0]);
                                
                                return true;                          
                           });
    });

    it('Should have time stamp', function () {
        common.executeTest($scope.logMessage("Test expected message"),
                           function(requestBody){
                                var partialTimeStamp = createTimeStamp();
                                var data = JSON.parse(requestBody);
                    
                                expect(data.logMessages[0].timeStamp).toContain(partialTimeStamp);
                                return true;                            
                           });
    });

    it('Should have sequence number', function () {
        common.executeTest($scope.logMessage("Test expected message"),
                           function(requestBody){
                                var data = JSON.parse(requestBody);
                    
                                expect(data.logMessages[0].sequence).not.toBeNull();
                                return true;                             
                           });
    });

    it('Should have session Id assigned to it', function () {
        logService.setSessionId(sessionId);
        common.executeTest($scope.logMessage("Test expected message"),
                           function(requestBody){
                                var data = JSON.parse(requestBody);
                    
                                expect(data.logMessages[0].sessionId).toEqual(sessionId);
                                return true;                            
                           });
    });    
    
    it('Should have agent session Id assigned to it', function () {
        var agentSessionId = logService.clientSessionHeader().headerValue;
        
        common.executeTest($scope.logMessage("Test expected message"),
                           function(requestBody){
                                var data = JSON.parse(requestBody);
                    
                                expect(data.logMessages[0].agentSessionId).toEqual(agentSessionId);
                                return true;                            
                           });
    });

    it('Should have method source info', function () {
        common.executeTest($scope.logMessage("Test expected message"),
                           function(requestBody){
                                var data = JSON.parse(requestBody);
                                var msi = data.logMessages[0].methodSourceInfo;
                                expect(msi.file).toEqual('app.js');
                                expect(msi.line).toEqual(10);
                                expect(msi.column).toEqual(15);
                                return true;                            
                           });
    });         
});