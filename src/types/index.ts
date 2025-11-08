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
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLiveSessionConfigDto {
  numberOfSessions?: number;
  minAtc?: number;
  minRevenue?: number;
}

// Cart Preparation
export interface PrepareProductsDto {
  numberOfSessions?: number;
  minAtc?: number;
  minRevenue?: number;
}

export interface PreparedItem {
  itemId: string;
  shopId: string;
  source: 'live' | 'warehouse';
  productName?: string;
  productLinkId: string; // ObjectId
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
  warehouse: {
    totalAvailable: number;
    randomSelected: number;
  };
  final: {
    totalItems: number;
    itemsFromLive: number;
    itemsFromWarehouse: number;
  };
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
