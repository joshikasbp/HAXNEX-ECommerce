import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useListOrders, getListOrdersQueryKey } from "@/lib/api-client";
import { Link, useLocation } from "wouter";

export default function AccountPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  const { data: orders, isLoading: isOrdersLoading } = useListOrders({
    query: { enabled: !!user, queryKey: getListOrdersQueryKey() },
  });

  if (isLoading || !user) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--accent)]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans">
      <nav className="nav scrolled border-b border-[var(--border)]">
        <Link href="/" className="logo">HAXNEX</Link>
        <div className="nav-right">
          <Link href="/" className="btn btn-ghost btn-sm">Return to Store</Link>
        </div>
      </nav>

      <div className="pt-[100px] px-[5%] max-w-5xl mx-auto pb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-[family-name:var(--font-display)] mb-2">My Account</h1>
          <p className="text-[var(--muted)]">Welcome back, {user.name}.</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl font-[family-name:var(--font-display)] tracking-wider mb-6 text-[var(--accent)]">Order History</h2>

          {isOrdersLoading ? (
            <div className="text-[var(--muted)] py-10 text-center">Loading orders...</div>
          ) : orders && orders.length > 0 ? (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-[var(--surface2)] p-5 rounded-[var(--radius)] border border-[var(--border2)] flex flex-col md:flex-row gap-6 justify-between">
                  <div>
                    <div className="font-mono text-sm text-[var(--accent)] mb-1">#{order.id.slice(0,8).toUpperCase()}</div>
                    <div className="text-sm text-[var(--muted)] mb-3">{new Date(order.createdAt).toLocaleDateString()}</div>
                    <div className="flex flex-wrap gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-[var(--surface)] p-2 rounded border border-[var(--border)]">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                          <div className="text-xs">
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-[var(--muted)]">Size {item.size} × {item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-start md:items-end min-w-[120px]">
                    <div className="font-[family-name:var(--font-display)] text-2xl text-[var(--accent)] mb-2">₹{order.total}</div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded ${
                        order.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                        order.status === 'shipped' ? 'bg-orange-500/20 text-orange-500' :
                        order.status === 'confirmed' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>{order.status}</span>
                      <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded bg-[var(--surface3)] text-[var(--muted)]">
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-4 opacity-50">📦</div>
              <p className="text-[var(--muted)] mb-6">No orders yet. Start shopping!</p>
              <Link href="/" className="btn btn-primary">Browse Store</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
