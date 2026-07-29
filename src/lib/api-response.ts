export type ApiResponseData = Record<string, unknown>;

export class ApiResponseError extends Error {
  constructor(message: string, public readonly httpStatus: number, public readonly apiResponse?: string) {
    super(message);
    this.name = "ApiResponseError";
  }
}

export async function readApiResponse(response: Response, fallbackMessage: string): Promise<ApiResponseData> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiResponseError(response.ok
      ? fallbackMessage
      : "Máy chủ đang gặp sự cố. Bạn vui lòng thử lại sau.", response.status);
  }

  try {
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Invalid response body");
    }
    return data as ApiResponseData;
  } catch {
    throw new ApiResponseError(response.ok
      ? fallbackMessage
      : "Máy chủ trả về dữ liệu không hợp lệ. Bạn vui lòng thử lại sau.", response.status);
  }
}

export function friendlyRequestError(error: unknown, fallbackMessage: string) {
  if (error instanceof TypeError) {
    return "Không thể kết nối tới máy chủ. Bạn kiểm tra mạng rồi thử lại nhé.";
  }
  return error instanceof Error && error.message ? error.message : fallbackMessage;
}
