import React, { useState } from "react";
import { useLogin, useRegister } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMut = useLogin();
  const registerMut = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "login") {
      loginMut.mutate({ data: { email, password } }, {
        onSuccess: (res) => {
          login(res.token, res.user);
          toast({ title: "Welcome back!", description: "Successfully logged in." });
          setLocation("/");
        },
        onError: () => {
          toast({ title: "Login failed", description: "Invalid credentials.", variant: "destructive" });
        }
      });
    } else {
      registerMut.mutate({ data: { name, email, password } }, {
        onSuccess: (res) => {
          login(res.token, res.user);
          toast({ title: "Account created!", description: "Welcome to HAXNEX." });
          setLocation("/");
        },
        onError: () => {
          toast({ title: "Registration failed", description: "Email might be in use.", variant: "destructive" });
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 font-sans text-[var(--text)]">
      <Link href="/" className="absolute top-8 left-8 logo text-2xl">HAXNEX</Link>
      
      <div className="bg-[var(--surface)] border border-[var(--border)] p-8 rounded-[var(--radius-lg)] w-full max-w-md shadow-2xl">
        <div className="flex gap-4 mb-8 border-b border-[var(--border)] pb-4">
          <button 
            type="button"
            className={`text-sm uppercase tracking-widest font-semibold pb-1 transition-colors ${tab === "login" ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--muted)] hover:text-white"}`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button 
            type="button"
            className={`text-sm uppercase tracking-widest font-semibold pb-1 transition-colors ${tab === "register" ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--muted)] hover:text-white"}`}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {tab === "register" && (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-medium">Full Name</label>
              <input 
                required 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-[var(--surface2)] border border-[var(--border2)] rounded-[var(--radius)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors text-white" 
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-medium">Email Address</label>
            <input 
              required 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[var(--surface2)] border border-[var(--border2)] rounded-[var(--radius)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors text-white" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-medium">Password</label>
            <input 
              required 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-[var(--surface2)] border border-[var(--border2)] rounded-[var(--radius)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors text-white" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loginMut.isPending || registerMut.isPending}
            className="btn btn-primary mt-2 justify-center py-4"
          >
            {loginMut.isPending || registerMut.isPending ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
