var app = angular.module('testApp', ["Loupe.Angular", "ngRoute"]).config(['$routeProvider', function ($routeProvider) {
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

    $scope.clientSessionHeader = function(){
        return logService.clientSessionHeader();
    };

    $scope.logMessage = function(logText) {
        var methodSourceInfo = {
            file: 'app.js',
            line: 10,
            column: 15
        };
        
        logService.write(logService.logMessageSeverity.information, 'test', logText,"log description",["parameter"],null,"details", methodSourceInfo);
    };
    
    $scope.information = function(caption, description, exception, details, methodSourceInfo){
        logService.information('test',caption, description,null, exception, details, methodSourceInfo);
    };
    
    $scope.warning = function(caption, description, exception, details, methodSourceInfo){
        logService.warning('test',caption, description,null, exception, details, methodSourceInfo);
    };
   
    $scope.error = function(caption, description, exception, details, methodSourceInfo){
        logService.error('test',caption, description,null, exception, details, methodSourceInfo);
    };
    
    $scope.critical = function(caption, description, exception, details, methodSourceInfo){
        logService.critical('test',caption, description,null, exception, details, methodSourceInfo);
    };    
    
    $scope.verbose = function(caption, description, exception, details, methodSourceInfo){
        logService.verbose('test',caption, description,null, exception, details, methodSourceInfo);
    };      
}]);


var stateApp = angular.module('stateApp', ["Loupe.Angular", "ui.router"]);

stateApp.controller('TestCtrl',["$scope", "$exceptionHandler", "loupe.logService", function ($scope, $exceptionHandler, logService) {

    this.throwSimpleError = function() {
        $exceptionHandler("Simple Error");
    }

    $scope.setSessionId = function(value){
        logService.setSessionId = value;
    }

    $scope.logMessage = function(logText) {
        logService.write(logService.logMessageSeverity.information, 'test', logText);
    }
   
}]);

var errorApp = angular.module('testErrorApp', ["Loupe.Angular", "ngRoute"]).config(['$routeProvider', function ($routeProvider) {
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
        logService.write(logService.logMessageSeverity.information, 'test', logText);
    }
}]);
