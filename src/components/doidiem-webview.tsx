"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Clock3, Landmark, LoaderCircle, Plus, RefreshCw, ShieldCheck, Trash2, WalletCards, X } from "lucide-react";

type PaymentAccount = { id: number | string; payment_method: "bank" | "wallet"; bank_name: string; account_number: string; account_name: string; is_default: boolean };
type Withdrawal = { id: number | string; code?: string; amount: number; fee?: number; real_amount?: number; status: string; created_at?: string };
type ApiEnvelope<T> = { success: boolean; message?: string; data?: T };

declare global {
  interface Window { setAppToken?: (token: string) => void; ReactNativeWebView?: { postMessage(message: string): void }; AppBridge?: { postMessage(message: string): void } }
}

const money = new Intl.NumberFormat("vi-VN");
const minimumWithdrawal = 10_000;
const banks = ["Vietcombank", "Techcombank", "MB Bank", "BIDV", "VietinBank", "Agribank", "ACB", "VPBank", "TPBank", "Sacombank", "MoMo", "ZaloPay"];
const demoAccounts: PaymentAccount[] = [
  { id: 1, payment_method: "bank", bank_name: "Techcombank", account_number: "190123456", account_name: "NGUYEN VAN A", is_default: true },
  { id: 2, payment_method: "wallet", bank_name: "MoMo", account_number: "090•••4567", account_name: "NGUYEN VAN A", is_default: false }
];
const demoHistory: Withdrawal[] = [
  { id: 12, code: "WD8F3A21C", amount: 50000, real_amount: 50000, status: "pending", created_at: new Date().toISOString() },
  { id: 11, code: "WD2B91E10", amount: 120000, real_amount: 120000, status: "completed", created_at: new Date(Date.now() - 86400000 * 3).toISOString() }
];

function unwrapItems(value: unknown): PaymentAccount[] {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Array.isArray(record.items) ? record.items as PaymentAccount[] : Array.isArray(value) ? value as PaymentAccount[] : [];
}
function unwrapWithdrawals(value: unknown): Withdrawal[] {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return (Array.isArray(record.items) ? record.items : Array.isArray(record.withdrawals) ? record.withdrawals : Array.isArray(value) ? value : []) as Withdrawal[];
}
function maskAccount(value: string) { return value.length <= 6 || value.includes("•") ? value : `${value.slice(0, 3)}•••${value.slice(-4)}`; }

export function DoiDiemWebView() {
  const tokenRef = useRef("");
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const callApi = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}`, ...init?.headers } });
      const payload = await response.json() as ApiEnvelope<T>;
      if (response.status === 401) {
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "AUTH_REQUIRED" }));
        window.AppBridge?.postMessage(JSON.stringify({ type: "AUTH_REQUIRED" }));
      }
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Yêu cầu không thành công.");
      return payload.data as T;
    } finally { window.clearTimeout(timeout); }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true); setNotice("");
    try {
      const [account, paymentData, withdrawalData] = await Promise.all([
        callApi<Record<string, unknown>>("/api/webview/account"),
        callApi<unknown>("/api/webview/payment-accounts"),
        callApi<unknown>("/api/webview/withdrawals?page=1")
      ]);
      const wallet = account.wallet && typeof account.wallet === "object" ? account.wallet as Record<string, unknown> : {};
      setBalance(Number(wallet.balance ?? account.balance ?? 0));
      const nextAccounts = unwrapItems(paymentData);
      setAccounts(nextAccounts); setSelectedId(String(nextAccounts.find((item) => item.is_default)?.id ?? nextAccounts[0]?.id ?? ""));
      setHistory(unwrapWithdrawals(withdrawalData));
    } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể tải dữ liệu."); }
    finally { setLoading(false); }
  }, [callApi]);

  useEffect(() => {
    window.setAppToken = (token: string) => {
      if (typeof token !== "string" || !token.trim()) return;
      tokenRef.current = token.trim(); setReady(true); void loadData();
    };
    const localDemo = ["localhost", "127.0.0.1"].includes(window.location.hostname) && new URLSearchParams(window.location.search).get("demo") === "1";
    if (localDemo) {
      setDemo(true); setReady(true); setBalance(386500); setAccounts(demoAccounts); setSelectedId("1"); setHistory(demoHistory);
    }
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "WEBVIEW_READY" }));
    window.AppBridge?.postMessage(JSON.stringify({ type: "WEBVIEW_READY" }));
    return () => { delete window.setAppToken; tokenRef.current = ""; };
  }, [loadData]);

  const selected = accounts.find((item) => String(item.id) === selectedId);
  async function submitWithdrawal(event: FormEvent) {
    event.preventDefault();
    if (!selected) return setNotice("Vui lòng thêm hoặc chọn một tài khoản nhận tiền.");
    const withdrawalAmount = Number(amount);
    if (!Number.isInteger(withdrawalAmount) || withdrawalAmount < minimumWithdrawal) return setNotice(`Số tiền rút tối thiểu là ${money.format(minimumWithdrawal)} VNĐ.`);
    if (withdrawalAmount > balance) return setNotice(`Số dư không đủ. Bạn chỉ có thể rút tối đa ${money.format(balance)} VNĐ.`);
    if (demo) return setNotice("Đây là bản xem thử — chưa có giao dịch nào được tạo.");
    setSubmitting(true); setNotice("");
    try {
      const result = await callApi<Record<string, unknown>>("/api/webview/withdrawals", { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ amount: withdrawalAmount, payment_method: selected.payment_method, bank_name: selected.payment_method === "bank" ? selected.bank_name : undefined, wallet_name: selected.payment_method === "wallet" ? selected.bank_name : undefined, account_number: selected.account_number, account_name: selected.account_name }) });
      setNotice(String(result.message ?? "Đã tạo yêu cầu rút tiền hoàn thành công.")); setAmount(""); await loadData();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể tạo yêu cầu."); }
    finally { setSubmitting(false); }
  }

  async function setDefault(id: string | number) {
    if (demo) { setAccounts((items) => items.map((item) => ({ ...item, is_default: item.id === id }))); setSelectedId(String(id)); return; }
    try { await callApi(`/api/webview/payment-accounts/${id}/default`, { method: "POST" }); await loadData(); } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể cập nhật."); }
  }
  async function removeAccount(id: string | number) {
    if (!window.confirm("Xóa tài khoản nhận tiền này?")) return;
    if (demo) { setAccounts((items) => items.filter((item) => item.id !== id)); return; }
    try { await callApi(`/api/webview/payment-accounts/${id}`, { method: "DELETE" }); await loadData(); } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể xóa."); }
  }

  if (!ready) return <main className="dd-shell dd-wait"><div className="dd-wait-icon"><ShieldCheck /></div><h1>Rút tiền hoàn</h1><p>Đang xác minh tài khoản...</p><span>Vui lòng chờ một chút nhé.</span></main>;

  return <main className="dd-shell">
    <header className="dd-header"><div><span className="dd-eyebrow">QBOT CASHBACK</span><h1>Rút tiền hoàn</h1></div><button aria-label="Tải lại" onClick={() => demo ? undefined : void loadData()}><RefreshCw className={loading ? "dd-spin" : ""} /></button></header>
    {demo ? <div className="dd-demo"><span>DEMO</span> Giao diện xem thử, không phát sinh giao dịch</div> : null}
    <section className="dd-balance"><div className="dd-balance-top"><span>Số dư khả dụng</span><WalletCards /></div><strong>{money.format(balance)} ₫</strong><small>Tiền hoàn có thể rút</small><div className="dd-balance-shine" /></section>
    {notice ? <div className="dd-notice" role="status">{notice}<button aria-label="Đóng" onClick={() => setNotice("")}><X /></button></div> : null}
    <form onSubmit={submitWithdrawal} className="dd-card">
      <div className="dd-section-title"><div><span>01</span><div><h2>Số tiền muốn rút</h2><p>Tối thiểu {money.format(minimumWithdrawal)} VNĐ</p></div></div></div>
      <div className="dd-amount"><input aria-label="Số tiền muốn rút" type="number" min={minimumWithdrawal} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /><span>VNĐ</span></div>
      <div className="dd-quick">{[50000,100000,200000].map((value) => <button type="button" key={value} onClick={() => setAmount(String(value))}>{money.format(value)}</button>)}</div>
      <div className="dd-divider" />
      <div className="dd-section-title dd-payment-title"><div><span>02</span><div><h2>Tài khoản nhận tiền</h2><p>Chọn nơi bạn muốn nhận</p></div></div><button type="button" className="dd-add-link" onClick={() => setShowAdd(true)}><Plus /><span>Thêm tài khoản</span></button></div>
      <div className="dd-account-list">{accounts.map((item) => <label key={item.id} className={`dd-account ${selectedId === String(item.id) ? "selected" : ""}`}><input type="radio" name="payment-account" checked={selectedId === String(item.id)} onChange={() => setSelectedId(String(item.id))}/><div className="dd-bank-icon">{item.payment_method === "bank" ? <Landmark /> : <WalletCards />}</div><div className="dd-account-text"><strong>{item.bank_name} {item.is_default ? <em>Mặc định</em> : null}</strong><span>{maskAccount(item.account_number)} · {item.account_name}</span></div><Check className="dd-check"/><div className="dd-actions"><button type="button" onClick={(e) => { e.preventDefault(); void setDefault(item.id); }} title="Đặt mặc định"><Check /></button><button type="button" onClick={(e) => { e.preventDefault(); void removeAccount(item.id); }} title="Xóa"><Trash2 /></button></div></label>)}</div>
      {balance >= minimumWithdrawal ? <button className="dd-submit" disabled={submitting || !selected || Number(amount) < minimumWithdrawal || Number(amount) > balance}>{submitting ? <LoaderCircle className="dd-spin" /> : <><span>Rút tiền hoàn</span><ChevronRight /></>}</button> : <div className="dd-minimum-note"><ShieldCheck /><div><strong>Chưa đủ điều kiện rút tiền</strong><span>Số dư cần đạt tối thiểu {money.format(minimumWithdrawal)} VNĐ.</span></div></div>}
      <p className="dd-secure"><ShieldCheck /> Giao dịch được mã hóa và bảo vệ an toàn</p>
    </form>
    <section className="dd-card dd-history"><div className="dd-section-title"><div><span><Clock3 /></span><div><h2>Lịch sử rút tiền</h2><p>Các yêu cầu gần đây</p></div></div></div>{history.map((item) => <article key={item.id}><div><strong>{item.code || `#${item.id}`}</strong><span>{item.created_at ? new Date(item.created_at).toLocaleDateString("vi-VN") : "Gần đây"}</span></div><div><strong>-{money.format(Number(item.amount))}đ</strong><span className={`dd-status ${item.status}`}>{item.status === "completed" ? "Hoàn thành" : item.status === "pending" ? "Đang xử lý" : item.status}</span></div></article>)}</section>
    {showAdd ? <AddAccountModal demo={demo} onClose={() => setShowAdd(false)} onSaved={(item) => { setAccounts((old) => [...old, item]); setSelectedId(String(item.id)); setShowAdd(false); }} callApi={callApi} /> : null}
  </main>;
}

function AddAccountModal({ demo, onClose, onSaved, callApi }: { demo: boolean; onClose(): void; onSaved(item: PaymentAccount): void; callApi<T>(url: string, init?: RequestInit): Promise<T> }) {
  const [method, setMethod] = useState<"bank" | "wallet">("bank"); const [bank, setBank] = useState("Techcombank"); const [number, setNumber] = useState(""); const [name, setName] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function save(e: FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { const body = { payment_method: method, bank_name: bank, account_number: number, account_name: name.toUpperCase() }; const item = demo ? { id: Date.now(), ...body, is_default: false } : await callApi<PaymentAccount>("/api/webview/payment-accounts", { method: "POST", body: JSON.stringify(body) }); onSaved(item); } catch (err) { setError(err instanceof Error ? err.message : "Không thể lưu tài khoản."); } finally { setBusy(false); } }
  return <div className="dd-modal-backdrop"><form className="dd-modal" onSubmit={save}><div className="dd-modal-grip"/><div className="dd-modal-head"><div><h2>Thêm tài khoản nhận tiền</h2><p>Lưu một lần, sử dụng nhanh cho lần rút sau</p></div><button type="button" aria-label="Đóng" onClick={onClose}><X /></button></div>{error ? <div className="dd-notice">{error}</div> : null}<fieldset className="dd-method"><legend>Hình thức nhận tiền</legend><div><button type="button" className={method === "bank" ? "active" : ""} onClick={() => { setMethod("bank"); setBank("Techcombank"); }}><Landmark /><strong>Ngân hàng</strong></button><button type="button" className={method === "wallet" ? "active" : ""} onClick={() => { setMethod("wallet"); setBank("MoMo"); }}><WalletCards /><strong>Ví điện tử</strong></button></div></fieldset><div className="dd-form-fields"><label><span>{method === "bank" ? "Ngân hàng" : "Ví điện tử"}</span><div className="dd-control"><span className="dd-control-icon">{method === "bank" ? <Landmark /> : <WalletCards />}</span><select value={bank} onChange={(e) => setBank(e.target.value)}>{banks.filter((x) => method === "wallet" ? ["MoMo","ZaloPay"].includes(x) : !["MoMo","ZaloPay"].includes(x)).map((x) => <option key={x}>{x}</option>)}</select></div></label><label><span>{method === "bank" ? "Số tài khoản" : "Số điện thoại ví"}</span><div className="dd-control"><span className="dd-control-prefix">#</span><input required minLength={3} value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric" placeholder={method === "bank" ? "Ví dụ: 190123456" : "Ví dụ: 0901234567"}/></div></label><label><span>Tên chủ tài khoản</span><div className="dd-control"><span className="dd-control-prefix">Aa</span><input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="NGUYEN VAN A" className="uppercase"/></div><small className="dd-field-hint">Tên sẽ được tự động chuyển thành chữ in hoa</small></label></div><button className="dd-submit" disabled={busy}>{busy ? <LoaderCircle className="dd-spin"/> : "Lưu tài khoản"}</button></form></div>;
}
