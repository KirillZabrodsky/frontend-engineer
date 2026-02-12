export type MessageQuery = {
  after?: string;
  before?: string;
  limit?: number;
};

export type FetchMessagesParams = {
  baseUrl: string;
  token: string;
  after?: string;
  before?: string;
  limit?: number;
  signal?: AbortSignal;
};

export type SendMessageParams = {
  baseUrl: string;
  token: string;
  message: string;
  author: string;
  signal?: AbortSignal;
};
