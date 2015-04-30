describe('When route details in exception', function () {

    var expectedUrl = '/Loupe/Log/Exception';

    var $scope, ctrl, logService;

    beforeEach(function () {

        module(function ($provide) {
            $provide.factory('$location', function() {
                return {
                    absUrl: function() { return '/' }
                }
            });
        });

        module('testApp', function ($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
        });
    });

    beforeEach(inject(["loupe.logService", function (_logService_) {
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



    it('Should have correct Route Url', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);
            var details = JSON.parse(data.Details);
            expect(details.Page.RouteUrl).toBe('/');
            return true;
        }).respond(200);
        ctrl.throwSimpleError();
        $httpBackend.flush();
    }));

    it('Should have empty route name', inject(function($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);
            var details = JSON.parse(data.Details);
            expect(details.Page.RouteName).toBe("");
            return true;
        }).respond(200);
        ctrl.throwSimpleError();
        $httpBackend.flush();
    }));

    it('Should have templateUrl', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);
            var details = JSON.parse(data.Details);
            expect(details.Page.TemplateUrl).toBe("/");
            return true;
        }).respond(200);
        ctrl.throwSimpleError();
        $httpBackend.flush();
    }));

    it('Should have empty parameters', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);
            var details = JSON.parse(data.Details);
            expect(details.Page.Parameters).toEqual([]);
            return true;
        }).respond(200);
        ctrl.throwSimpleError();
        $httpBackend.flush();
    }));
});