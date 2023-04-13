namespace Medik.CommonTypes
{
    public class RewindMiddleWare
    {
        private readonly RequestDelegate _next;

        public RewindMiddleWare(RequestDelegate next)
        {
            _next = next;
        }

        public Task Invoke(HttpContext httpContext)
        {
            httpContext.Request.EnableBuffering();
            return _next(httpContext);
        }
    }
}
