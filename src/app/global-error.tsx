"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "#f4f6f8", color: "#30343b", fontFamily: "Arial, sans-serif" }}>
          <section style={{ width: "100%", maxWidth: 480, padding: 28, borderRadius: 24, background: "#fff", border: "1px solid #d6e4de", textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: 26 }}>Website tạm thời gặp sự cố</h1>
            <p style={{ margin: "14px 0 22px", color: "#666", lineHeight: 1.6 }}>Hãy thử tải lại. Nếu lỗi vẫn còn, bạn có thể quay lại sau ít phút.</p>
            <button type="button" onClick={reset} style={{ minHeight: 48, padding: "0 22px", border: 0, borderRadius: 12, background: "#287a63", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Tải lại website</button>
          </section>
        </main>
      </body>
    </html>
  );
}
