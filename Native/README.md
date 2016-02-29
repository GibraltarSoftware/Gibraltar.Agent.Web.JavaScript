# Test Infrastructure
To avoid duplicating a lot of boiler plate code there is a certain amount of infrastructure used
in the spec files and tests themselves.

This document outlines what the infrastructure is and how it is used.

## Helpers
The helpers folder contains 3 files:
 * fakeErrorHandler.js
 * testCommon.js
 * Utils.js
 
### fakeErrorHandler.js
This file contains a fake error handler used in a couple of tests to test errors are propogated correctly beyond our agent.

### testCommon.js
This file has one function that contains all the normal boiler plate that is required for running a spec.

There are multiple beforeEach and afterEach steps which are executed to ensure that the state for each test is isolated.

A test will can call the method requestComplete to wait for a request to have been received.

### Utils.js
Utils.js is a file that contains multiple standard functions that tests use this might be validating the strucutre of a message
or simply detecting the browser the tests are running in.

In the future this could be pulled out into ES6 modules and then the spec would import only what it needed

#### Messages
The most widely used is the Messages function which wraps a lot of functionality around sending a log message.

To enable the messages function to work correctly you need to call its init method passing it the requests array
that you wish to observe to determine if a request has completed or not.

To an extent the messages class duplicates some of the functionality in testCommon.js but as it doesn't have the
before and after is a little more flexible in its use.


## Specs

Each spec file is a collection of tests related to a specific piece of functionality that the agent exhibits.

Each spec will usually use the following variables:
* common - instance of testCommon.js
* messageFn - instance of the messages function


If using Messages you need to call its init method passing it the requests array
that you wish to observe to determine if a request has completed or not. The easiest 
requests array to use is the testCommon requests.

```
    beforeEach(function () {
        messageFn.init(common.requests());
    });
```

As the agent primarily makes use of localStorage it is vital it is cleared after each test otherwise you can get
test failures due to the test finding the incorrect message in storage to send. 