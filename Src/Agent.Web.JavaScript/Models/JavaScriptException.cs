using System;
using System.Collections.Generic;
using System.Linq;

namespace Gibraltar.Agent.Web.JavaScript.Models
{
    /// <summary>
    /// Defines a JavaScript exception
    /// </summary>
    public class JavaScriptException : Exception
    {
        private readonly string _stackTrace;

        /// <summary>
        /// Create a new exception
        /// </summary>
        /// <param name="message">The exception message</param>
        public JavaScriptException(string message) : base(message)
        {
        }

        /// <summary>
        /// Create a new exception
        /// </summary>
        /// <param name="message">The exception message</param>
        /// <param name="stackTrace">The stack trace, as a list of strings</param>
        public JavaScriptException(string message, IEnumerable<string> stackTrace) : base(message)
        {
            if (stackTrace != null)
            {
                _stackTrace = string.Join("\r  ", stackTrace.Select(s => s).ToArray());
            }
        }

        /// <summary>
        /// Show the stack trace for the exception
        /// </summary>
        public override string StackTrace
        {
            get { return _stackTrace; }
        }
    }
}