"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";

export function AdminLoginForm() {
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Không thể đăng nhập.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-brand-line bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-red text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Admin Login</h1>
          <p className="text-sm text-neutral-500">Quản trị chatbot</p>
        </div>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-medium">Tài khoản admin</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-md border border-brand-line px-3 outline-none focus:border-brand-red" />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-medium">Mật khẩu</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-md border border-brand-line px-3 outline-none focus:border-brand-red" />
      </label>

      {error ? <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <button disabled={loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-red font-semibold text-white disabled:opacity-60">
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
