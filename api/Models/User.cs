namespace Lorebound.Api.Models;

public class User
{
  public Guid Id { get; set; }

  public string DisplayName { get; set; } = string.Empty;

  public string Email { get; set; } = string.Empty;

  public ICollection<CampaignSetting> CampaignSettings { get; set; }
      = new List<CampaignSetting>();
}