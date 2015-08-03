Loupe Agent for JavaScript
==========================

Loupe has 2 JavaScript agents:

 * A native JavaScript agent which uses vanilla JavaScript with no dependencies on any frameworks
 * An Angular 1.x agent which has been designed to work specifically with Angular 

These agents bring a lot of the familiar Loupe Agent functionality to client side logging, recording uncaught exceptions and allowing you to 
log messages from your JavaScript code to Loupe.

When combined with the [Loupe Agent for ASP.NET MVC](http://www.nuget.org/packages/Gibraltar.Agent.Web.Mvc/) or [Loupe Agent for ASP.NET WebForms](https://www.nuget.org/packages/Gibraltar.Agent.Web/) 
these agents will allow you to correlate the actions your user performs client side with the corresponding server side processing giving you a better insight into end to end functionality.

Using an Agent
---------------
To use one of these agents you need to include the required script from the dist folder from either [Native](https://github.com/GibraltarSoftware/Gibraltar.Agent.Web.JavaScript/tree/master/Native/dist) 
or [Angular](https://github.com/GibraltarSoftware/Gibraltar.Agent.Web.JavaScript/tree/master/Angular/dist) depending on which agent you require.

The agents are designed to send log information to a server which handles logging to a Loupe server; if you are using ASP.Net (MVC or WebForms) & IIS you can use the 
[Loupe.Web.Module](https://www.nuget.org/packages/Loupe.Agent.Web.Module/) which will handle all of the server side interaction for you. 

If you are not using ASP.Net & IIS you will need to create your own endpoint for receiving the messages and if this is something you want to do please reach out to us so we can help with message formats, etc

To get more information on how the agents work head to the [wiki](https://github.com/GibraltarSoftware/Gibraltar.Agent.Web.JavaScript/wiki) which explains
the functionality the agents support and how to use it.

Building the Agent from source
------------------------------

The agents have been built using node, npm and grunt.

You will need to have installed Node (version > 0.10), which will also mean you will have npm, and then install grunt using npm with
the command `npm install -g grunt-cli`.

First clone the repo to your local machine then open a command prompt at the respective agent folder e.g. C:\Github\Gibraltar.Agent.Web.JavaScript\Native, issue
the command `npm install` this will then install all the necessary modules to be able to build the agent.

Once npm install has finished if you run `grunt test` it will execute the jasmine specs so you can be sure that the code is working as expected.

Contributing
------------

Feel free to branch this project and contribute a pull request to the development branch. 
If your changes are incorporated into the master version they'll be published out for everyone to use!
