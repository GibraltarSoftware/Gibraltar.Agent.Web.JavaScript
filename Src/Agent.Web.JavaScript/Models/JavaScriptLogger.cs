using System.Collections.Generic;
using System.IO;
using System.Security.Principal;
using System.Xml;
using Agent.Web.JavaScript.Internal;
using Gibraltar.Agent;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Agent.Web.JavaScript.Models
{
    /// <summary>
    /// Logs a JavaScript error to the Gibraltar Loupe Agent
    /// </summary>
    public static class JavaScriptLogger
    {
        /// <summary>
        /// Logs a javascriJavaScriptpt error
        /// </summary>
        /// <param name="error">The JavaScript error object</param>
        /// <param name="user">The current user</param>
        /// <remarks>
        /// <list type="bullet">
        /// <item>
        /// <description>The <paramref name="error"/> details should come through as JSON</description>
        /// </item>
        /// <item>
        /// <description>
        /// If the <paramref name="user"/> is an IPrincipal, the basic identity details are extracted for the user,
        /// otherwise the entire object is serialized to JSON.
        /// </description>
        /// </item>
        /// </list>
        /// </remarks>
        public static void LogException(JavaScriptError error, object user)
        {
            var sourceProvider = new JavaScriptSourceProvider(error);
            var exception = new JavaScriptException(error.Message, error.StackTrace);
            var userName = string.Empty;
            JObject userDetails = null;
            JObject pageDetails = null;
            var detailsXml = string.Empty;
            
            if (!string.IsNullOrWhiteSpace(error.Details))
            {
                pageDetails = JObject.Parse(error.Details);
            }

            if (user!= null)
            {
                object userIdentity;
                if (user is IPrincipal)
                {
                    var userPrincipal = user as IPrincipal;
                    userIdentity = new
                    {
                        userPrincipal.Identity.AuthenticationType,
                        userPrincipal.Identity.IsAuthenticated,
                        userPrincipal.Identity.Name
                    };
                    userName = userPrincipal.Identity.Name;
                }
                else
                {
                    userIdentity = user;
                }

                userDetails = JObject.FromObject(userIdentity);
            }

            if (userDetails != null || pageDetails != null)
            {
                var properties = new List<object>();

                if (userDetails != null)
                {
                    var userProperty = new JProperty("User", userDetails);
                    properties.Add(userProperty);
                }
                
                if (pageDetails != null)
                {
                    var pageProperty = pageDetails.Property("Page");
                    if (pageProperty != null)
                    {
                        properties.Add(pageProperty);
                    }
                    var clientProperty = pageDetails.Property("Client");
                    if (clientProperty != null)
                    {
                        properties.Add(clientProperty);
                    }
                }
                var propArray = properties.ToArray();
                var detailsObject = new JObject(propArray);
                var detailsProperty = new JProperty("Details", detailsObject);
                var container = new JObject(detailsProperty);

                detailsXml = JObjectToXmlString(container);
            }

            Gibraltar.Agent.Log.Write(LogMessageSeverity.Error, "JavaScript", sourceProvider, userName, exception, 
                LogWriteMode.Queued, detailsXml, error.Category, error.Message, error.Cause);
        }

        /// <summary>
        /// Log a message to the Gibraltar Loupe Agent
        /// </summary>
        /// <param name="details">The details of the message</param>
        public static void Log(LogDetails details)
        {
            var detailsXml = "";

            if (details.Details != null)
            {
                var pageDetails = JObject.Parse(details.Details);
                if (pageDetails != null)
                {
                    var properties = new List<object>();

                    var pageProperty = pageDetails.Property("Page");
                    if (pageProperty != null)
                    {
                        properties.Add(pageProperty);
                    }
                    var clientProperty = pageDetails.Property("Client");
                    if (clientProperty != null)
                    {
                        properties.Add(clientProperty);
                    }

                    var propArray = properties.ToArray();
                    var detailsObject = new JObject(propArray);
                    var detailsProperty = new JProperty("Details", detailsObject);
                    var container = new JObject(detailsProperty);

                    detailsXml = JObjectToXmlString(container);

                }
            }
            
            Gibraltar.Agent.Log.Write(details.Severity, "Loupe", 0, null, LogWriteMode.Queued, detailsXml,
                details.Category, details.Caption, details.Description, details.Parameters);

        }


        private static string JObjectToXmlString(JObject detailsObject)
        {
            using (var stringWriter = new StringWriter())
            using (var xmlTextWriter = XmlWriter.Create(stringWriter))
            {
                var detailsDoc = JsonConvert.DeserializeXmlNode(detailsObject.ToString());
                detailsDoc.WriteTo(xmlTextWriter);
                xmlTextWriter.Flush();
                return stringWriter.GetStringBuilder().ToString();
            }
        }
    }
}