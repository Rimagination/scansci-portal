const UPSTREAM_ORIGIN = "https://rimagination.github.io";
const UPSTREAM_HOST = "rimagination.github.io";
const UPSTREAM_BASE_PATH = "/acti";

function toUpstreamUrl(requestUrl) {
  const url = new URL(requestUrl);
  let pathname = url.pathname;

  if (pathname === "/" || pathname === "") {
    pathname = `${UPSTREAM_BASE_PATH}/`;
  } else if (pathname === UPSTREAM_BASE_PATH) {
    pathname = `${UPSTREAM_BASE_PATH}/`;
  } else if (!pathname.startsWith(`${UPSTREAM_BASE_PATH}/`)) {
    pathname = `${UPSTREAM_BASE_PATH}${pathname}`;
  }

  return new URL(`${pathname}${url.search}`, UPSTREAM_ORIGIN);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    const incomingUrl = new URL(request.url);
    const targetUrl = toUpstreamUrl(request.url);
    const cacheSensitiveGet = request.method === "GET" || request.method === "HEAD";

    const headers = new Headers(request.headers);
    headers.set("Host", UPSTREAM_HOST);
    headers.set("Origin", UPSTREAM_ORIGIN);
    headers.set("Referer", `${UPSTREAM_ORIGIN}${UPSTREAM_BASE_PATH}/`);
    headers.set("X-Forwarded-Host", incomingUrl.host);
    headers.set("X-Forwarded-Proto", incomingUrl.protocol.replace(":", ""));
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("cf-visitor");
    headers.delete("cookie");
    headers.delete("if-none-match");
    headers.delete("if-modified-since");

    if (cacheSensitiveGet) {
      headers.set("Cache-Control", "no-cache, no-store, max-age=0");
      headers.set("Pragma", "no-cache");
    }

    const proxiedRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "follow",
    });

    try {
      const response = await fetch(proxiedRequest, {
        cf: {
          cacheEverything: false,
          cacheTtl: 0,
          cacheTtlByStatus: {
            "200-299": 0,
            "300-399": 0,
            "400-599": 0,
          },
        },
      });
      const responseHeaders = new Headers(response.headers);
      const contentType = responseHeaders.get("content-type") || "";
      const shouldDisableEdgeCache =
        contentType.includes("text/html") ||
        contentType.includes("text/css") ||
        contentType.includes("javascript") ||
        contentType.includes("application/json");

      responseHeaders.delete("content-security-policy");
      responseHeaders.delete("content-security-policy-report-only");
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      responseHeaders.set("X-Proxy-By", "Cloudflare-Worker-ACTI");

      if (shouldDisableEdgeCache) {
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
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
  },
};
