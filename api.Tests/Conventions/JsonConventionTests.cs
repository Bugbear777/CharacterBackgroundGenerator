using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Lorebound.Api.Tests.TestSupport;

namespace Lorebound.Api.Tests.Conventions;

public class JsonConventionTests : IClassFixture<ApiFactory>
{
  private readonly HttpClient _client;

  public JsonConventionTests(ApiFactory factory)
  {
    _client = factory.CreateClient();
  }

  [Fact]
  public async Task Enum_round_trips_as_its_name()
  {
    var response = await _client.PostAsJsonAsync("/test/echo/entry", new
    {
      id = Guid.NewGuid(),
      campaignSettingId = Guid.NewGuid(),
      name = "Sharn",
      entryType = "Location",
      createdAt = DateTimeOffset.UtcNow,
      updatedAt = DateTimeOffset.UtcNow,
    });

    Assert.Equal(HttpStatusCode.OK, response.StatusCode);

    using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    var entryType = json.RootElement.GetProperty("entryType");

    Assert.Equal(JsonValueKind.String, entryType.ValueKind);
    Assert.Equal("Location", entryType.GetString());
  }
}
