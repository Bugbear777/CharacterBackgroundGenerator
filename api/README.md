# Lorebound API conventions

Every endpoint follows these rules so the frontend sees one consistent contract.

## JSON

- Property names are camelCase (the ASP.NET Core default).
- Enums are sent and received as their names, e.g. `"entryType": "Location"`,
  never `0`. `JsonStringEnumConverter` is registered globally in `Program.cs`.
- Timestamps are `DateTimeOffset` in UTC (ISO 8601 with offset).

## Database

- Every enum column is stored as a string. `LoreboundDbContext.ConfigureConventions`
  applies this to all enum properties, so new enums (`SettingRole`,
  `CharacterStatus`, ...) need no extra configuration.
- Entities implementing `ITimestamped` get `CreatedAt`/`UpdatedAt` set on save.
  `ExecuteUpdate`/`ExecuteDelete` bypass this, so set `UpdatedAt` yourself.

## DTOs

- Controllers never return entities. Request and response shapes live in
  `Dtos/<Resource>/` as `record` types, e.g. `Dtos/Entries/SettingEntryDto.cs`.
- Entities are mapped with hand-written extension methods in `Mapping/`,
  e.g. `entry.ToDto()`. No AutoMapper.

## Paging

- List endpoints take `[FromQuery] PageQuery` (`page` defaults to 1,
  `pageSize` defaults to 20 and is capped at 100; out-of-range values are clamped).
- They return `PagedResult<T>`:

  ```json
  { "items": [], "page": 1, "pageSize": 20, "totalCount": 0 }
  ```
