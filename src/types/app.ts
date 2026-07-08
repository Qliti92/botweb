export type ChatMessage = {
  id: string;
  sender: "USER" | "BOT" | "SYSTEM";
  content: string;
  createdAt: string;
};

export type ChatSessionPayload = {
  id: string;
  user: null | {
    id: string;
    phone: string;
    email: string;
    userId: string;
    name?: string;
    balance?: number | string;
  };
  messages: ChatMessage[];
};

export type ChatHistoryItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  messageCount: number;
};

export type ApiConfigDto = {
  id: string;
  name: string;
  key: string;
  endpoint: string;
  method: "GET" | "POST";
  headers: string;
  bodySample: string;
  description?: string | null;
  isActive: boolean;
};

export type FlowDto = {
  id: string;
  flowKey: string;
  title: string;
  triggerKeyword?: string | null;
  botMessage: string;
  expectedInputType?: string | null;
  nextFlowKey?: string | null;
  actionType?: string | null;
  apiId?: string | null;
  isActive: boolean;
};

export type AppNoticeDto = {
  id: string;
  title: string;
  message: string;
  displaySeconds: number;
  isActive: boolean;
  updatedAt?: string;
};
