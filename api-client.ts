import {
  useQuery,
  useMutation,
  UseQueryOptions,
} from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "/api";

function getToken(): string | null {
  return typeof window !== "undefined"
    ? localStorage.getItem("haxnex_token")
    : null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers ?? {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ---- Types ----

export type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
};

export type ProductCategory = "tshirts" | "hoodies";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: ProductCategory;
  sizes: string[];
  badge?: string;
  rating: number;
  reviewCount: number;
  fabric: string;
};

export type Review = {
  id: string;
  name: string;
  product: string;
  text: string;
  rating: number;
  tag?: string;
  approved: boolean;
  createdAt: string;
};

export type OrderInputPaymentMethod = "razorpay" | "upi" | "cod" | "bank";

export type OrderStatusUpdateStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type CartItemInput = {
  productId: string;
  quantity: number;
  size: string;
};

export type CartItem = CartItemInput & {
  itemId: string;
  name: string;
  price: number;
  image: string;
};

export type Cart = {
  items: CartItem[];
  total: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
};

export type ShippingAddress = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  notes?: string;
};

export type Order = {
  id: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: OrderInputPaymentMethod;
  paymentStatus: string;
  status: OrderStatusUpdateStatus;
  total: number;
  createdAt: string;
};

export type AdminStats = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalUsers: number;
  totalProducts: number;
  newEnquiries: number;
  recentOrders: Order[];
};

export type Enquiry = {
  id: string;
  name: string;
  contact: string;
  type: string;
  message: string;
  status: string;
  createdAt: string;
};

// ---- Auth ----

export const getGetMeQueryKey = () => ["me"] as const;

export function useGetMe(options?: {
  query?: Partial<UseQueryOptions<User>>;
}) {
  return useQuery<User>({
    queryKey: getGetMeQueryKey(),
    queryFn: () => apiFetch<User>("/auth/me"),
    ...options?.query,
  });
}

export function useLogin() {
  return useMutation<
    { token: string; user: User },
    Error,
    { data: { email: string; password: string } }
  >({
    mutationFn: ({ data }) =>
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useRegister() {
  return useMutation<
    { token: string; user: User },
    Error,
    { data: { name: string; email: string; password: string } }
  >({
    mutationFn: ({ data }) =>
      apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// ---- Products ----

export function useListProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => apiFetch<Product[]>("/products"),
  });
}

export function useCreateProduct() {
  return useMutation<Product, Error, { data: Partial<Product> }>({
    mutationFn: ({ data }) =>
      apiFetch("/products", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useUpdateProduct() {
  return useMutation<Product, Error, { id: string; data: Partial<Product> }>({
    mutationFn: ({ id, data }) =>
      apiFetch(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });
}

export function useDeleteProduct() {
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) =>
      apiFetch(`/products/${id}`, { method: "DELETE" }),
  });
}

// ---- Reviews ----

export function useListReviews() {
  return useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: () => apiFetch<Review[]>("/reviews"),
  });
}

export function useCreateReview() {
  return useMutation<
    Review,
    Error,
    { data: { name: string; product: string; rating: number; text: string; tag?: string } }
  >({
    mutationFn: ({ data }) =>
      apiFetch("/reviews", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useListAdminReviews() {
  return useQuery<Review[]>({
    queryKey: ["admin", "reviews"],
    queryFn: () => apiFetch<Review[]>("/admin/reviews"),
  });
}

export function useUpdateReviewStatus() {
  return useMutation<Review, Error, { id: string; data: { approved: boolean } }>({
    mutationFn: ({ id, data }) =>
      apiFetch(`/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  });
}

// ---- Enquiries ----

export function useCreateEnquiry() {
  return useMutation<
    Enquiry,
    Error,
    { data: { name: string; contact: string; type: string; message: string } }
  >({
    mutationFn: ({ data }) =>
      apiFetch("/enquiries", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useListAdminEnquiries() {
  return useQuery<Enquiry[]>({
    queryKey: ["admin", "enquiries"],
    queryFn: () => apiFetch<Enquiry[]>("/admin/enquiries"),
  });
}

export function useUpdateEnquiryStatus() {
  return useMutation<Enquiry, Error, { id: string; data: { status: string } }>({
    mutationFn: ({ id, data }) =>
      apiFetch(`/admin/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  });
}

// ---- Orders ----

export const getListOrdersQueryKey = () => ["orders"] as const;

export function useListOrders(options?: {
  query?: Partial<UseQueryOptions<Order[]>>;
}) {
  return useQuery<Order[]>({
    queryKey: getListOrdersQueryKey(),
    queryFn: () => apiFetch<Order[]>("/orders"),
    ...options?.query,
  });
}

export function useCreateOrder() {
  return useMutation<
    Order,
    Error,
    { data: { items: OrderItem[]; shippingAddress: ShippingAddress; paymentMethod: OrderInputPaymentMethod } }
  >({
    mutationFn: ({ data }) =>
      apiFetch("/orders", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function usePayOrder() {
  return useMutation<
    Order,
    Error,
    { id: string; data: { method: OrderInputPaymentMethod; razorpayPaymentId?: string } }
  >({
    mutationFn: ({ id, data }) =>
      apiFetch(`/orders/${id}/pay`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useListAdminOrders() {
  return useQuery<Order[]>({
    queryKey: ["admin", "orders"],
    queryFn: () => apiFetch<Order[]>("/admin/orders"),
  });
}

export function useUpdateOrderStatus() {
  return useMutation<
    Order,
    Error,
    { id: string; data: { status: OrderStatusUpdateStatus } }
  >({
    mutationFn: ({ id, data }) =>
      apiFetch(`/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  });
}

// ---- Cart ----

export const getGetCartQueryKey = () => ["cart"] as const;

export function useGetCart(options?: {
  query?: Partial<UseQueryOptions<Cart>>;
}) {
  return useQuery<Cart>({
    queryKey: getGetCartQueryKey(),
    queryFn: () => apiFetch<Cart>("/cart"),
    ...options?.query,
  });
}

export function useAddToCart() {
  return useMutation<Cart, Error, { data: CartItemInput }>({
    mutationFn: ({ data }) =>
      apiFetch("/cart/items", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useUpdateCartItem() {
  return useMutation<Cart, Error, { itemId: string; data: { quantity: number } }>({
    mutationFn: ({ itemId, data }) =>
      apiFetch(`/cart/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });
}

export function useRemoveCartItem() {
  return useMutation<void, Error, { itemId: string }>({
    mutationFn: ({ itemId }) =>
      apiFetch(`/cart/items/${itemId}`, { method: "DELETE" }),
  });
}

export function useClearCart() {
  return useMutation<void, Error, void>({
    mutationFn: () => apiFetch("/cart", { method: "DELETE" }),
  });
}

// ---- Admin ----

export function useGetAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => apiFetch<AdminStats>("/admin/stats"),
  });
}

export function useListAdminUsers() {
  return useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: () => apiFetch<User[]>("/admin/users"),
  });
}
