"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import "./login.css";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    try {
      await signIn("cognito", {
        callbackUrl: "/",
      });
    } catch {
      setMessage("Unable to start login. Please try again.");
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
            <div>🌳 <span>Grow your digital forest</span></div>
            <div>🏆 <span>Track your eco impact</span></div>
            <div>🤝 <span>Make change together</span></div>
          </div>
        </div>

        <div className="eco-auth-panel">
          <div className="eco-auth-tabs">
            <button
              className={mode === "login" ? "selected" : ""}
              onClick={() => setMode("login")}
            >
              Log In
            </button>

            <button
              className={mode === "signup" ? "selected" : ""}
              onClick={() => setMode("signup")}
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

          <button
            className="eco-auth-submit"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading
              ? "CONNECTING..."
              : mode === "login"
              ? "LOG IN →"
              : "CREATE ACCOUNT →"}
          </button>

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
              onClick={() =>
                setMode(mode === "login" ? "signup" : "login")
              }
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