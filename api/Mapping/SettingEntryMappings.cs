using Lorebound.Api.Dtos.Entries;
using Lorebound.Api.Models;

namespace Lorebound.Api.Mapping;

public static class SettingEntryMappings
{
  public static SettingEntryDto ToDto(this SettingEntry entry) => new(
      entry.Id,
      entry.CampaignSettingId,
      entry.Name,
      entry.Description,
      entry.EntryType,
      entry.CreatedAt,
      entry.UpdatedAt);
}
