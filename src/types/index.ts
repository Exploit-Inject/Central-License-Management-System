import { ObjectId } from "mongodb";

export type LicenseType = "single" | "yearly" | "reseller";
export type LicenseStatus = "active" | "suspended";

export interface IProduct {
  _id?: ObjectId | string;
  name: string;
  slug: string;
  created_at: Date;
}

export interface ILicense {
  _id?: ObjectId | string;
  product_id: string; // Product slug or ObjectId string
  product_name?: string;
  product_slug?: string;
  license_key: string;
  license_type: LicenseType;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  activated_domain?: string | null;
  expiry_date?: string | null; // YYYY-MM-DD
  status: LicenseStatus;
  created_at: Date;
}

export interface IResellerDomain {
  _id?: ObjectId | string;
  license_key: string;
  domain: string;
  last_verified: Date;
}

export interface IAdmin {
  _id?: ObjectId | string;
  username: string;
  password: string; // bcrypt hash
  created_at: Date;
}

export interface IDashboardStats {
  total: number;
  active: number;
  suspended: number;
  products: number;
}

