using Microsoft.AspNetCore.Mvc;

namespace Lorebound.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            application = "Lorebound API"
        });
    }
}