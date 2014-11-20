Loupe Agent for JavaScript and WebAPI
==========================

This agent adds Loupe to your ASP.NET WebAPI project to automatically handle
JavaScript and Angular exceptions and provide log message capabilities from client script.
If you don't need to modify the source code just download the latest [Loupe Agent for JavaScript and WebAPI]().
It extends the [Loupe Agent for ASP.NET MVC](http://www.nuget.org/packages/Gibraltar.Agent.Web.Mvc/) so you can
use any viewer for Loupe to review the angent's information.

Using the Agent
---------------
To use the agent you need to include the required scripts from Scripts/Gibraltar in your application. The scripts are:

* __Gibraltar.Agent.NativeScript.js__. A JavaScript module for native JavaScript applications.
* __Gibraltar.Agent.Angular.js__. An Angular module encapsulating the agent features. This module 
does not require the native JavaScript module, although you may wish to include both so that any 
native script exceptions also get caught.
* __platform.js__. A copy of [platform.js](https://github.com/bestiejs/platform.js), a dependency that isn't available via NuGet.
Platform.js provides client platform details when submitting unhandled exceptions.
* __stacktrace.js__. A copy of [stacktrace.js](https://github.com/stacktracejs/stacktrace.js/), a dependency that isn't available via NuGet.
Stacktrace.js provides a stack trace of the JavaScript when an unhandled exception occurs.

The agent registers its own WebAPI controller through `App_Start/Gibraltar_RouteConfig.cs`, so no explicit route configuration 
needs to be added. This controller converts the JSON error details and uses the standard 
[Loupe Agent for ASP.NET MVC](http://www.nuget.org/packages/Gibraltar.Agent.Web.Mvc/)  to log the details.

Using the agent depends upon your application type:

### Native JavaScript ###

The native client registers the `window.onerror` event and submits exceptions to the WebAPI controller.
Existing `onerror` subscriptions will be called prior to the exception log. A stack trace is constructed
either from the stack trace from the error, or if not available, by using stacktrace.js to build the
stack trace from the error message.

To manually log, the client exposes itself via the `gibraltar` namespace. The syntax is:

```JavaScript
	gibraltar.agent.log(severity, category, caption, description, [args], [details]);
```

The description follows the standard Gibraltar log pattern. 

Parameters:

* severity. The log message severity. One of the logMessageSeverity values, of: none, critical, error, warning, information, verbose.
* category. The application subsystem or logging category that the log message is associated with, which supports a dot-delimited hierarchy.
* caption. A simple single-line message caption. (Will not be processed for formatting.)
* description. Additional multi-line descriptive message (or may be null) which can be a format string followed by corresponding args.
* args. A variable number of arguments referenced by the formatted description string (or no arguments to skip formatting).
The args should be passed as a JavaScript array.
* details. A set of optional details that will be converted into the XML details for the server log.

The `details` parameter should be a JSON object containing:

* Page. Additional details about the page.
* Client. Client platform details, as taken from the `getPlatform()` method of the agent, which in turn wraps platform.js.

For example:

```JavaScript
	gibraltar.agent.log(gibraltar.agent.logMessageSeverity.information, 
		"My Application", "Application status", 
		"Application status has changed from {0} to {1}", [ oldStatus, newStatus ]);
```

or

```JavaScript
	$(function() {
		
		var details = {
			Page: {
				Name: "Index.cshtml",
                Method: "script ready"
			},
			Client: gibraltar.agent.getPlatform()
		}
		gibraltar.agent.log(gibraltar.agent.logMessageSeverity.information, 
			"My Application", "Application start", 
			"Application started", null, details);
	});
```

The agent also exposes wrappers for platform.js (`getPlatform()`) and stacktrace.js (`getStacktrace()`).

### Angular ###

For Angular, the agent is exposed as service within a module (`Gibraltar.Agent.Angular`), so your Angular module 
needs to take a dependency upon the Gibraltar agent module:

```JavaScript
var app = angular.module('TestApp', ["ngRoute", "Gibraltar.Agent.Angular"]);
```

The agent adds a decorator to the Angular `$exceptionHandler` service for unhandled exceptions, for which
a stack trace is included in the log, as well as additional details contianing the client platform and 
route if present (both the Angular ngRoute and ui-router are supported). The stack trace is built from 
the exception supplied by the angular exception handler.

To log manually, the logging capabilities are exposed via the `gibraltar.logService` service, which should be 
injected into your controllers.

```JavaScript
app.controller('TodoController', ['$scope', 'gibraltar.logService', function ($scope, gibraltarLogService) {

	...

	$scope.changeStatus = function() {
		gibraltarLogService.log(gibraltarLogService.logMessageSeverity.warning,
			"My Application", "Application status", 
			"Application status has changed from {0} to {1}", [ oldStatus, newStatus ]);
	};

});
```

The format is the same as for the native JavaScript logging component.

The agent service also exposes wrappers for platform.js (`getPlatform()`) and stacktrace.js (`getStacktrace()`),
as well as wrapping these in their own services (`gibraltar.platformService` and `gibraltar.stacktraceService`)
should you wish to inject these independently of the logging.

Although unhandled errors are automatically logged, you can also call the `logException` method of the service 
directly, passing in the exception and cause.


Building the Agent
------------------

This project is designed for use with Visual Studio 2012 with NuGet package restore enabled.
When you build it the first time it will retrieve dependencies from NuGet.

Contributing
------------

Feel free to branch this project and contribute a pull request to the development branch. 
If your changes are incorporated into the master version they'll be published out to NuGet for
everyone to use!
