describe('When route details in exception', function () {
    var $scope, ctrl, logService;
    var common = testCommon('testApp','/');

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

    it('Should have correct Route Url', function () {
        common.executeTest(ctrl.throwSimpleError(),
                           function (requestBody) {
                               var data = JSON.parse(requestBody);
                               var details = JSON.parse(data.logMessages[0].details);
                                expect(details.page.routeUrl).toBe('/');
                                return true;
                            });
    });

    it('Should have empty route name', function() {
        common.executeTest(ctrl.throwSimpleError(),
                           function (requestBody) {
                               var data = JSON.parse(requestBody);
                               var details = JSON.parse(data.logMessages[0].details);
                                expect(details.page.routeName).toBe("");
                                return true;
                            });
    });

    it('Should have templateUrl', function () {
        common.executeTest(ctrl.throwSimpleError(),
                           function (requestBody) {
                               var data = JSON.parse(requestBody);
                               var details = JSON.parse(data.logMessages[0].details);
                                expect(details.page.templateUrl).toBe("/");
                                return true;
                            });
    });

    it('Should have empty parameters', function () {
        common.executeTest(ctrl.throwSimpleError(),
                           function (requestBody) {
                               var data = JSON.parse(requestBody);
                               var details = JSON.parse(data.logMessages[0].details);
                                expect(details.page.parameters).toEqual([]);
                                return true;
                            });
    });
});