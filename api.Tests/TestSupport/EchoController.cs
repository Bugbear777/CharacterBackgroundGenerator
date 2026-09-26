using Lorebound.Api.Dtos.Entries;
using Microsoft.AspNetCore.Mvc;

namespace Lorebound.Api.Tests.TestSupport;

[ApiController]
[Route("test/echo")]
public class EchoController : ControllerBase
{
  [HttpPost("entry")]
  public SettingEntryDto Entry(SettingEntryDto dto) => dto;
}
