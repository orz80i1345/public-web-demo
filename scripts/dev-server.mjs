import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);

let host = "0.0.0.0";
let port = 3000;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if ((arg === "--host" || arg === "-H") && args[index + 1]) {
    host = args[index + 1];
    index += 1;
  } else if (arg.startsWith("--host=")) {
    host = arg.slice("--host=".length);
  } else if ((arg === "--port" || arg === "-p") && args[index + 1]) {
    port = Number(args[index + 1]);
    index += 1;
  } else if (arg.startsWith("--port=")) {
    port = Number(arg.slice("--port=".length));
  }
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = resolve(join(root, normalizedPath));

  if (!filePath.startsWith(root)) {
    return null;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  return filePath;
}

const server = createServer((request, response) => {
  const filePath = resolveRequestPath(request.url ?? "/");

  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream",
  });

  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Static server running at http://${host}:${port}/`);
});
