import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { 
  useListProducts, 
  useListReviews, 
  useCreateReview, 
  useCreateEnquiry,
  useCreateOrder,
  usePayOrder
} from "@/lib/api-client";
import { Product, Review, ProductCategory, OrderInputPaymentMethod } from "@/lib/api-client";

export default function StoreFront() {
  const { user, logout } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Scroll handler for nav
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans overflow-x-hidden">
      <Nav scrolled={scrolled} user={user} logout={logout} cartCount={cart.items.reduce((s,i) => s + i.quantity, 0)} />
      <Hero />
      <Marquee />
      <SearchAndProducts cart={cart} />
      <FabricComparison />
      <Stats />
      <ReviewsSection />
      <Services />
      <About />
      <EnquirySection />
      <CTA />
      <Footer />
      <CartSidebar cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} />
      <OrderModal cart={cart} clearCart={clearCart} />
      <ChatbotWidget />
      <PhotoSearchModal />
    </div>
  );
}

// ---------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------

function Nav({ scrolled, user, logout, cartCount }: any) {
  const openCart = () => {
    document.getElementById("cartSidebar")?.classList.add("open");
    document.getElementById("cartOverlay")?.classList.add("open");
  };

  return (
    <nav id="nav" className={`nav ${scrolled ? "scrolled" : ""}`}>
      <Link href="/" className="logo">HAXNEX</Link>
      <div className="nav-links">
        <a href="#products">Shop</a>
        <a href="#fabric">Quality</a>
        <a href="#reviews">Reviews</a>
        <a href="#about">About</a>
      </div>
      <div className="nav-right">
        {user ? (
          <>
            <span className="text-xs text-[var(--muted)] hidden md:inline">Hi, {user.name}</span>
            <Link href="/account" className="btn btn-ghost btn-sm hidden md:flex">Account</Link>
            {user.role === "admin" && (
              <Link href="/admin" className="btn btn-ghost btn-sm hidden md:flex">Admin</Link>
            )}
            <button onClick={logout} className="btn btn-ghost btn-sm hidden md:flex">Logout</button>
          </>
        ) : (
          <Link href="/login" className="btn btn-ghost btn-sm hidden md:flex">Login</Link>
        )}
        <button id="cartBtn" className="cart-btn" onClick={openCart}>
          Cart <div id="cartCount" className="cart-count">{cartCount}</div>
        </button>
        <div className="nav-hamburger">
          <span></span><span></span><span></span>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <div className="hero">
      <img id="heroImg" src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=2000" alt="Streetwear model" className="hero-img" />
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <div className="hero-eyebrow fade-in visible">Premium blanks. Cut to perfection.</div>
        <h1 className="hero-title fade-in visible" style={{transitionDelay:"0.1s"}}>THE NEW <span className="hero-title-accent">STANDARD</span><br/>IN STREETWEAR</h1>
        <p className="hero-sub fade-in visible" style={{transitionDelay:"0.2s"}}>Designed in Chennai. Crafted for the bold. Heavyweight cotton tees and hoodies built to last.</p>
        <div className="hero-actions fade-in visible" style={{transitionDelay:"0.3s"}}>
          <a href="#products" className="btn btn-primary">Shop Collection</a>
          <a href="#about" className="btn btn-ghost">Our Story</a>
        </div>
      </div>
      <div className="hero-scroll">
        <span>SCROLL</span>
        <div className="hero-scroll-line"></div>
      </div>
    </div>
  );
}

function Marquee() {
  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        <span>PREMIUM 240GSM COTTON <span className="dot">·</span> PUFF PRINTING <span className="dot">·</span> OVERSIZED FIT <span className="dot">·</span> MADE IN CHENNAI <span className="dot">·</span> </span>
        <span>PREMIUM 240GSM COTTON <span className="dot">·</span> PUFF PRINTING <span className="dot">·</span> OVERSIZED FIT <span className="dot">·</span> MADE IN CHENNAI <span className="dot">·</span> </span>
        <span>PREMIUM 240GSM COTTON <span className="dot">·</span> PUFF PRINTING <span className="dot">·</span> OVERSIZED FIT <span className="dot">·</span> MADE IN CHENNAI <span className="dot">·</span> </span>
        <span>PREMIUM 240GSM COTTON <span className="dot">·</span> PUFF PRINTING <span className="dot">·</span> OVERSIZED FIT <span className="dot">·</span> MADE IN CHENNAI <span className="dot">·</span> </span>
      </div>
    </div>
  );
}

function SearchAndProducts({ cart }: { cart: any }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<"tshirts" | "hoodies">("tshirts");
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: products, isLoading } = useListProducts();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products.filter(p => p.category === category);
    if (debouncedSearch) {
      const lowerQ = debouncedSearch.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(lowerQ) || p.description.toLowerCase().includes(lowerQ));
    }
    return filtered;
  }, [products, category, debouncedSearch]);

  const handleAddToCart = (product: Product, size: string = "M") => {
    addToCart({ productId: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, size });
    toast({ title: "Added to Cart", description: `${product.name} (Size ${size})` });
  };

  const handleBuyNow = (product: Product, size: string = "M") => {
    handleAddToCart(product, size);
    document.getElementById("cartSidebar")?.classList.remove("open");
    document.getElementById("orderModal")?.classList.add("open");
    document.getElementById("cartOverlay")?.classList.add("open");
  };

  return (
    <>
      <section id="search-section" className="search-section">
        <div className="search-wrapper fade-in visible">
          <label className="search-label">Find your style</label>
          <div className="search-bar">
            <div className="search-icon">🔍</div>
            <input 
              type="search" 
              id="searchInput" 
              className="search-input" 
              placeholder="Search by color, fabric, fit..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="photo-search-btn" onClick={() => document.getElementById("photoModal")?.classList.add("open")}>
              <svg viewBox="0 0 24 24"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><circle cx="12" cy="13" r="4"/></svg>
              Photo Search
            </button>
            <div className="search-divider"></div>
            <button className="search-btn">Search</button>
          </div>
          <div className="search-tags">
            <span className="search-tag" onClick={() => setSearchTerm("cotton")}>cotton</span>
            <span className="search-tag" onClick={() => setSearchTerm("oversized")}>oversized</span>
            <span className="search-tag" onClick={() => setSearchTerm("hoodie")}>hoodie</span>
          </div>
        </div>
      </section>

      <section id="products" className="section products">
        <div className="section-header fade-in visible">
          <div className="section-label">Shop</div>
          <h2 className="section-title">THE COLLECTION</h2>
        </div>
        
        <div className="product-tabs fade-in visible" style={{transitionDelay:"0.1s"}}>
          <button className={`tab-btn ${category === "tshirts" ? "active" : ""}`} onClick={() => setCategory("tshirts")}>T-Shirts</button>
          <button className={`tab-btn ${category === "hoodies" ? "active" : ""}`} onClick={() => setCategory("hoodies")}>Hoodies</button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-[var(--muted)]">Loading collection...</div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((p, i) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onAddToCart={(size) => handleAddToCart(p, size)}
                onBuyNow={(size) => handleBuyNow(p, size)}
              />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-20 text-[var(--muted)]">No products found.</div>
            )}
          </div>
        )}
      </section>
    </>
  );
}

function ProductCard({ product, onAddToCart, onBuyNow }: { product: Product, onAddToCart: (s: string) => void, onBuyNow: (s: string) => void }) {
  const [selectedSize, setSelectedSize] = useState("M");

  return (
    <div className="product-card fade-in visible" data-product={product.id}>
      <div className="prod-img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && <div className={`prod-badge ${product.badge.toLowerCase() === 'hot' ? 'hot' : 'new'}`}>{product.badge}</div>}
      </div>
      <div className="prod-body">
        <h3 className="prod-name">{product.name}</h3>
        <p className="prod-desc">{product.description}</p>
        <div className="prod-meta">
          <div className="prod-price">
            {product.originalPrice && <small>₹{product.originalPrice}</small>}
            ₹{product.price}
          </div>
          <div className="prod-rating">
            <span className="stars">{'★'.repeat(Math.round(product.rating))}</span> {product.rating} ({product.reviewCount})
          </div>
        </div>
        <div className="prod-fabric">{product.fabric}</div>
        <div className="size-chips">
          {product.sizes.map(s => (
            <div 
              key={s} 
              className={`size-chip ${selectedSize === s ? "active" : ""}`}
              onClick={() => setSelectedSize(s)}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="prod-actions">
          <button className="btn btn-outline" onClick={() => onAddToCart(selectedSize)}>Add to Cart</button>
          <button className="btn btn-primary" onClick={() => onBuyNow(selectedSize)}>Buy Now</button>
        </div>
      </div>
    </div>
  );
}

function FabricComparison() {
  return (
    <section id="fabric" className="section fabric-section">
      <div className="section-header fade-in visible">
        <div className="section-label">Quality</div>
        <h2 className="section-title">THE BLANKS COMPARED</h2>
      </div>
      <div className="overflow-x-auto fade-in visible">
        <table className="fabric-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>HAXNEX Premium</th>
              <th>Standard Brands</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cotton Weight (GSM)</td>
              <td><span className="tag-chip tag-best">240-280 GSM</span> (Heavyweight)</td>
              <td><span className="tag-chip tag-avg">160-180 GSM</span> (Light)</td>
            </tr>
            <tr>
              <td>Fabric Blend</td>
              <td>100% French Terry Cotton</td>
              <td>Poly-Cotton Blends</td>
            </tr>
            <tr>
              <td>Shrinkage</td>
              <td>Pre-shrunk (0-2%)</td>
              <td>5-8% after first wash</td>
            </tr>
            <tr>
              <td>Neck Ribbing</td>
              <td>Lycra blend (Shape retaining)</td>
              <td>Standard cotton (Loses shape)</td>
            </tr>
            <tr>
              <td>Durability</td>
              <td><span className="tag-chip tag-best">Years</span></td>
              <td><span className="tag-chip tag-avg">Months</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="stats">
      <div className="stat fade-in visible">
        <h3>10k+</h3><p>Happy Customers</p>
      </div>
      <div className="stat fade-in visible" style={{transitionDelay:"0.1s"}}>
        <h3>4.8</h3><p>Average Rating</p>
      </div>
      <div className="stat fade-in visible" style={{transitionDelay:"0.2s"}}>
        <h3>24h</h3><p>Dispatch Time</p>
      </div>
      <div className="stat fade-in visible" style={{transitionDelay:"0.3s"}}>
        <h3>100%</h3><p>Premium Cotton</p>
      </div>
    </section>
  );
}

function ReviewsSection() {
  const { data: reviews, isLoading, refetch } = useListReviews();
  const createMut = useCreateReview();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [product, setProduct] = useState("Oversized T-Shirt");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !text || !rating) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    createMut.mutate({ data: { name, product, rating, text, tag: product } }, {
      onSuccess: () => {
        toast({ title: "Review submitted!", description: "Awaiting approval." });
        setName(""); setText(""); setRating(0);
        refetch();
      }
    });
  };

  return (
    <section id="reviews" className="section reviews">
      <div className="section-header fade-in visible">
        <div className="section-label">Wall of Love</div>
        <h2 className="section-title">REAL FEEDBACK</h2>
      </div>
      
      {isLoading ? (
        <div className="text-[var(--muted)] mb-10">Loading reviews...</div>
      ) : (
        <div className="reviews-grid">
          {reviews?.filter(r => r.approved).map(r => (
            <div key={r.id} className="review-card fade-in visible">
              <div className="review-header">
                <div className="reviewer">
                  <div className="reviewer-avatar" style={{background: ["#f97316","#22c55e","#0ea5e9","#a855f7","#ef4444"][r.name.length%5]}}>
                    {r.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="reviewer-name">{r.name}</div>
                    <div className="reviewer-date">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="review-stars">
                  {'★'.repeat(r.rating) + '☆'.repeat(5-r.rating)}
                </div>
              </div>
              <p className="review-text">{r.text}</p>
              {r.tag && <div className="review-tag">{r.tag}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="add-review fade-in visible">
        <h3>Leave a Review</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Your Name</label>
              <input type="text" className="form-input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Product</label>
              <select className="form-input" value={product} onChange={e => setProduct(e.target.value)}>
                <option>Oversized T-Shirt</option>
                <option>Classic T-Shirt</option>
                <option>Premium Hoodie</option>
                <option>Custom Order</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Rating</label>
            <div className="star-rating-input">
              {[1,2,3,4,5].map(i => (
                <span 
                  key={i} 
                  className={i <= rating ? "active" : ""}
                  onClick={() => setRating(i)}
                >★</span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Review</label>
            <textarea className="form-input" rows={4} placeholder="How's the fit and quality?" value={text} onChange={e => setText(e.target.value)} required></textarea>
          </div>
          <button type="submit" className="btn btn-primary mt-2" disabled={createMut.isPending}>
            {createMut.isPending ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section className="services-grid">
      <div className="service-card">
        <div className="service-num">01</div>
        <h3>Bulk Orders</h3>
        <p>Special pricing for college events, corporate merch, and brand startups. Starts from 50 pieces.</p>
      </div>
      <div className="service-card">
        <div className="service-num">02</div>
        <h3>Custom Prints</h3>
        <p>DTF, Screen printing, Puff print, and Embroidery available on our premium blanks.</p>
      </div>
      <div className="service-card">
        <div className="service-num">03</div>
        <h3>Pan India Delivery</h3>
        <p>Fast dispatch from Chennai. Delivered anywhere in India within 3-5 working days.</p>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="section about">
      <div className="about-wrap">
        <div className="fade-in visible">
          <div className="section-label">Our Story</div>
          <h2 className="section-title mb-6">BUILT IN CHENNAI.<br/>WORN EVERYWHERE.</h2>
          <p className="about-body">HAXNEX started with a simple problem: finding a high-quality, heavy-weight oversized tee without paying luxury markups. Most brands compromise on fabric weight or neck ribbing to cut costs.</p>
          <p className="about-body">We decided to build the perfect blank. Sourced from the best mills in Tamil Nadu, cut to our exact oversized specifications, and finished with shape-retaining lycra neck ribs. The result is apparel that feels expensive but remains accessible.</p>
          <p className="about-body">Whether you're buying a single tee or 500 custom pieces for your brand, you get the exact same premium quality.</p>
          <a href="#products" className="btn btn-outline mt-4">Shop the collection</a>
        </div>
        <div className="about-img fade-in visible" style={{transitionDelay:"0.2s"}}>
          <img src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=1000" alt="Apparel manufacturing" loading="lazy" />
          <div className="about-img-tag">Ethically Manufactured</div>
        </div>
      </div>
    </section>
  );
}

function EnquirySection() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [type, setType] = useState("Bulk Order");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const createMut = useCreateEnquiry();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ data: { name, contact, type, message } }, {
      onSuccess: () => {
        toast({ title: "Enquiry sent!", description: "We'll reply within 4 hours ✓" });
        setName(""); setContact(""); setMessage("");
      }
    });
  };

  return (
    <section id="enquiry" className="section enquiry">
      <div className="section-header fade-in visible">
        <div className="section-label">Get in touch</div>
        <h2 className="section-title">BULK & CUSTOM ORDERS</h2>
      </div>
      <div className="enquiry-wrap">
        <div className="enquiry-info fade-in visible">
          <p>Need custom apparel for your brand, college, or company? Drop us a message. We offer competitive pricing for orders over 50 pieces with full customization options.</p>
          <div className="contact-item"><div className="contact-icon">📍</div>Chennai, Tamil Nadu, India</div>
          <div className="contact-item"><div className="contact-icon">📞</div>+91 98765 43210</div>
          <div className="contact-item"><div className="contact-icon">✉️</div>hello@haxnex.com</div>
        </div>
        <div className="enquiry-form fade-in visible">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name / Brand Name</label>
              <input type="text" className="form-input" value={name} onChange={e=>setName(e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contact (Phone/Email)</label>
                <input type="text" className="form-input" value={contact} onChange={e=>setContact(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Enquiry Type</label>
                <select className="form-input" value={type} onChange={e=>setType(e.target.value)}>
                  <option>Bulk Order (50+ pcs)</option>
                  <option>Custom Print/Embroidery</option>
                  <option>General Support</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea className="form-input" rows={4} placeholder="Tell us about your requirement..." value={message} onChange={e=>setMessage(e.target.value)} required></textarea>
            </div>
            <button type="submit" className="btn btn-primary" disabled={createMut.isPending}>
              {createMut.isPending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="section cta">
      <div className="cta-inner fade-in visible">
        <h2 className="cta-title">ELEVATE YOUR<br/>WARDROBE TODAY.</h2>
        <div className="cta-actions">
          <a href="#products" className="btn btn-primary">Shop Now</a>
          <a href="#enquiry" className="btn btn-ghost">Contact Sales</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="logo">HAXNEX</div>
          <p>Premium streetwear blanks and custom apparel engineered for longevity and perfect fit. Made with pride in Chennai.</p>
        </div>
        <div className="footer-grid">
          <div>
            <h4>Shop</h4>
            <p><a href="#products">Oversized T-Shirts</a></p>
            <p><a href="#products">Premium Hoodies</a></p>
            <p><a href="#products">New Arrivals</a></p>
          </div>
          <div>
            <h4>Company</h4>
            <p><a href="#about">About Us</a></p>
            <p><a href="#reviews">Reviews</a></p>
            <p><a href="#fabric">Fabric Guide</a></p>
          </div>
          <div>
            <h4>Support</h4>
            <p><a href="#enquiry">Bulk Orders</a></p>
            <p><a href="#enquiry">Contact Us</a></p>
            <p><a href="#">Shipping & Returns</a></p>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 HAXNEX. All rights reserved.</p>
        <p>Chennai, India</p>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------
// Modals & Sidebars
// ---------------------------------------------------------

function CartSidebar({ cart, removeFromCart, updateQuantity }: any) {
  const closeCart = () => {
    document.getElementById("cartSidebar")?.classList.remove("open");
    document.getElementById("cartOverlay")?.classList.remove("open");
  };

  const checkout = () => {
    closeCart();
    document.getElementById("orderModal")?.classList.add("open");
    document.getElementById("cartOverlay")?.classList.add("open");
  };

  return (
    <>
      <div id="cartOverlay" className="cart-overlay" onClick={closeCart}></div>
      <div id="cartSidebar" className="cart-sidebar">
        <div className="cart-sidebar-header">
          <h3>Your Cart</h3>
          <button className="close-btn" onClick={closeCart}>✕</button>
        </div>
        <div className="cart-items" id="cartItemsList">
          {cart.items.length === 0 ? (
            <div className="cart-empty"><div className="big-icon">🛒</div><p>Your cart is empty</p></div>
          ) : (
            cart.items.map((i: any) => (
              <div key={i.itemId} className="cart-item">
                <div className="cart-item-img"><img src={i.image} alt={i.name} /></div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{i.name}</div>
                  <div className="cart-item-meta">Size: {i.size}</div>
                  <div className="cart-item-row">
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => updateQuantity(i.itemId, Math.max(1, i.quantity - 1))}>−</button>
                      <span className="qty-num">{i.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(i.itemId, i.quantity + 1)}>+</button>
                    </div>
                    <span className="cart-item-price">₹{i.price * i.quantity}</span>
                  </div>
                  <button className="remove-item" onClick={() => removeFromCart(i.itemId)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Subtotal</span>
              <span className="cart-total-price">₹{cart.total}</span>
            </div>
            <button className="btn btn-primary" onClick={checkout}>Checkout</button>
          </div>
        )}
      </div>
    </>
  );
}

function OrderModal({ cart, clearCart }: any) {
  const [step, setStep] = useState(1);
  const [payMethod, setPayMethod] = useState<OrderInputPaymentMethod>("razorpay");
  const [orderId, setOrderId] = useState("");
  const { toast } = useToast();
  
  const createOrderMut = useCreateOrder();
  const payOrderMut = usePayOrder();

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "", pincode: "", notes: ""
  });

  const close = () => {
    document.getElementById("orderModal")?.classList.remove("open");
    document.getElementById("cartOverlay")?.classList.remove("open");
  };

  const deliveryFee = cart.total >= 999 ? 0 : 79;
  const grandTotal = cart.total + deliveryFee;

  const handleNext = () => {
    if (!form.name || !form.phone || !form.address) {
      toast({ title: "Please fill required details", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleConfirm = () => {
    if (cart.items.length === 0) return;

    createOrderMut.mutate({
      data: {
        items: cart.items.map((i: any) => ({
          productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, size: i.size, image: i.image
        })),
        shippingAddress: form,
        paymentMethod: payMethod
      }
    }, {
      onSuccess: (order) => {
        setOrderId(order.id);
        
        if (payMethod === "cod") {
          // COD implies placed.
          clearCart();
          setStep(3);
        } else {
          // Others require payment flow
          toast({ title: "Payment integration coming soon", description: "Marking order as placed for demo." });
          payOrderMut.mutate({ id: order.id, data: { method: payMethod, razorpayPaymentId: "fake_payment_id" } }, {
            onSuccess: () => {
              clearCart();
              setStep(3);
            }
          });
        }
      }
    });
  };

  return (
    <div id="orderModal" className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Checkout</h3>
          <button className="close-btn" onClick={close}>✕</button>
        </div>
        <div className="modal-body">
          {step < 3 && (
            <div className="step-indicator">
              <div className="step">
                <div className={`step-num ${step === 1 ? "active" : "done"}`}>{step === 1 ? "1" : "✓"}</div>
                <div className="step-label">Delivery</div>
              </div>
              <div className="step-line"></div>
              <div className="step">
                <div className={`step-num ${step === 2 ? "active" : ""}`}>2</div>
                <div className="step-label">Payment</div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="step-panel active">
              <div className="form-row">
                <div className="form-group"><label>Full Name</label><input type="text" className="form-input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" className="form-input" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required/></div>
              </div>
              <div className="form-group"><label>Email Address</label><input type="email" className="form-input" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/></div>
              <div className="form-group"><label>Delivery Address</label><textarea className="form-input" rows={2} value={form.address} onChange={e=>setForm({...form, address:e.target.value})} required></textarea></div>
              <div className="form-row">
                <div className="form-group"><label>City</label><input type="text" className="form-input" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} required/></div>
                <div className="form-group"><label>Pincode</label><input type="text" className="form-input" value={form.pincode} onChange={e=>setForm({...form, pincode:e.target.value})} required/></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={close}>Cancel</button>
                <button className="btn btn-primary" onClick={handleNext}>Next: Payment</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-panel active">
              <div className="summary-box">
                <h4>Order Summary</h4>
                {cart.items.map((i: any) => (
                  <div key={i.itemId} className="summary-row"><span>{i.name} ({i.size}) × {i.quantity}</span><span>₹{i.price * i.quantity}</span></div>
                ))}
                <div className="summary-row"><span>Delivery</span><span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span></div>
                <div className="summary-row total"><span>Total</span><span>₹{grandTotal}</span></div>
              </div>

              <label className="section-label" style={{marginBottom: "12px", display:"block"}}>Payment Method</label>
              <div className="pay-methods">
                {(["razorpay", "upi", "cod", "bank"] as const).map(m => (
                  <div key={m} className={`pay-method ${payMethod === m ? "selected" : ""}`} onClick={() => setPayMethod(m)}>
                    <div className="pay-radio"></div>
                    <div className="pay-info">
                      <div className="pay-name">{m === "razorpay" ? "Credit / Debit Card" : m === "upi" ? "UPI Apps" : m === "cod" ? "Cash on Delivery" : "Bank Transfer"}</div>
                      <div className="pay-desc">{m === "razorpay" ? "Via Razorpay secure gateway" : m === "upi" ? "GPay, PhonePe, Paytm" : m === "cod" ? "Pay when delivered" : "NEFT / IMPS transfer"}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                <button className="btn btn-primary" onClick={handleConfirm} disabled={createOrderMut.isPending || payOrderMut.isPending}>
                  {createOrderMut.isPending || payOrderMut.isPending ? "Processing..." : `Confirm & Pay ₹${grandTotal}`}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-panel active">
              <div className="success-screen">
                <div className="success-icon">✓</div>
                <h3>Order Confirmed!</h3>
                <p>Thank you for shopping with HAXNEX.</p>
                <div className="order-id">{orderId}</div>
                <br/>
                <button className="btn btn-primary" onClick={close}>Continue Shopping</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, type: "bot"|"user"}[]>([]);
  const [options, setOptions] = useState<{text: string, action: () => void}[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true;
      setMessages([{ text: "Hey there! 👋", type: "bot" }]);
      setTimeout(() => {
        setMessages(m => [...m, { text: "Welcome to HAXNEX — Chennai's premium T-shirt studio.", type: "bot" }]);
        setTimeout(() => {
          setMessages(m => [...m, { text: "How can I help you today?", type: "bot" }]);
          setOptions([
            { text: "🛒 Shop Products", action: () => handleOpt("Shop Products") },
            { text: "📦 Bulk Order", action: () => handleBulk() },
            { text: "💰 Pricing", action: () => handlePricing() }
          ]);
        }, 800);
      }, 800);
    }
  }, [open]);

  const handleOpt = (text: string) => {
    setMessages(m => [...m, { text, type: "user" }]);
    setOptions([]);
    setOpen(false);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBulk = () => {
    setMessages(m => [...m, { text: "Bulk Order", type: "user" }]);
    setOptions([]);
    setTimeout(() => {
      setMessages(m => [...m, { text: "We have excellent bulk pricing starting from ₹199/tee for 100+ pieces. Fill out the enquiry form on our site and we'll call you back! 📞", type: "bot" }]);
      setOptions([{ text: "Go to Enquiry Form", action: () => { setOpen(false); document.getElementById("enquiry")?.scrollIntoView({behavior:"smooth"}); } }]);
    }, 600);
  };

  const handlePricing = () => {
    setMessages(m => [...m, { text: "Pricing", type: "user" }]);
    setOptions([]);
    setTimeout(() => {
      setMessages(m => [...m, { text: "T-Shirts from ₹299 · Hoodies from ₹899. Custom designs from ₹499", type: "bot" }]);
      setOptions([{ text: "Shop Now", action: () => handleOpt("Shop Now") }]);
    }, 600);
  };

  return (
    <div className="chat-widget">
      <button className="chat-toggle" onClick={() => setOpen(!open)}>💬</button>
      {open && (
        <div className="chat-box open" style={{display: "flex"}}>
          <div className="chat-header">
            <h4>HAXNEX Support</h4>
            <span>Online</span>
            <button className="close-chat" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => <div key={i} className={`msg ${m.type}`}>{m.text}</div>)}
          </div>
          <div className="chat-options">
            {options.map((o, i) => <button key={i} onClick={o.action}>{o.text}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoSearchModal() {
  const close = () => document.getElementById("photoModal")?.classList.remove("open");
  
  return (
    <div id="photoModal" className="photo-modal">
      <div className="photo-modal-box">
        <div className="photo-modal-head">
          <h3>Visual Search</h3>
          <button className="close-btn" onClick={close}>✕</button>
        </div>
        <div className="photo-drop">
          <div className="photo-drop-icon">📸</div>
          <p>Drop an image here or <strong>click to upload</strong></p>
          <p style={{fontSize:"0.75rem", marginTop:"8px"}}>Find products with similar colors</p>
        </div>
      </div>
    </div>
  );
}
