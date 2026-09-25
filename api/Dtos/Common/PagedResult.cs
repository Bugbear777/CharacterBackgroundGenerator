namespace Lorebound.Api.Dtos.Common;

/// <summary>
/// Envelope returned by every list endpoint.
/// </summary>
public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount);
