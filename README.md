Loupe Agent for JavaScript
==========================

These agents bring a lot of the Loupe Agent functionality to JavaScript and Angular, handling uncaught exceptions and allowing you to 
log messages from your JavaScript client in Loupe.

These agents provide additonal functionality allowing you to correlate the actions your user performs client side with the corresponding
server side processing.

If you don't need to modify the source code just download the latest [Loupe Agent for JavaScript and WebAPI]().
It extends the [Loupe Agent for ASP.NET MVC](http://www.nuget.org/packages/Gibraltar.Agent.Web.Mvc/) so you can
use any viewer for Loupe to review the angent's information.

Using the Agent
---------------
To use one of these agents you need to include the required script from the dist folder from either [Native](https://github.com/GibraltarSoftware/Gibraltar.Agent.Web.JavaScript/tree/reboot/Native/dist) 
or [Angular](https://github.com/GibraltarSoftware/Gibraltar.Agent.Web.JavaScript/tree/reboot/Angular/dist) depending on which agent you require.

To enable the JavaScript agent to log to loupe you will need to use the [Loupe.Web.Module](https://github.com/GibraltarSoftware/Gibraltar.Agent.Web.Module) which handles
the server side interaction so that you do not need to alter your code.


To get more information on how the agents work head to the [wiki](https://github.com/GibraltarSoftware/Gibraltar.Agent.Web.JavaScript/wiki) which explains
the functionality the agents support and how to use it.

Building the Agent
------------------

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
