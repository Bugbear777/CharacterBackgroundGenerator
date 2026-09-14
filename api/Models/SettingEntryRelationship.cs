namespace Lorebound.Api.Models;

public class SettingEntryRelationship
{
  public Guid Id { get; set; }

  public Guid CampaignSettingId { get; set; }

  public CampaignSetting CampaignSetting { get; set; } = null!;

  public Guid SourceEntryId { get; set; }

  public SettingEntry SourceEntry { get; set; } = null!;

  public Guid TargetEntryId { get; set; }

  public SettingEntry TargetEntry { get; set; } = null!;

  public string RelationshipType { get; set; } = string.Empty;

  public string? Description { get; set; }
}