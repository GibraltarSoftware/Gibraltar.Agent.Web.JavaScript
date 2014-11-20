namespace Gibraltar.Agent.Web.JavaScript.Models
{
    public class LogDetails
    {
        /// <summary>
        /// Severity of the message
        /// </summary>
        public LogMessageSeverity Severity { get; set; }

        /// <summary>
        /// The category to log against
        /// </summary>
        public string Category { get; set; }

        /// <summary>
        /// The log message caption
        /// </summary>
        public string Caption { get; set; }

        /// <summary>
        /// The log message description
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Optional. Parameters to be added to the message
        /// </summary>
        public object[] Parameters { get; set; }

        /// <summary>
        /// Optional. Additional details, such as client browser settings
        /// </summary>
        /// <remarks>
        /// This is converted into the XML details
        /// </remarks>
        public string Details { get; set; }
    }
}