﻿describe('When state details in exception', function() {
    var $scope, ctrl, logService;

    var common = testCommon('stateApp');

    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler, $state) {
        logService = common.logService();
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


    it('Should have correct Route Url', function () {
        common.executeTest(ctrl.throwSimpleError(),
                            function (requestBody) {
                                var data = JSON.parse(requestBody);
                                var details = JSON.parse(data.logMessages[0].details);
                                expect(details.page.routeUrl).toBe('/');
                                return true;
                            });
    });

    it('Should have route name', function () {
        common.executeTest(ctrl.throwSimpleError(),
                            function (requestBody) {
                                var data = JSON.parse(requestBody);
                                var details = JSON.parse(data.logMessages[0].details);
                                expect(details.page.routeName).toBe("Home");
                                return true;
                            });
    });

    it('Should have templateUrl', inject(function ($httpBackend) {
        common.executeTest(ctrl.throwSimpleError(),
                            function (requestBody) {
                                var data = JSON.parse(requestBody);
                                var details = JSON.parse(data.logMessages[0].details);
                                expect(details.page.templateUrl).toBe("/");
                                return true;
                            });
    }));

    it('Should have parameters', inject(function ($httpBackend) {
        common.executeTest(ctrl.throwSimpleError(),
                            function (requestBody) {
                                var data = JSON.parse(requestBody);
                                var details = JSON.parse(data.logMessages[0].details);
                                expect(details.page.parameters).toEqual(["a",1]);
                                return true;
                            });
    }));
});