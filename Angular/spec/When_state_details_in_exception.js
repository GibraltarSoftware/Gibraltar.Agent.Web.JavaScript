describe('When state details in exception', function() {
    var expectedUrl = '/Loupe/Log/Exception';

    var $scope, ctrl, logService;

    beforeEach(function () {

        module('stateApp', function ($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
        });
    });

    beforeEach(inject(["loupe.logService", function (_logService_) {
        logService = _logService_;
    }]));


    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler, $state) {
        $scope = $rootScope.$new();

        $state.current = {
            controller: "TestCtrl",
            name: "Home",
            url: "/",
            templateUrl: "/"
        };

        $state.params = ["a", 1];

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

    it('Should have route name', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);
            var details = JSON.parse(data.Details);
            expect(details.Page.RouteName).toBe("Home");
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

    it('Should have parameters', inject(function ($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function (requestBody) {
            var data = JSON.parse(requestBody);
            var details = JSON.parse(data.Details);
            expect(details.Page.Parameters).toEqual(["a",1]);
            return true;
        }).respond(200);
        ctrl.throwSimpleError();
        $httpBackend.flush();
    }));
});