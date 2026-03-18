// Paper Atlas 反向代理 Worker
// 将 paperatlas.scansci.com 代理到 rimagination-paper-atlas.hf.space

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 目标 Hugging Face Space URL
    const targetHost = "rimagination-paper-atlas.hf.space";
    const targetUrl = new URL(url.pathname + url.search, `https://${targetHost}`);

    // 创建新的请求头
    const headers = new Headers(request.headers);
    headers.set("Host", targetHost);

    // 删除可能干扰 Cloudflare 代理的头
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("x-forwarded-proto");
    headers.delete("x-forwarded-for");

    // 构建代理请求
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: "manual"
    });

    try {
      // 转发请求到 HF Space
      const response = await fetch(modifiedRequest);

      // 创建新的响应，修改响应头
      const modifiedHeaders = new Headers(response.headers);

      // 删除安全相关的头，避免 CSP 等问题
      modifiedHeaders.delete("content-security-policy");
      modifiedHeaders.delete("content-security-policy-report-only");

      // 添加自定义头标识代理
      modifiedHeaders.set("X-Proxy-By", "Cloudflare-Worker-PaperAtlas");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: modifiedHeaders
      });
    } catch (error) {
      return new Response(`Proxy Error: ${error.message}`, {
        status: 502,
        statusText: "Bad Gateway"
      });
    }
  }
};
