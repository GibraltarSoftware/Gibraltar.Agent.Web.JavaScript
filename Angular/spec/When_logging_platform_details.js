describe('When logging platform details', function() {
    var expectedUrl = '/Gibraltar/Log/Exception';
    var $scope, ctrl, logService, clientDetails;

    beforeEach(function () {
        module('testApp', function ($exceptionHandlerProvider) {
            $exceptionHandlerProvider.mode('log');
        });
    });

    beforeEach(inject(["gibraltar.logService", function (_logService_) {
        logService = _logService_;
    }]));


    beforeEach(inject(function ($rootScope, $controller, $exceptionHandler) {
        $scope = $rootScope.$new();

        ctrl = $controller('TestCtrl', {
            $scope: $scope,
            $exceptionHandler: $exceptionHandler,
            logService: logService
        });
    }));

    beforeEach(inject(function($httpBackend) {
        $httpBackend.expectPOST(expectedUrl, function(requestBody) {
            var data = JSON.parse(requestBody);
            clientDetails = JSON.parse(data.Details).Client;
            return true;
        }).respond(200);
        ctrl.throwSimpleError();
        $httpBackend.flush();
    }));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
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