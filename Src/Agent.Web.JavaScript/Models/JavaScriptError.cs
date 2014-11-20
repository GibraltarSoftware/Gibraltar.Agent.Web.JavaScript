using System.Collections.Generic;

namespace Gibraltar.Agent.Web.JavaScript.Models
{
    /// <summary>
    /// Details of a JavaScript error
    /// </summary>
    public class JavaScriptError
    {
        /// <summary>
        /// The message category
        /// </summary>
        public string Category { get; set; }

        /// <summary>
        /// The message associated with the error
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// The URL upon which the error occurred
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// The stack trace
        /// </summary>
        public List<string> StackTrace { get; set; }

        /// <summary>
        /// Optional. The cause of the error
        /// </summary>
        public string Cause { get; set; }

        /// <summary>
        /// Optional. The line number upon which the error occurred
        /// </summary>
        public int? Line { get; set; }

        /// <summary>
        /// Optional. The column number upon which the error occurred
        /// </summary>
        public int? Column { get; set; }

        /// <summary>
        /// Optional. The Angular controller within which the error occurred
        /// </summary>
        public string Controller { get; set; }

        /// <summary>
        /// Optional. Additional error details, such as client browser settings
        /// </summary>
        public string Details { get; set; }
    }
}