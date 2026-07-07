const authBaseUrl = "https://hoantienmuahang.vn/api/v1/openapi/auth";

type AuthUser = {
  id?: string | number;
  email?: string;
  name?: string;
  phone?: string;
  balance?: number | string;
  [key: string]: unknown;
};

export type AuthSuccess = {
  status: "success";
  message: string;
  token: string;
  tokenType: string;
  user: AuthUser;
};

export type Auth2faChallenge = {
  status: "2fa";
  message: string;
  challengeToken: string;
  methods: string[];
};

export type AuthResult = AuthSuccess | Auth2faChallenge;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

async function postAuth(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${authBaseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = asRecord(await response.json().catch(() => ({})));

  if (!response.ok || data.success === false) {
    throw new Error(String(data.message ?? data.error ?? "Yêu cầu xác thực thất bại."));
  }

  return data;
}

function normalizeAuthResponse(data: Record<string, unknown>): AuthResult {
  const payload = asRecord(data.data);
  const challengeToken = String(payload.challenge_token ?? data.challenge_token ?? "");

  if (challengeToken) {
    const methods = payload.methods ?? data.methods;
    return {
      status: "2fa",
      message: String(data.message ?? "Tài khoản bật 2FA. Vui lòng nhập mã xác thực."),
      challengeToken,
      methods: Array.isArray(methods) ? methods.map(String) : []
    };
  }

  const token = String(payload.token ?? data.token ?? "");
  if (!token) {
    throw new Error(String(data.message ?? "API không trả access token."));
  }

  return {
    status: "success",
    message: String(data.message ?? "Đăng nhập thành công."),
    token,
    tokenType: String(payload.token_type ?? data.token_type ?? "Bearer"),
    user: asRecord(payload.user ?? data.user) as AuthUser
  };
}

export async function loginWithOpenApi(email: string, password: string, deviceName = "Webchat") {
  return normalizeAuthResponse(await postAuth("/login", { email, password, device_name: deviceName }));
}

export async function registerWithOpenApi(input: {
  email: string;
  password: string;
  passwordConfirmation: string;
  name?: string;
  phone?: string;
  referralCode?: string;
  deviceName?: string;
}) {
  return normalizeAuthResponse(
    await postAuth("/register", {
      email: input.email,
      password: input.password,
      password_confirmation: input.passwordConfirmation,
      name: input.name,
      phone: input.phone,
      referral_code: input.referralCode,
      device_name: input.deviceName ?? "Webchat"
    })
  );
}

export async function completeOpenApi2fa(challengeToken: string, code: string, method?: string) {
  return normalizeAuthResponse(
    await postAuth("/login/2fa", {
      challenge_token: challengeToken,
      google2fa_code: method === "email_otp" ? undefined : code,
      email_otp_code: method === "email_otp" ? code : undefined
    })
  );
}
