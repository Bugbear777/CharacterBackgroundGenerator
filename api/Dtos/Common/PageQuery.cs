namespace Lorebound.Api.Dtos.Common;

/// <summary>
/// Paging parameters bound from the query string (<c>?page=2&amp;pageSize=50</c>).
/// Out-of-range values are clamped rather than rejected.
/// </summary>
public record PageQuery
{
  public const int DefaultPageSize = 20;

  public const int MaxPageSize = 100;

  private readonly int _page = 1;

  private readonly int _pageSize = DefaultPageSize;

  public int Page
  {
    get => _page;
    init => _page = Math.Max(1, value);
  }

  public int PageSize
  {
    get => _pageSize;
    init => _pageSize = Math.Clamp(value, 1, MaxPageSize);
  }

  public int Skip => (Page - 1) * PageSize;
}
