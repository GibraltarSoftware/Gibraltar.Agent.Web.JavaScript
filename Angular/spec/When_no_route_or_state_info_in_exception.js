xdescribe('When no route or state info in exception', function() {
    var $scope, ctrl, logService;
    var common = testCommon();
    
    beforeAll(function () {

        module(function ($provide) {
            $provide.factory('$location', function () {
                return {
                    absUrl: function () { return '/' }
                }
            });
        });
    });

    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler, $location) {
        $scope = $rootScope.$new();

        $location.absUrl('/');

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
                                var details = data.logMessages[0].details;
                                expect(details.Page.RouteUrl).toBe('/');
                                return true;
                            });
    });

    it('Should have empty route name', function () {
        common.executeTest(ctrl.throwSimpleError(),
                           function (requestBody) {
                                var data = JSON.parse(requestBody);
                                var details = data.logMessages[0].details;
                                expect(details.Page.RouteName).toBe("");
                                return true;
                            });
    });

    it('Should have empty templateUrl', function () {
        common.executeTest(ctrl.throwSimpleError(),
                           function (requestBody) {
                                var data = JSON.parse(requestBody);
                                var details = JSON.parse(data.Details);
                                expect(details.Page.TemplateUrl).toBe("");
                                return true;
                            });
    });
    
    it('Should have empty parameters', inject(function ($httpBackend) {
        common.executeTest(ctrl.throwSimpleError(),
                           function (requestBody) {
                                var data = JSON.parse(requestBody);
                                var details = JSON.parse(data.Details);
                                expect(details.Page.Parameters).toEqual([]);
                                return true;
                            });
    }));
});