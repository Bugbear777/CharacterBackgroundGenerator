using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Lorebound.Api.Tests.TestSupport;

/// <summary>
/// Hosts the real API in memory and adds the test-only controllers in this
/// assembly (routes under /test).
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
  protected override void ConfigureWebHost(IWebHostBuilder builder)
  {
    builder.ConfigureServices(services =>
        services
            .AddControllers()
            .AddApplicationPart(typeof(ApiFactory).Assembly));
  }
}
