namespace Lorebound.Api.Models;

public class SettingEntry : ITimestamped
{
  public Guid Id { get; set; }

  public Guid CampaignSettingId { get; set; }

  public CampaignSetting CampaignSetting { get; set; } = null!;

  public string Name { get; set; } = string.Empty;

  public string? Description { get; set; }

  public SettingEntryType EntryType { get; set; }

  public ICollection<SettingEntryRelationship> OutgoingRelationships { get; set; }
      = new List<SettingEntryRelationship>();

  public ICollection<SettingEntryRelationship> IncomingRelationships { get; set; }
      = new List<SettingEntryRelationship>();

  public DateTimeOffset CreatedAt { get; set; }

  public DateTimeOffset UpdatedAt { get; set; }
}