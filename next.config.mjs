/** @type {import('next').NextConfig} */
const privateDataHeaders = [
  { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" }
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/api/chat/:path*", headers: privateDataHeaders },
      { source: "/api/admin/:path*", headers: privateDataHeaders },
      { source: "/api/webview/:path*", headers: privateDataHeaders },
      { source: "/apps/:path*", headers: privateDataHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" }] }
    ];
  }
};

export default nextConfig;
