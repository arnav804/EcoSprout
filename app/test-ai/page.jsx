"use client";

import { useState } from "react";

export default function TestAIPage() {
  const [video, setVideo] = useState(null);
  const [activity, setActivity] = useState("Plant a Tree");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function verifyVideo(event) {
    event.preventDefault();

    if (!video) {
      alert("Please select a video.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("video", video);
      formData.append("activity", activity);

      const response = await fetch("/api/verify-video", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      setResult(data.verification);
    } catch (error) {
      setResult({
        status: "ERROR",
        reason: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#081c15",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>🌱 EcoSprout AI Verification Test</h1>

      <p>Upload a short video to test Gemini AI.</p>

      <form onSubmit={verifyVideo}>
        <select
          value={activity}
          onChange={(event) => setActivity(event.target.value)}
          style={{ padding: "12px", color: "black" }}
        >
          <option>Plant a Tree</option>
          <option>Clean a Public Area</option>
          <option>Water Plants</option>
          <option>Segregate Waste</option>
        </select>

        <br />
        <br />

        <input
          type="file"
          accept="video/*"
          onChange={(event) => setVideo(event.target.files?.[0] || null)}
        />

        <br />
        <br />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "14px 24px",
            background: "#52b788",
            color: "#081c15",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading ? "Analyzing Video..." : "Verify with Gemini AI"}
        </button>
      </form>

      {result && (
        <section style={{ marginTop: "30px" }}>
          <h2>AI Verification Result</h2>

          <pre
            style={{
              background: "#143d2b",
              padding: "20px",
              borderRadius: "10px",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}