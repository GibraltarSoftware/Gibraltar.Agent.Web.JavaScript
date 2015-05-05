var app = angular.module('testApp', ["Loupe.Agent.Angular", "ngRoute"]).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/', { controller: "TestCtrl" });
}]);

app.controller('TestCtrl', ["$scope", "$exceptionHandler", "loupe.logService", function ($scope, $exceptionHandler, logService) {

    this.throwSimpleError = function() {
        $exceptionHandler("Simple Error");
    };

    $scope.setSessionId = function(value){
        logService.setSessionId = value;
    };

    $scope.logMessage = function(logText) {
        logService.log(logService.logMessageSeverity.information, 'test', logText,"log description",["parameter"],"details");
    };
    
    $scope.information = function(caption, description, exception){
        logService.information('test',caption, description,null, exception);
    };
    
    $scope.informationDetail = function(caption, description, exception, detail){
      logService.informationDetail('test',caption, description,null, exception, detail);  
    };
    
    $scope.warning = function(caption, description, exception){
        logService.warning('test',caption, description,null, exception);
    };
    
    $scope.warningDetail = function(caption, description, exception, detail){
      logService.warningDetail('test',caption, description,null, exception, detail);  
    };    
    
}]);


var stateApp = angular.module('stateApp', ["Loupe.Agent.Angular", "ui.router"]);

stateApp.controller('TestCtrl',["$scope", "$exceptionHandler", "loupe.logService", function ($scope, $exceptionHandler, logService) {

    this.throwSimpleError = function() {
        $exceptionHandler("Simple Error");
    }

    $scope.setSessionId = function(value){
        logService.setSessionId = value;
    }

    $scope.logMessage = function(logText) {
        logService.log(logService.logMessageSeverity.information, 'test', logText);
    }
   
}]);

var errorApp = angular.module('testErrorApp', ["Loupe.Agent.Angular", "ngRoute"]).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/', { controller: "TestCtrl" });
}]);

errorApp.controller('TestCtrl', ["$scope", "$exceptionHandler", "loupe.logService", function ($scope, $exceptionHandler, logService) {

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

    $scope.setSessionId = function(value){
        logService.setSessionId = value;
    }

    $scope.logMessage = function (logText) {
        logService.log(logService.logMessageSeverity.information, 'test', logText);
    }
}]);
