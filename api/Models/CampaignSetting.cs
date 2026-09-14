namespace Lorebound.Api.Models;

public class CampaignSetting
{
  public Guid Id { get; set; }

  public string Name { get; set; } = string.Empty;

  public string? Description { get; set; }

  public Guid OwnerUserId { get; set; }

  public User Owner { get; set; } = null!;

  public ICollection<SettingEntry> Entries { get; set; }
      = new List<SettingEntry>();

  public ICollection<SettingEntryRelationship> Relationships { get; set; }
      = new List<SettingEntryRelationship>();
}