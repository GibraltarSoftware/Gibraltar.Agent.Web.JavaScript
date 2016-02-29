# Test Infrastructure
To avoid duplicating a lot of boiler plate code there is a certain amount of infrastructure used
in the spec files and tests themselves.

This document outlines what the infrastructure is and how it is used.

## Helpers
The helpers folder contains 3 files:
 * app.js
 * testCommon.js
 * Utils.js
 
### app.js
This file contains the angular modules and controllers that are used by the specs for running the test

### testCommon.js
This file has one function that contains all the normal boiler plate that is required for running a spec.

There are multiple beforeEach and afterEach steps which are executed to ensure that the state for each test is isolated.

A test will call the method on the controller using the executeTest method
this takes the function to call and the callback function to test once the log message(s) have been sent.

### Utils.js
Utils.js is a file that contains multiple standard functions that tests use this might be validating the strucutre of a message
or simply detecting the browser the tests are running in.

In the future this could be pulled out into ES6 modules and then the spec would import only what it needed

## Specs

Each spec file is a collection of tests related to a specific piece of functionality that the agent exhibits.

Each spec will normally need the following variables:
* logService - the loupe agent
* $exceptionHandler - angular $exceptionHanlder
* ctrl - angular controller to use in executing the tests

if using the testCommon.js then you will need to tell it which of the angular modules you wish it to 
load to run the tests against and the expected URL that http requests will be made against
 e.g. ``var common = testCommon('TestApp', '/Loupe/Log');``

To set up the standard local variables before tests are executed expect to see:

```
beforeEach(inject(function ($rootScope, $controller, $exceptionHandler) {
        logService = common.logService();
        $scope = $rootScope.$new();
        ctrl = $controller('TestCtrl', {
            $scope: $scope,
            $exceptionHandler: $exceptionHandler,
            logService: logService
        });
    })); 
```

Most will use the testCommon.js for execution so that they don't have to keep repeating boilerplate code **but**
some tests need finer control over what is happening as so will need to handle the following:
* setting up the $exceptionHandler
* setting up the logService
* ensuring all request made after each test
* ensuring localStorage is clear after each test

As the agent primarily makes use of localStorage it is vital it is cleared after each test otherwise you can get
test failures due to the test finding the incorrect message in storage to send. 