// User Interfaces
export interface User {
  _id: string; // MongoDB ObjectId
  id?: string; // Alias cho _id (nếu backend trả về id)
  cookies: string;
  cookiesFull?: any;
  username?: string;
  avatar?: string;
  userData?: any;
  cartCapacity: number;
  cartAssignment?: string;
  cartRealState?: string;
  name?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  productLinks?: ProductLink[];
  sampleProducts?: SampleProduct[];
  lastPreparedAt?: string;
  lastPreparationSummary?: PreparationSummary;
  lastRealCartAddedAt?: string;
  lastRealCartSummary?: RealCartSummary;
  currentLiveSessionId?: number;
  cookieStatus?: 'valid' | 'invalid';
}

// Product Link Interfaces
export interface ProductLink {
  _id: string; // MongoDB ObjectId
  id?: string; // Alias cho _id (nếu backend trả về id)
  shopId: string;
  itemId: string;
  fullUrl: string;
  productName?: string;
  description?: string;
  isAssigned: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  userId: string; // MongoDB ObjectId
}

// Sample Product Interfaces
export interface SampleProduct {
  _id: string; // MongoDB ObjectId
  id?: string; // Alias cho _id (nếu backend trả về id)
  sampleLink: string;
  productName?: string;
  description?: string;
  shopId?: string;
  itemId?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  userId: string; // MongoDB ObjectId
}

// DTO Interfaces
export interface CreateUserDto {
  cookies: string;
  cookiesFull?: any;
  username?: string;
  avatar?: string;
  userData?: any;
  cartCapacity?: number;
  cartAssignment?: string;
  cartRealState?: string;
  name?: string;
  description?: string;
}

export interface CreateProductLinkDto {
  fullUrl: string;
  productName?: string;
  description?: string;
  userId: string; // MongoDB ObjectId
}

export interface CreateSampleProductDto {
  sampleLink: string;
  productName?: string;
  description?: string;
  userId: string; // MongoDB ObjectId
}

// Live Session Config
export interface LiveSessionConfig {
  _id: string;
  userId: string;
  numberOfSessions: number;
  minAtc: number;
  minRevenue: number;
  productClicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLiveSessionConfigDto {
  numberOfSessions?: number;
  minAtc?: number;
  minRevenue?: number;
  productClicks?: number;
}

// Cart Preparation
export interface PrepareProductsDto {
  numberOfSessions?: number;
  minAtc?: number;
  minRevenue?: number;
  productClicks?: number;
}

export interface PreparedItem {
  itemId: string;
  shopId: string;
  source: 'live' | 'warehouse' | 'sample';
  productName?: string;
  productLinkId: string | null; // ObjectId hoặc null nếu sample không có trong warehouse
  atc?: number;
  revenue?: number;
}

export interface PreparationSummary {
  cartCapacity: number;
  sampleProductCount: number;
  remainingSlots: number;
  liveSession: {
    sessionIds: number[];
    sessionTitles: string;
    totalItemsFromLive: number;
    itemsMappedToWarehouse: number;
  };
  sample?: {
    totalSamples: number;
    itemsAdded: number;
    itemsSkippedInvalid: number;
    itemsSkippedDuplicate: number;
  };
  warehouse: {
    totalAvailable: number;
    randomSelected: number;
  };
  final: {
    totalItems: number;
    itemsFromLive: number;
    itemsFromSample?: number;
    itemsFromWarehouse: number;
  };
  deletedUnusedLinks?: number;
}

export interface PrepareProductsResult {
  success: boolean;
  summary: PreparationSummary;
  items: PreparedItem[];
  error?: string;
}

// Real Cart Summary
export interface RealCartSummary {
  totalItems: number;
  batches: number;
  successItems: number;
  failedItems: number;
  sessionId: number;
  executedAt: string;
  batchesDetail: {
    total: number;
    successful: number;
    failed: number;
  };
  failedItemsDetail?: Array<{
    itemId: number;
    shopId: number;
    error: string;
  }>;
}

export interface RealCartResult {
  success: boolean;
  totalItems: number;
  batches: number;
  successItems: number;
  failedItems: number;
  sessionId: number;
  summary: RealCartSummary;
}

export interface ClearRealCartResult {
  success: boolean;
  deletedCount: number;
  message: string;
}

export interface LiveStatus {
  isLive: boolean;
  sessionId?: number;
  sessionTitle?: string;
}

export interface SessionInfo {
  sessionId: number;
  title: string;
  duration: number;
  startTime?: number;
  atc?: number;
  confirmedOrders?: number;
  confirmedSales?: number;
}

// Swap Queue Interfaces
export interface SwapQueueItem {
  _id: string; // MongoDB ObjectId
  id?: string; // Alias cho _id (nếu backend trả về id)
  userId: string; // MongoDB ObjectId
  status: 'pending' | 'processed' | 'fail';
  priority?: number;
  notes?: string;
  errorMessage?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface CreateSwapQueueDto {
  userId: string; // MongoDB ObjectId (required)
  priority?: number;
  notes?: string;
}

export interface UpdateSwapQueueDto {
  priority?: number;
  notes?: string;
  status?: 'pending' | 'processed' | 'fail';
}
