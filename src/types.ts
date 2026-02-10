export type RawMessage = Record<string, unknown>;

export type Message = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
};
