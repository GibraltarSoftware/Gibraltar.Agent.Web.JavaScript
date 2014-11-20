using System.Text.RegularExpressions;
using Gibraltar.Agent.Web.JavaScript.Models;

namespace Gibraltar.Agent.Web.JavaScript.Internal
{
    /// <summary>
    /// Message source provider for JavaScript exceptions
    /// </summary>
    internal class JavaScriptSourceProvider : IMessageSourceProvider
    {
        private readonly string _fileName;
        private readonly int _lineNumber;
        private readonly string _methodName;
        private readonly string _className;

        // This isn't perfect, but it's close; JavaScript stack traces aren't consistent across browsers or frameworks
        private readonly Regex _sourcePattern = new Regex(@"(?<function>.*)(?<file>http://localhost:\d+/[^:]*|http://[^:]*):(?<line>\d+)", RegexOptions.IgnoreCase);

        
        /// <summary>
        /// Creates a new source provider
        /// </summary>
        /// <param name="error">The JavaScript error</param>
        public JavaScriptSourceProvider(JavaScriptError error)
        {
            if (error.Controller != null)
            {
                _className = error.Controller;
            }

            if (error.StackTrace == null)
            {
                return;
            }

            // search for the actual error line; the stack trace could be in reverse order
            foreach (var line in error.StackTrace)
            {
                var match = _sourcePattern.Match(line);

                if (!match.Success)
                {
                    continue;
                }

                _methodName = match.Groups["function"].ToString()
                    .Replace("at new", "")
                    .Replace("at ", "")
                    .Replace("/<@", "")
                    .Replace("([arguments not available])@", "")
                    .Replace("@", "")
                    .Trim()
                    ;

                _fileName = match.Groups["file"].ToString();

                if (error.Line.HasValue)
                {
                    _lineNumber = error.Line.Value;
                }
                else
                {
                    int.TryParse(match.Groups["line"].ToString(), out _lineNumber);
                }
                break;
            }
        }


        /// <summary>
        /// The name of the class in which the error occurred
        /// </summary>
        public string ClassName
        {
            get { return _className; }
        }

        /// <summary>
        /// The name of the file in which the error occurred
        /// </summary>
        public string FileName
        {
            get { return _fileName; }
        }

        /// <summary>
        /// The line number upon which the error occurred
        /// </summary>
        public int LineNumber
        {
            get { return _lineNumber; }
        }

        /// <summary>
        /// The name of the method in which the error occurred
        /// </summary>
        public string MethodName
        {
            get { return _methodName; }
        }
    }
}