using Lorebound.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lorebound.Api.Data;

public class LoreboundDbContext : DbContext
{
  public LoreboundDbContext(DbContextOptions<LoreboundDbContext> options)
      : base(options)
  {
  }

  public DbSet<User> Users => Set<User>();

  public DbSet<CampaignSetting> CampaignSettings => Set<CampaignSetting>();

  public DbSet<SettingEntry> SettingEntries => Set<SettingEntry>();

  public DbSet<SettingEntryRelationship> SettingEntryRelationships
      => Set<SettingEntryRelationship>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<User>()
        .HasMany(user => user.CampaignSettings)
        .WithOne(setting => setting.Owner)
        .HasForeignKey(setting => setting.OwnerUserId);

    modelBuilder.Entity<CampaignSetting>()
        .HasMany(setting => setting.Entries)
        .WithOne(entry => entry.CampaignSetting)
        .HasForeignKey(entry => entry.CampaignSettingId);

    modelBuilder.Entity<CampaignSetting>()
        .HasMany(setting => setting.Relationships)
        .WithOne(relationship => relationship.CampaignSetting)
        .HasForeignKey(relationship => relationship.CampaignSettingId);

    modelBuilder.Entity<SettingEntryRelationship>()
        .HasOne(relationship => relationship.SourceEntry)
        .WithMany(entry => entry.OutgoingRelationships)
        .HasForeignKey(relationship => relationship.SourceEntryId)
        .OnDelete(DeleteBehavior.Restrict);

    modelBuilder.Entity<SettingEntryRelationship>()
        .HasOne(relationship => relationship.TargetEntry)
        .WithMany(entry => entry.IncomingRelationships)
        .HasForeignKey(relationship => relationship.TargetEntryId)
        .OnDelete(DeleteBehavior.Restrict);
  }
}