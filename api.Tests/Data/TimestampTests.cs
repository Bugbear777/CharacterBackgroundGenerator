using Lorebound.Api.Data;
using Lorebound.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace Lorebound.Api.Tests.Data;

public class TimestampTests
{
  private static readonly DateTimeOffset Start =
      new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

  private readonly FakeTimeProvider _time = new(Start);

  private LoreboundDbContext CreateContext(string databaseName)
  {
    var options = new DbContextOptionsBuilder<LoreboundDbContext>()
        .UseInMemoryDatabase(databaseName)
        .Options;

    return new LoreboundDbContext(options, _time);
  }

  private static (ApplicationUser Owner, CampaignSetting Setting) NewSetting()
  {
    var owner = new ApplicationUser
    {
      Id = Guid.NewGuid(),
      UserName = "owner@example.com",
      DisplayName = "Owner",
    };

    var setting = new CampaignSetting
    {
      Id = Guid.NewGuid(),
      Name = "Eberron",
      Owner = owner,
    };

    return (owner, setting);
  }

  [Fact]
  public async Task Adding_sets_CreatedAt_and_UpdatedAt_to_now()
  {
    await using var db = CreateContext(Guid.NewGuid().ToString());
    var (owner, setting) = NewSetting();

    db.CampaignSettings.Add(setting);
    await db.SaveChangesAsync();

    Assert.Equal(Start, setting.CreatedAt);
    Assert.Equal(Start, setting.UpdatedAt);
    Assert.Equal(Start, owner.CreatedAt);
  }

  [Fact]
  public async Task Updating_advances_UpdatedAt_and_keeps_CreatedAt()
  {
    var databaseName = Guid.NewGuid().ToString();
    var (_, setting) = NewSetting();

    await using (var db = CreateContext(databaseName))
    {
      db.CampaignSettings.Add(setting);
      await db.SaveChangesAsync();
    }

    _time.Advance(TimeSpan.FromMinutes(5));

    await using (var db = CreateContext(databaseName))
    {
      var loaded = await db.CampaignSettings.SingleAsync();
      loaded.Name = "Eberron (revised)";
      loaded.CreatedAt = DateTimeOffset.MinValue;
      await db.SaveChangesAsync();
    }

    await using (var db = CreateContext(databaseName))
    {
      var reloaded = await db.CampaignSettings.SingleAsync();

      Assert.Equal(Start, reloaded.CreatedAt);
      Assert.Equal(Start.AddMinutes(5), reloaded.UpdatedAt);
      Assert.True(reloaded.CreatedAt < reloaded.UpdatedAt);
    }
  }

  [Fact]
  public void SaveChanges_sync_also_sets_timestamps()
  {
    using var db = CreateContext(Guid.NewGuid().ToString());
    var (_, setting) = NewSetting();

    db.CampaignSettings.Add(setting);
    db.SaveChanges();

    Assert.Equal(Start, setting.CreatedAt);
    Assert.Equal(Start, setting.UpdatedAt);
  }
}
