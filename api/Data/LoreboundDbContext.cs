using Microsoft.EntityFrameworkCore;

namespace Lorebound.Api.Data;

public class LoreboundDbContext : DbContext
{
    public LoreboundDbContext(DbContextOptions<LoreboundDbContext> options)
        : base(options)
    {
    }
}