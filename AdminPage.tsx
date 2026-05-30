import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation, Link } from "wouter";
import { 
  useGetAdminStats, 
  useListAdminOrders, 
  useUpdateOrderStatus,
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useListAdminReviews,
  useUpdateReviewStatus,
  useListAdminEnquiries,
  useUpdateEnquiryStatus,
  useListAdminUsers,
  OrderStatusUpdateStatus
} from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading) {
      if (!user) setLocation("/login");
      else if (user.role !== "admin") setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[var(--surface)] border-r border-[var(--border)] shrink-0 flex flex-col">
        <div className="p-6 border-b border-[var(--border)]">
          <Link href="/" className="logo text-2xl">HAXNEX</Link>
          <div className="text-[10px] tracking-widest text-[var(--muted)] mt-1 uppercase">Admin Portal</div>
        </div>
        <nav className="p-4 flex flex-col gap-2 flex-1">
          {["dashboard", "orders", "products", "reviews", "enquiries", "users"].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`text-left px-4 py-3 rounded-[var(--radius)] text-sm font-medium tracking-wide uppercase transition-colors ${
                activeTab === t ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(242,183,5,0.25)]" : "text-[var(--muted)] hover:text-white hover:bg-[var(--surface2)]"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "reviews" && <ReviewsTab />}
        {activeTab === "enquiries" && <EnquiriesTab />}
        {activeTab === "users" && <UsersTab />}
      </main>
    </div>
  );
}

// Subcomponents for tabs
function DashboardTab() {
  const { data: stats, isLoading } = useGetAdminStats();
  
  if (isLoading) return <div>Loading stats...</div>;
  if (!stats) return null;

  return (
    <div>
      <h2 className="text-3xl font-[family-name:var(--font-display)] mb-8">Dashboard Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} />
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} />
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Total Products" value={stats.totalProducts} />
        <StatCard title="New Enquiries" value={stats.newEnquiries} />
      </div>
      <h3 className="text-xl font-[family-name:var(--font-display)] mb-4 text-[var(--accent)]">Recent Orders</h3>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4">
        {stats.recentOrders.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[var(--muted)] border-b border-[var(--border)]">
                <th className="pb-3 px-2 font-normal">Order ID</th>
                <th className="pb-3 px-2 font-normal">Date</th>
                <th className="pb-3 px-2 font-normal">Status</th>
                <th className="pb-3 px-2 font-normal text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map(o => (
                <tr key={o.id} className="border-b border-[var(--border2)]">
                  <td className="py-3 px-2 font-mono text-[var(--accent)]">{o.id.slice(0,8)}</td>
                  <td className="py-3 px-2">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-2 uppercase text-[10px] tracking-wider">{o.status}</td>
                  <td className="py-3 px-2 text-right">₹{o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-[var(--muted)] py-4">No recent orders</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="bg-[var(--surface)] p-6 rounded-[var(--radius-lg)] border border-[var(--border)]">
      <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] mb-2">{title}</div>
      <div className="text-3xl font-[family-name:var(--font-display)] text-[var(--accent)]">{value}</div>
    </div>
  );
}

function OrdersTab() {
  const { data: orders, isLoading, refetch } = useListAdminOrders();
  const updateMut = useUpdateOrderStatus();
  const { toast } = useToast();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-3xl font-[family-name:var(--font-display)] mb-8">Manage Orders</h2>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[var(--surface2)] text-[10px] uppercase tracking-widest text-[var(--accent)]">
            <tr>
              <th className="p-4 font-normal">Order ID</th>
              <th className="p-4 font-normal">Customer</th>
              <th className="p-4 font-normal">Total</th>
              <th className="p-4 font-normal">Payment</th>
              <th className="p-4 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map(o => (
              <tr key={o.id} className="border-t border-[var(--border)] hover:bg-[var(--surface2)]">
                <td className="p-4 font-mono text-xs">{o.id}</td>
                <td className="p-4">{o.shippingAddress.name}<br/><span className="text-[var(--muted)] text-xs">{o.shippingAddress.email}</span></td>
                <td className="p-4 font-semibold text-[var(--accent)]">₹{o.total}</td>
                <td className="p-4 uppercase text-[10px]">{o.paymentStatus}</td>
                <td className="p-4">
                  <select 
                    className="bg-[var(--bg)] border border-[var(--border2)] text-white text-xs p-2 rounded outline-none"
                    value={o.status}
                    onChange={(e) => {
                      updateMut.mutate({ id: o.id, data: { status: e.target.value as OrderStatusUpdateStatus } }, {
                        onSuccess: () => { toast({ title: "Updated", description: `Order ${o.id.slice(0,6)} updated` }); refetch(); }
                      });
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTab() {
  const { data: products, isLoading, refetch } = useListProducts();
  const deleteMut = useDeleteProduct();
  const { toast } = useToast();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-[family-name:var(--font-display)]">Products</h2>
        {/* We would wire this to a modal in a full app */}
        <button className="btn btn-primary btn-sm" onClick={() => alert("Add Product feature coming soon")}>+ Add Product</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products?.map(p => (
          <div key={p.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 flex gap-4">
            <img src={p.image} className="w-20 h-20 object-cover rounded bg-[var(--surface2)]" alt=""/>
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">{p.name}</div>
              <div className="text-[var(--accent)] font-bold text-sm mb-2">₹{p.price}</div>
              <div className="flex gap-2">
                <button className="text-[10px] uppercase bg-[var(--surface2)] px-2 py-1 rounded text-[var(--muted)] hover:text-white">Edit</button>
                <button 
                  className="text-[10px] uppercase bg-red-900/30 px-2 py-1 rounded text-red-500 hover:bg-red-900/50"
                  onClick={() => {
                    if (confirm("Delete product?")) {
                      deleteMut.mutate({ id: p.id }, { onSuccess: () => { refetch(); toast({title:"Deleted"}); }});
                    }
                  }}
                >Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const { data: reviews, isLoading, refetch } = useListAdminReviews();
  const updateMut = useUpdateReviewStatus();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2 className="text-3xl font-[family-name:var(--font-display)] mb-8">Reviews</h2>
      <div className="grid gap-4">
        {reviews?.map(r => (
          <div key={r.id} className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 flex justify-between items-start">
            <div>
              <div className="font-semibold">{r.name} - <span className="text-[var(--accent)]">★ {r.rating}</span></div>
              <div className="text-sm text-[var(--muted)] mt-1">{r.text}</div>
            </div>
            <button 
              className={`px-3 py-1 rounded text-xs uppercase font-bold ${r.approved ? 'bg-green-900/30 text-green-500' : 'bg-yellow-900/30 text-yellow-500'}`}
              onClick={() => updateMut.mutate({ id: r.id, data: { approved: !r.approved } }, { onSuccess: () => refetch() })}
            >
              {r.approved ? "Approved" : "Pending"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnquiriesTab() {
  const { data: enquiries, isLoading, refetch } = useListAdminEnquiries();
  const updateMut = useUpdateEnquiryStatus();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-3xl font-[family-name:var(--font-display)] mb-8">Enquiries</h2>
      <div className="grid gap-4">
        {enquiries?.map(e => (
          <div key={e.id} className="bg-[var(--surface)] border border-[var(--border)] rounded p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="font-semibold">{e.name} <span className="text-[var(--muted)] text-sm ml-2">{e.contact}</span></div>
              <select 
                className="bg-[var(--bg)] border border-[var(--border2)] text-xs p-1 rounded"
                value={e.status}
                onChange={(ev) => updateMut.mutate({ id: e.id, data: { status: ev.target.value as any } }, { onSuccess: () => refetch() })}
              >
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="text-xs text-[var(--accent)] uppercase tracking-wider mb-2">{e.type}</div>
            <div className="text-sm text-[var(--muted)]">{e.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading } = useListAdminUsers();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2 className="text-3xl font-[family-name:var(--font-display)] mb-8">Users</h2>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[var(--surface2)] text-[10px] uppercase tracking-widest text-[var(--accent)]">
            <tr>
              <th className="p-4 font-normal">Name</th>
              <th className="p-4 font-normal">Email</th>
              <th className="p-4 font-normal">Role</th>
              <th className="p-4 font-normal">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.map(u => (
              <tr key={u.id} className="border-t border-[var(--border)] hover:bg-[var(--surface2)]">
                <td className="p-4">{u.name}</td>
                <td className="p-4 text-[var(--muted)]">{u.email}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${u.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-[var(--surface3)]'}`}>{u.role}</span></td>
                <td className="p-4 text-[var(--muted)]">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
