"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Session check failed");
        }

        const session = await response.json();

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        setUser(session.user);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <main style={styles.page}>
        <h2>Loading your account...</h2>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.avatar}>🌱</div>

        <h1 style={styles.title}>My EcoSprout Account</h1>

        <p style={styles.subtitle}>
          Welcome to your green journey!
        </p>

        <div style={styles.info}>
          <span>Email Address</span>
          <strong>{user.email || "Not available"}</strong>
        </div>

        <div style={styles.info}>
          <span>Account Status</span>
          <strong style={{ color: "#22c55e" }}>
            ● Logged In
          </strong>
        </div>

        <button
          style={styles.homeButton}
          onClick={() => router.push("/")}
        >
          ← Back to EcoSprout
        </button>

        <button
          style={styles.logoutButton}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Log Out
        </button>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #071c15, #123e2a)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "450px",
    padding: "40px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },

  avatar: {
    fontSize: "60px",
    marginBottom: "15px",
  },

  title: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "10px",
  },

  subtitle: {
    color: "#b5d5c3",
    marginBottom: "30px",
  },

  info: {
    padding: "18px",
    marginBottom: "15px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowWrap: "anywhere",
  },

  homeButton: {
    width: "100%",
    padding: "15px",
    background: "#22c55e",
    color: "#052e16",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "20px",
  },

  logoutButton: {
    width: "100%",
    padding: "15px",
    background: "transparent",
    color: "#f87171",
    border: "1px solid #f87171",
    borderRadius: "12px",
    cursor: "pointer",
    marginTop: "12px",
  },
};