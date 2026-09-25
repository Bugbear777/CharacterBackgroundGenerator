namespace Lorebound.Api.Errors;

public class ConflictException : Exception
{
  public ConflictException(string message = "The request conflicts with the current state of the resource.")
      : base(message)
  {
  }
}
