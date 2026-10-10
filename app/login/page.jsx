"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (mode === "signup") {
      setMessage("Account creation is not enabled yet. Please log in.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setMessage(
          "Login failed. Check your credentials or account verification."
        );
        return;
      }

      if (!result?.ok) {
        setMessage("Unable to log in. Please try again.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="eco-auth-page">
      <div className="eco-auth-orb orb-one" />
      <div className="eco-auth-orb orb-two" />

      <section className="eco-auth-layout">
        <div className="eco-auth-intro">
          <div className="eco-auth-logo">
            🌱 <span>EcoSprout</span>
          </div>

          <div className="eco-auth-pill">
            <span /> YOUR GREEN CAMPUS AWAITS
          </div>

          <h1>
            Grow your world.
            <br />
            <em>Save the real one.</em>
          </h1>

          <p>
            Every small eco action makes a big difference.
            Join your campus community, grow your digital
            garden, and turn points into impact.
          </p>

          <div className="eco-auth-benefits">
            <div>
              🌳 <span>Grow your digital forest</span>
            </div>
            <div>
              🏆 <span>Track your eco impact</span>
            </div>
            <div>
              🤝 <span>Make change together</span>
            </div>
          </div>
        </div>

        <div className="eco-auth-panel">
          <div className="eco-auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "selected" : ""}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Log In
            </button>

            <button
              type="button"
              className={mode === "signup" ? "selected" : ""}
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
            >
              Sign Up
            </button>
          </div>

          <h2>
            {mode === "login"
              ? "Welcome back!"
              : "Join EcoSprout"}
          </h2>

          <p className="eco-auth-sub">
            {mode === "login"
              ? "Ready to make the world greener?"
              : "Start your green journey today."}
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginTop: "24px" }}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  marginBottom: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.07)",
                  color: "white",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  marginBottom: "20px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.07)",
                  color: "white",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              className="eco-auth-submit"
              disabled={loading || mode === "signup"}
            >
              {loading
                ? "LOGGING IN..."
                : mode === "login"
                ? "LOG IN →"
                : "SIGN UP COMING SOON"}
            </button>
          </form>

          {message && (
            <div role="status" className="eco-auth-message">
              {message}
            </div>
          )}

          <p className="eco-auth-foot">
            {mode === "login"
              ? "New to EcoSprout?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setMessage("");
              }}
            >
              {mode === "login"
                ? "Create an account"
                : "Log in"}
            </button>
          </p>

          <a className="eco-auth-back" href="/">
            ← Back to EcoSprout
          </a>
        </div>
      </section>
    </main>
  );
}