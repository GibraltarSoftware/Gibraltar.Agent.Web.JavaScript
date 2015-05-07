describe('When logging platform details', function() {
    var expectedUrl = '/Loupe/Log';
    var $scope, ctrl, logService, clientDetails;
    var common = testCommon();

    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler) {
        $scope = $rootScope.$new();

        ctrl = $controller('TestCtrl', {
            $scope: $scope,
            $exceptionHandler: $exceptionHandler,
            logService: logService
        });
    }));

    beforeEach(inject(function($httpBackend) {
        common.executeTest(ctrl.throwSimpleError(),
        function(requestBody) {
            var data = JSON.parse(requestBody);
            clientDetails = data.session.client;
            return true;
        });
    }));


    it('Should have size information', function() {
        var expectedWidth = window.innerWidth || document.body.clientWidth;
        var expectedHeight = window.innerHeight || document.body.clientHeight;
        
        expect(clientDetails.size).not.toBeUndefined();
        expect(clientDetails.size.width).toEqual(expectedWidth);
        expect(clientDetails.size.height).toEqual(expectedHeight);
    });


    it('Should have description',  function() {
        expect(clientDetails.description).toEqual(platform.description);
    });

    it('Should have user agent details',  function() {
        expect(clientDetails.ua).toEqual(platform.ua);
    });

    it('Should have browser name',  function() {
        expect(clientDetails.name).not.toEqual("");
        expect(clientDetails.name).toEqual(platform.name);
    });

    it('Should have browser version',  function() {
        expect(clientDetails.version).not.toEqual("");
        expect(clientDetails.version).toEqual(platform.version);
    });

    it('Should have os details', function () {
        var expectedOS = platform.os;
        var agentOS = clientDetails.os;

        expect(agentOS.architecture).toEqual(expectedOS.architecture);
        expect(agentOS.family).toEqual(expectedOS.family);
        expect(agentOS.version).toEqual(expectedOS.version);
    });
});