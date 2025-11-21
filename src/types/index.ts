export interface Item {
  id: string;
  name: string;
  price_cents: number;
  stock: number;
  active: boolean;
  featured?: boolean;
  img_url: string | null;
  hero_img_url: string | null;
  created_at: string;
  isbn?: string | null;
  isbn_10?: string | null;
  author?: string | null;
  description?: string | null;
  publish_year?: number | null;
  open_library_id?: string | null;
  publisher?: string | null;
  page_count?: number | null;
  on_sale?: boolean;
  sale_price_cents?: number | null;
  sale_percentage?: number | null;
  sale_ends_at?: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: string | null;
}

export interface Cart {
  id: string;
  user_id: string | null;
  created_at: string;
}

export interface CartItem {
  cart_id: string;
  item_id: string;
  qty: number;
  items?: Item;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_email: string | null;
  total_cents: number;
  shipping_address_id: string | null;
  created_at: string;
}

export interface OrderItem {
  order_id: string;
  item_id: string;
  qty: number;
  price_cents: number;
  items?: Item;
}

export interface OrderFulfillment {
  id: string;
  order_id: string;
  item_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipped_qty: number;
  tracking_number: string | null;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
  shipped_at: string | null;
  created_at: string;
}

export interface ShippingAddress {
  id: string;
  profile_id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Discount {
  code: string;
  pct_off: number | null;
  expires_at: string | null;
  used_count: number;
  max_uses: number | null;
  active: boolean;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  isbn?: string[];
  publish_year?: number[];
  publisher?: string[];
  number_of_pages?: number;
  first_publish_year?: number;
  cover_i?: number;
  cover?: {
    large?: string;
    medium?: string;
    small?: string;
  };
  description?: string;
}
