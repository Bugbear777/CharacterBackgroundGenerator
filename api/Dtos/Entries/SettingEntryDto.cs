using Lorebound.Api.Models;

namespace Lorebound.Api.Dtos.Entries;

public record SettingEntryDto(
    Guid Id,
    Guid CampaignSettingId,
    string Name,
    string? Description,
    SettingEntryType EntryType,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
