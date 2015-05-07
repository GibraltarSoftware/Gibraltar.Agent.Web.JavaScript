describe('When an exception occurs', function() {
    var $scope, ctrl, logService;
    var sessionId = 'angular-session-def-456';
 
     var common = testCommon();   
 
    beforeAll(function() {

        module(function($provide) {
            $provide.factory('$location', function() {
                return {
                    absUrl: function () {return '/'}
                }
            })
        });

    });
       
    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler, $route, $location) {
        logService = common.logService();
        $scope = $rootScope.$new();
        $location.absUrl('/');
        $route.current = {
            $$route: {
                controller: 'TestCtrl'
            },
            loadedTemplateUrl: '/'
        };

        ctrl = $controller('TestCtrl', {
            $scope: $scope,
            $exceptionHandler: $exceptionHandler,
            logService: logService
        });
    }));


    it('should log simple error', inject(function ($exceptionHandler) {
        common.executeTest($exceptionHandler('Simple Error'),
                           function(requestBody) {
                                var data = JSON.parse(requestBody);
                                expect(data.logMessages[0].exception.message).toBe('Simple Error');
                                return true;
                            });
    }));

    it('Should log simple error from controller', function() {
        common.executeTest(ctrl.throwSimpleError(),
                           function(requestBody) {
                                var data = JSON.parse(requestBody);
                                expect(data.logMessages[0].exception.message).toBe('Simple Error');
                                return true;
                            });
    });

    it('Should have expected message structure', function () {
        common.executeTest(ctrl.throwSimpleError(),
                           function(requestBody) {
                                var data = JSON.parse(requestBody);
                    
                                expect(data['session']).toBeDefined('session missing');
                                var session = data.session;
                                expect(session['client']).toBeDefined('client details missing');
                                
                                checkClientMessageStructure(session.client);
                                
                                expect(data['logMessages']).toBeDefined('log messages missing');
                                checkMessageStructure(data.logMessages[0]);
                                
                                checkExceptionStructure(data.logMessages[0].exception);
                               
                                return true;
                            });
    });

    it('Should have time stamp', function () {
        common.executeTest(ctrl.throwSimpleError(),
                           function(requestBody) {
                                var partialTimeStamp = createTimeStamp();
                                var data = JSON.parse(requestBody);
                    
                                expect(data.logMessages[0].timeStamp).toContain(partialTimeStamp);
                                return true;
                            });
    });

    it('Should have sequence number', function () {
        common.executeTest(ctrl.throwSimpleError(),
                           function(requestBody) {
                                var data = JSON.parse(requestBody);
                    
                                expect(data.logMessages[0].sequence).not.toBeNull();
                                return true;
                            });
    });
    
    it('Should have session Id set', function () {
        logService.setSessionId(sessionId);
        common.executeTest(ctrl.throwSimpleError(),
                           function(requestBody) {
                                var data = JSON.parse(requestBody);
                    
                                expect(data.session.sessionId).toEqual(sessionId);
                                return true;
                            });
    });    
    
});