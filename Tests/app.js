var app = angular.module('testApp', ["Gibraltar.Agent.Angular", "ngRoute"]).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/', { controller: "TestCtrl" });
}]);

app.controller('TestCtrl', ["$scope", "$exceptionHandler", "gibraltar.logService", function ($scope, $exceptionHandler, logService) {

    this.throwSimpleError = function() {
        $exceptionHandler("Simple Error");
    }

    $scope.logMessage = function(logText) {
        logService.log(logService.logMessageSeverity.information, 'test', logText);
    }
}]);


var stateApp = angular.module('stateApp', ["Gibraltar.Agent.Angular", "ui.router"]);

stateApp.controller('TestCtrl',["$scope", "$exceptionHandler", "gibraltar.logService", function ($scope, $exceptionHandler, logService) {

    this.throwSimpleError = function() {
        $exceptionHandler("Simple Error");
    }

    $scope.logMessage = function(logText) {
        logService.log(logService.logMessageSeverity.information, 'test', logText);
    }
}]);

var errorApp = angular.module('testErrorApp', ["Gibraltar.Agent.Angular", "ngRoute"]).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/', { controller: "TestCtrl" });
}]);

errorApp.controller('TestCtrl', ["$scope", "$exceptionHandler", "gibraltar.logService", function ($scope, $exceptionHandler, logService) {

    this.throwSimpleError = function () {

        try {
            var object = new TestingStack();
            object.createThrowWithMessage();
        } catch (e) {
            $exceptionHandler(e);
        } 
    }

    this.throwCustomError = function() {
        try {
            var object = new TestingStack();
            object.createCustomError();
        } catch (e) {
            $exceptionHandler(e);
        } 
    }

    this.throwUninitializeError = function() {
        try {
            var object = new TestingStack();
            object.createError();
        } catch (e) {
            $exceptionHandler(e);
        } 
    }

    $scope.logMessage = function (logText) {
        logService.log(logService.logMessageSeverity.information, 'test', logText);
    }
}]);
