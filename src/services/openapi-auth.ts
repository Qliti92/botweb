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

export type AuthEmailVerification = {
  status: "verify-email";
  message: string;
  email: string;
};

export type AuthResult = AuthSuccess | Auth2faChallenge | AuthEmailVerification;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

const authFieldLabels: Record<string, string> = {
  email: "Email",
  password: "Mật khẩu",
  password_confirmation: "Xác nhận mật khẩu",
  name: "Họ tên",
  phone: "Số điện thoại",
  referral_code: "Mã giới thiệu",
  device_name: "Thiết bị"
};

function translateValidationMessage(field: string, message: string) {
  const normalized = message.trim().toLowerCase();
  if (field === "email" && /(already been taken|already exists|has been used|đã tồn tại|đã được sử dụng)/i.test(normalized)) {
    return "đã được đăng ký. Bạn hãy đăng nhập hoặc dùng email khác.";
  }
  if (field === "email" && /(valid email|invalid email|email.*valid)/i.test(normalized)) {
    return "chưa đúng định dạng. Ví dụ: ten@gmail.com.";
  }
  if (field === "password" && /(at least 8|minimum.*8|min.*8)/i.test(normalized)) {
    return "Mật khẩu cần có ít nhất 8 ký tự.";
  }
  if (field === "password_confirmation" && /(match|same|confirmation)/i.test(normalized)) {
    return "Hai mật khẩu chưa giống nhau.";
  }
  if (field === "phone" && /(valid|invalid)/i.test(normalized)) {
    return "Số điện thoại chưa đúng. Bạn có thể để trống mục này.";
  }
  return message.trim();
}

function validationDetails(data: Record<string, unknown>) {
  const payload = asRecord(data.data);
  const errors = asRecord(data.errors ?? payload.errors);
  return Object.entries(errors).flatMap(([field, value]) => {
    const messages = Array.isArray(value) ? value : [value];
    return messages
      .filter((message) => typeof message === "string" && message.trim())
      .map((message) => {
        const translated = translateValidationMessage(field, String(message));
        return translated.startsWith(`${authFieldLabels[field] ?? field}:`) ? translated : `${authFieldLabels[field] ?? field}: ${translated}`;
      });
  });
}

function friendlyAuthError(path: string, data: Record<string, unknown>) {
  const details = validationDetails(data);
  if (details.length) return details.join("\n");

  const rawMessage = String(data.message ?? data.error ?? "").trim();
  const genericInvalid = /dữ liệu.*không hợp lệ|invalid.*data|validation/i.test(rawMessage);
  if (path === "/login" && genericInvalid) {
    return "Email hoặc mật khẩu chưa đúng. Bạn kiểm tra lại rồi thử đăng nhập nhé.";
  }
  if (path === "/register" && genericInvalid) {
    return "Thông tin đăng ký chưa hợp lệ. Email phải đúng định dạng, mật khẩu có ít nhất 8 ký tự và hai mật khẩu phải giống nhau.";
  }
  return rawMessage || "Yêu cầu xác thực thất bại.";
}

async function postAuth(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${authBaseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = asRecord(await response.json().catch(() => ({})));

  if (!response.ok || data.success === false) {
    throw new Error(friendlyAuthError(path, data));
  }

  return data;
}

function normalizeAuthResponse(data: Record<string, unknown>): AuthResult {
  const payload = asRecord(data.data);
  const emailVerificationRequired = Boolean(payload.email_verification_required ?? data.email_verification_required);
  if (emailVerificationRequired) {
    return {
      status: "verify-email",
      message: String(data.message ?? "Mã xác minh đã được gửi tới email của bạn."),
      email: String(payload.email ?? data.email ?? "")
    };
  }
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

  const token = String(payload.token ?? payload.access_token ?? data.token ?? data.access_token ?? "");
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
  let data: Record<string, unknown>;
  try {
    data = await postAuth("/register", {
      email: input.email,
      password: input.password,
      password_confirmation: input.passwordConfirmation,
      name: input.name,
      phone: input.phone,
      referral_code: input.referralCode,
      device_name: input.deviceName ?? "Webchat"
    });
  } catch (registrationError) {
    // The upstream registration endpoint can create the account while still
    // returning a generic failure response. Verify the result by attempting
    // login before reporting registration as failed.
    try {
      return await loginWithOpenApi(input.email, input.password, input.deviceName ?? "Webchat");
    } catch {
      throw registrationError;
    }
  }
  const payload = asRecord(data.data);
  const hasToken = Boolean(payload.token ?? payload.access_token ?? data.token ?? data.access_token);
  const hasChallenge = Boolean(payload.challenge_token ?? data.challenge_token);
  const needsEmailVerification = Boolean(payload.email_verification_required ?? data.email_verification_required);

  // Some registration responses create the account but do not return an access
  // token. Complete the user journey by signing in with the new credentials.
  if (!hasToken && !hasChallenge && !needsEmailVerification) {
    return loginWithOpenApi(input.email, input.password, input.deviceName ?? "Webchat");
  }

  return normalizeAuthResponse(data);
}

export async function verifyEmailWithOpenApi(email: string, code: string) {
  return normalizeAuthResponse(await postAuth("/verify-email", {
    email,
    otp: code,
    code,
    email_otp_code: code
  }));
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

export async function forgotPasswordWithOpenApi(email: string) {
  const data = await postAuth("/forgot-password", { email });
  return String(data.message ?? "Đã gửi email đặt lại mật khẩu nếu tài khoản tồn tại.");
}
