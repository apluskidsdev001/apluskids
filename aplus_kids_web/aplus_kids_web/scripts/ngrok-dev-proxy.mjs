import http from "node:http";

const listenPort = Number(process.env.SHARE_PROXY_PORT || 8090);
const frontend = { hostname: "127.0.0.1", port: 3000 };
const backend = { hostname: "127.0.0.1", port: 8081 };

function destination(pathname = "/") {
  return pathname.startsWith("/api/") ? backend : frontend;
}

const server = http.createServer((request, response) => {
  const target = destination(request.url);
  const headers = { ...request.headers, host: `${target.hostname}:${target.port}` };
  const proxyRequest = http.request({
    hostname: target.hostname,
    port: target.port,
    method: request.method,
    path: request.url,
    headers,
  }, (proxyResponse) => {
    response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
    proxyResponse.pipe(response);
  });

  proxyRequest.on("error", (error) => {
    if (!response.headersSent) response.writeHead(502, { "content-type": "text/plain" });
    response.end(`Local service unavailable: ${error.message}`);
  });
  request.pipe(proxyRequest);
});

server.on("upgrade", (request, socket, head) => {
  const target = destination(request.url);
  const proxyRequest = http.request({
    hostname: target.hostname,
    port: target.port,
    method: request.method,
    path: request.url,
    headers: { ...request.headers, host: `${target.hostname}:${target.port}` },
  });
  proxyRequest.on("upgrade", (proxyResponse, proxySocket, proxyHead) => {
    socket.write(`HTTP/1.1 101 Switching Protocols\r\n${Object.entries(proxyResponse.headers).map(([key, value]) => `${key}: ${value}`).join("\r\n")}\r\n\r\n`);
    if (proxyHead.length) socket.write(proxyHead);
    if (head.length) proxySocket.write(head);
    proxySocket.pipe(socket).pipe(proxySocket);
  });
  proxyRequest.on("error", () => socket.destroy());
  proxyRequest.end();
});

server.listen(listenPort, "127.0.0.1", () => {
  console.log(`A+ Kids share proxy listening on http://127.0.0.1:${listenPort}`);
});
