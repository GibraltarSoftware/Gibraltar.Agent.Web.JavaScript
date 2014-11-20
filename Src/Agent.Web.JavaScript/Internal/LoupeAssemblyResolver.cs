using System.Collections.Generic;
using System.Reflection;
using System.Web.Http.Dispatcher;
using Gibraltar.Agent.Web.JavaScript.Controllers;

namespace Gibraltar.Agent.Web.JavaScript.Internal
{
    internal class LoupeAssemblyResolver : DefaultAssembliesResolver
    {
        /// <summary>
        /// Resolves the Gibraltar Loupe logging controller
        /// </summary>
        /// <returns></returns>
        public override ICollection<Assembly> GetAssemblies()
        {
            var defaultAssemblies = base.GetAssemblies();
            var assemblies = new List<Assembly>(defaultAssemblies);
            var t = typeof(GibraltarJavascriptLoggingController);
            var a = t.Assembly;

            defaultAssemblies.Add(a);

            return assemblies;
        }
    }
}
