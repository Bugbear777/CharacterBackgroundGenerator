namespace Lorebound.Api.Models;

public interface ITimestamped : ICreatedAt
{
  DateTimeOffset UpdatedAt { get; set; }
}
