const EXTENSION_ID_KEY = 'shopee_manager_extension_id';

type RuntimeSendMessage = (
  extensionId: string,
  message: any,
  optionsOrCallback?: any,
  responseCallback?: (response: any) => void
) => void;

type ChromeRuntime = {
  id?: string;
  lastError?: { message?: string };
  sendMessage: RuntimeSendMessage;
};

declare global {
  interface Window {
    chrome?: {
      runtime?: ChromeRuntime;
    };
  }
}

export const getStoredExtensionId = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(EXTENSION_ID_KEY) || '';
};

export const saveExtensionId = (id: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EXTENSION_ID_KEY, id);
};

export const canUseChromeRuntime = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.chrome?.runtime?.sendMessage);
};

const sendMessage = <T = any>(
  extensionId: string,
  payload: any
): Promise<T> => {
  if (!canUseChromeRuntime() || typeof window === 'undefined' || !window.chrome?.runtime) {
    return Promise.reject(new Error('Trình duyệt không hỗ trợ Chrome Extension API'));
  }

  return new Promise((resolve, reject) => {
    const runtime = window.chrome!.runtime!;
    try {
      runtime.sendMessage(extensionId, payload, (response: T) => {
        if (runtime.lastError) {
          reject(new Error(runtime.lastError.message || 'Không thể giao tiếp với extension'));
          return;
        }
        resolve(response);
      });
    } catch (error: any) {
      reject(error);
    }
  });
};

export const pingExtension = async (extensionId: string) => {
  const response = await sendMessage<{ ok: boolean; error?: string }>(extensionId, {
    cmd: 'getPoolStats',
  });
  if (!response?.ok) {
    throw new Error(response?.error || 'Extension không phản hồi hợp lệ');
  }
};

interface CollectCartPayload {
  sid: number;
  executionId?: string;
  username?: string;
  groupId?: string;
}

interface CollectCartResponse {
  ok: boolean;
  error?: string;
  result?: {
    pairs?: Array<{ item_id?: number; itemId?: number; shop_id?: number; shopId?: number }>;
  };
}

export const requestCartPairs = async (
  extensionId: string,
  payload: CollectCartPayload
) => {
  const response = await sendMessage<CollectCartResponse>(extensionId, {
    cmd: 'collect',
    ...payload,
  });

  if (!response?.ok || !response.result?.pairs) {
    throw new Error(response?.error || 'Extension không trả về dữ liệu giỏ hàng');
  }

  return response.result.pairs;
};

export {};

