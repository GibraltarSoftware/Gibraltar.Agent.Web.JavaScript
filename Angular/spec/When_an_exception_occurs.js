describe('When an exception occurs', function() {

    var expectedUrl = '/Loupe/Log/Exception';

    var $scope, ctrl, logService;

    beforeEach(function() {

        module(function($provide) {
            $provide.factory('$location', function() {
                return {
                    absUrl: function () {return '/'}
                }
            })
        });

        module('testApp', function($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
        });
    });
        
    beforeEach(inject(["loupe.logService", function(_logService_) {
        logService = _logService_;
    }]));


    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler, $route, $location) {
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

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }));

    it('should log simple error', inject(function ($exceptionHandler, $httpBackend) {
        $exceptionHandler('Simple Error');

        $httpBackend.expectPOST(expectedUrl, function(requestBody) {
            var data = JSON.parse(requestBody);
            expect(data.Message).toBe('Simple Error');
            return true;
        }).respond(200);
        $httpBackend.flush();

    }));

    it('Should log simple error from controller', inject(function($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);
            expect(data.Message).toBe('Simple Error');
            return true;
        }).respond(200);
        ctrl.throwSimpleError();
        $httpBackend.flush();
    }));

});