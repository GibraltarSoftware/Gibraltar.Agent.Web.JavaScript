using System.Web.Http;
using Agent.Web.JavaScript.Models;

namespace Agent.Web.JavaScript.Controllers
{
    /// <summary>
    /// Logs a JavaScript error to the Gibraltar Loupe Agent
    /// </summary>
    public class GibraltarJavascriptLoggingController : ApiController
    {
        /// <summary>
        /// Log a JavaScript exception
        /// </summary>
        /// <param name="error">The error details</param>
        [HttpPost]
        public void Exception(JavaScriptError error)
        {
            JavaScriptLogger.LogException(error, User);
        }

        /// <summary>
        /// Log a Javascript message
        /// </summary>
        /// <param name="details">The message details</param>
        [HttpPost]
        public void Message(LogDetails details)
        {
            JavaScriptLogger.Log(details);
        }
    }
}