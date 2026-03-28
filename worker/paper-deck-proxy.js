export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetHost = "rimagination-paper-deck.hf.space";
    const targetUrl = new URL(url.pathname + url.search, `https://${targetHost}`);

    const headers = new Headers(request.headers);
    headers.set("Host", targetHost);
    headers.set("Origin", `https://${targetHost}`);
    headers.set("Referer", `https://${targetHost}/`);
    headers.set("X-Forwarded-Host", url.host);
    headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("cf-visitor");

    const proxiedRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "follow",
    });

    try {
      const response = await fetch(proxiedRequest);
      const responseHeaders = new Headers(response.headers);
      const contentType = responseHeaders.get("content-type") || "";

      responseHeaders.delete("content-security-policy");
      responseHeaders.delete("content-security-policy-report-only");
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      responseHeaders.set("X-Proxy-By", "Cloudflare-Worker-PaperDeck");

      if (contentType.includes("text/html")) {
        responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        responseHeaders.set("Pragma", "no-cache");
        responseHeaders.set("Expires", "0");
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(`Proxy Error: ${error.message}`, {
        status: 502,
        statusText: "Bad Gateway",
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  },
};
