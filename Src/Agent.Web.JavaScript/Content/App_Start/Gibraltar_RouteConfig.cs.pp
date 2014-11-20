using System.Web.Http;
using System.Web.Http.Routing;


[assembly: WebActivatorEx.PreApplicationStartMethod(typeof($rootnamespace$.GibraltarRouteConfig), "Start")]
 

namespace $rootnamespace$
{
    public class GibraltarRouteConfig
    {
        public static void Start()
        {
            Register(GlobalConfiguration.Configuration);
        }

        private static void Register(HttpConfiguration config)
        {
			// register a custom route for the Gibraltar Loupe logging controller
            var route = config.Routes.CreateRoute(
                routeTemplate: "Gibraltar/Log/{action}",
                defaults: new HttpRouteValueDictionary() { { "controller", "GibraltarJavascriptLogging" } },
                constraints: null
                );
            config.Routes.Add("GibraltarLogging", route);
        }
    }
}
