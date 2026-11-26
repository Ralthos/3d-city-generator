// Windows launcher for the 3D Procedural City Generator.
// The whole dist/ folder is embedded in the .exe as resources (see build-exe.ps1).
// Running the .exe starts a small web server on 127.0.0.1 and opens the city in an
// Edge app window (or the default browser), so no Node.js or install is needed.
// Written for the C# 5 compiler that ships with Windows (.NET Framework 4).
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;

[assembly: AssemblyTitle("3D Procedural City Generator")]
[assembly: AssemblyProduct("3D Procedural City Generator")]
[assembly: AssemblyVersion("1.1.0.0")]

static class CityLauncher
{
    static readonly Assembly App = Assembly.GetExecutingAssembly();
    static readonly Dictionary<string, string> Types = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        { ".html", "text/html; charset=utf-8" },
        { ".css", "text/css; charset=utf-8" },
        { ".js", "text/javascript; charset=utf-8" },
        { ".mjs", "text/javascript; charset=utf-8" },
        { ".txt", "text/plain; charset=utf-8" },
        { ".json", "application/json" },
        { ".png", "image/png" },
        { ".ico", "image/x-icon" }
    };

    static int Main(string[] args)
    {
        Console.Title = "3D Procedural City Generator";
        if (App.GetManifestResourceStream("dist/index.html") == null)
        {
            Console.WriteLine("This build is missing its embedded city files. Rebuild it with build-exe.ps1.");
            Pause();
            return 1;
        }

        TcpListener listener = StartListener();
        int port = ((IPEndPoint)listener.LocalEndpoint).Port;
        string url = "http://127.0.0.1:" + port + "/";

        Console.WriteLine();
        Console.WriteLine("  3D Procedural City Generator is running.");
        Console.WriteLine();
        Console.WriteLine("  Address: " + url);
        Console.WriteLine("  If no window opened, paste the address into your browser.");
        Console.WriteLine();
        Console.WriteLine("  Keep this window open while you use the city. Close it to quit.");
        Console.WriteLine();

        if (Array.IndexOf(args, "--no-browser") < 0) OpenWindow(url);

        while (true)
        {
            TcpClient client = listener.AcceptTcpClient();
            ThreadPool.QueueUserWorkItem(Handle, client);
        }
    }

    // Prefer the project's usual port; fall back to the next free one, then any free port.
    static TcpListener StartListener()
    {
        for (int port = 4173; port < 4193; port++)
        {
            try
            {
                TcpListener candidate = new TcpListener(IPAddress.Loopback, port);
                candidate.Start();
                return candidate;
            }
            catch (SocketException) { }
        }
        TcpListener any = new TcpListener(IPAddress.Loopback, 0);
        any.Start();
        return any;
    }

    static void OpenWindow(string url)
    {
        string[] edgePaths =
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe")
        };
        foreach (string edge in edgePaths)
        {
            if (!File.Exists(edge)) continue;
            try
            {
                Process.Start(edge, "--app=" + url + " --window-size=1400,900");
                return;
            }
            catch (Exception) { }
        }
        try { Process.Start(url); }
        catch (Exception) { Console.WriteLine("  Could not open a browser automatically."); }
    }

    static void Handle(object state)
    {
        TcpClient client = (TcpClient)state;
        try
        {
            client.ReceiveTimeout = 5000;
            client.SendTimeout = 10000;
            NetworkStream stream = client.GetStream();
            string requestLine = ReadRequestLine(stream);
            if (requestLine == null) return;

            string[] parts = requestLine.Split(' ');
            if (parts.Length < 2) { Send(stream, 400, "Bad Request", "text/plain", null, false); return; }
            string method = parts[0];
            bool head = method == "HEAD";
            if (method != "GET" && !head) { Send(stream, 405, "Method Not Allowed", "text/plain", null, false); return; }

            string path = parts[1];
            int query = path.IndexOfAny(new[] { '?', '#' });
            if (query >= 0) path = path.Substring(0, query);
            try { path = Uri.UnescapeDataString(path); }
            catch (Exception) { Send(stream, 400, "Bad Request", "text/plain", null, false); return; }
            if (path == "/" || path == "") path = "/index.html";
            if (path.Contains("..") || path.Contains("\\")) { Send(stream, 403, "Forbidden", "text/plain", null, false); return; }

            byte[] body = ReadResource("dist" + path);
            if (body == null) { Send(stream, 404, "Not Found", "text/plain", Encoding.UTF8.GetBytes("Not found"), head); return; }

            string type;
            if (!Types.TryGetValue(Path.GetExtension(path), out type)) type = "application/octet-stream";
            Send(stream, 200, "OK", type, body, head);
        }
        catch (Exception) { }
        finally { client.Close(); }
    }

    // Reads the request headers and returns the first line ("GET /path HTTP/1.1").
    static string ReadRequestLine(NetworkStream stream)
    {
        byte[] buffer = new byte[16384];
        int total = 0;
        while (total < buffer.Length)
        {
            int read = stream.Read(buffer, total, buffer.Length - total);
            if (read <= 0) break;
            total += read;
            string text = Encoding.ASCII.GetString(buffer, 0, total);
            if (text.Contains("\r\n\r\n") || text.Contains("\n\n"))
            {
                int end = text.IndexOf('\n');
                return text.Substring(0, end).TrimEnd('\r');
            }
        }
        return null;
    }

    static byte[] ReadResource(string name)
    {
        using (Stream resource = App.GetManifestResourceStream(name))
        {
            if (resource == null) return null;
            using (MemoryStream copy = new MemoryStream())
            {
                resource.CopyTo(copy);
                return copy.ToArray();
            }
        }
    }

    static void Send(NetworkStream stream, int status, string reason, string type, byte[] body, bool headOnly)
    {
        int length = body == null ? 0 : body.Length;
        string header = "HTTP/1.1 " + status + " " + reason + "\r\n" +
                        "Content-Type: " + type + "\r\n" +
                        "Content-Length: " + length + "\r\n" +
                        "Cache-Control: no-cache\r\n" +
                        "X-Content-Type-Options: nosniff\r\n" +
                        "Connection: close\r\n\r\n";
        byte[] headerBytes = Encoding.ASCII.GetBytes(header);
        stream.Write(headerBytes, 0, headerBytes.Length);
        if (!headOnly && body != null) stream.Write(body, 0, body.Length);
        stream.Flush();
    }

    static void Pause()
    {
        Console.WriteLine("Press any key to close.");
        try { Console.ReadKey(true); } catch (Exception) { }
    }
}
