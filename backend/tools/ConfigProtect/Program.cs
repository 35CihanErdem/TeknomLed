using TeknomLed.Infrastructure.Configuration;

if (args.Length == 0)
{
    Console.Error.WriteLine("Usage: ConfigProtect <plaintext>");
    Console.Error.WriteLine("       ConfigProtect --unprotect <enc:...>");
    return 1;
}

if (args[0] is "--unprotect" or "-d")
{
    if (args.Length < 2)
    {
        Console.Error.WriteLine("Missing value to unprotect.");
        return 1;
    }

    Console.WriteLine(ConfigCrypto.UnprotectIfNeeded(args[1]));
    return 0;
}

Console.WriteLine(ConfigCrypto.Protect(args[0]));
return 0;
