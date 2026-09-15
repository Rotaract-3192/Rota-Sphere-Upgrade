"use client";

/**
 * WelcomeModal — Premium multi-step onboarding welcome flow.
 * Shown on first visit (pre-login) AND in a shorter version post-login.
 * Uses pure CSS transitions \u2014 no framer-motion.
 */

import React, { useState } from "react";
import { useOnboarding } from "./OnboardingProvider";
import { attendeeTourSteps, organizerDashboardTourSteps, organizerEventTourSteps } from "./tourSteps";
import type { TourStep } from "./tourSteps";

const FEATURES_ATTENDEE = [
  {
    icon: "🎪",
    title: "Discover Events",
    desc: "Browse verified Rotaract events across all 85+ clubs in District 3192 \u2014 conferences, sports fests, cultural nights and more.",
  },
  {
    icon: "🎟️",
    title: "Instant Ticketing",
    desc: "Book delegate passes in minutes with secure UPI payments. Your QR ticket is delivered straight to your email.",
  },
  {
    icon: "📱",
    title: "Digital Passes",
    desc: "All your tickets in one place. Show your QR at the gate \u2014 no printing needed. Transfer passes to friends with one tap.",
  },
];

const FEATURES_ORGANIZER = [
  {
    icon: "✨",
    title: "Create Events in Minutes",
    desc: "Launch a new event with our guided wizard. Set ticket tiers, UPI details, and publish \u2014 registrations open immediately.",
  },
  {
    icon: "💳",
    title: "Real-Time Payment Approval",
    desc: "Review UPI payment screenshots from your dashboard. Approve with one click \u2014 attendees get their QR passes instantly.",
  },
  {
    icon: "📲",
    title: "Gate Check-in Scanner",
    desc: "Scan QR codes at the entrance on event day. Works offline. Duplicate scan prevention and instant admission confirmation.",
  },
];

type Role = "attendee" | "organizer" | null;

interface Step {
  id: string;
  component: React.ReactNode;
}

export function WelcomeModal() {
  const { showWelcome, dismissWelcome, startTour } = useOnboarding();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>(null);
  const [exiting, setExiting] = useState(false);
  const [featureIdx, setFeatureIdx] = useState(0);

  if (!showWelcome) return null;

  const features = role === "organizer" ? FEATURES_ORGANIZER : FEATURES_ATTENDEE;
  const currentFeature = features[featureIdx];

  function advance() {
    setStep((s) => s + 1);
    setFeatureIdx(0);
  }

  function handleStartTour() {
    let steps: TourStep[];
    if (role === "organizer") {
      steps = [...organizerDashboardTourSteps, ...organizerEventTourSteps];
    } else {
      steps = attendeeTourSteps;
    }
    setExiting(true);
    setTimeout(() => {
      dismissWelcome();
      startTour(steps);
    }, 300);
  }

  function handleSkip() {
    setExiting(true);
    setTimeout(dismissWelcome, 300);
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    transition: "opacity 0.3s ease",
    opacity: exiting ? 0 : 1,
  };

  const cardStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: "480px",
    background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "24px",
    padding: "2.5rem 2rem",
    backdropFilter: "blur(20px)",
    boxShadow: "0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06) inset",
    transform: exiting ? "scale(0.96) translateY(8px)" : "scale(1) translateY(0)",
    transition: "transform 0.3s ease",
    color: "white",
    overflow: "hidden",
  };

  // Animated gradient orb background
  const orbStyle: React.CSSProperties = {
    position: "absolute",
    top: "-60px",
    right: "-60px",
    width: "200px",
    height: "200px",
    background: "radial-gradient(circle, rgba(7,88,252,0.4) 0%, rgba(124,58,237,0.3) 50%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    filter: "blur(20px)",
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && handleSkip()}>
        <div style={cardStyle}>
          <div style={orbStyle} />
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #0758fc 0%, #7c3aed 100%)",
              fontSize: "36px",
              marginBottom: "1rem",
              boxShadow: "0 8px 32px rgba(7,88,252,0.4)",
            }}>
              🌐
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              Welcome to{" "}
              <span style={{ background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                RotaSphere
              </span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.5rem", fontSize: "0.9rem", margin: "0.5rem 0 0" }}>
              District 3192 Event & Ticketing Platform
            </p>
          </div>

          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, fontSize: "0.95rem", marginBottom: "2rem" }}>
            Your hub for discovering and attending events from <strong style={{ color: "white" }}>85+ Rotaract clubs</strong> across Bangalore and beyond.
          </p>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "2rem" }}>
            {[
              { num: "85+", label: "Clubs" },
              { num: "500+", label: "Events" },
              { num: "10K+", label: "Members" },
            ].map((s) => (
              <div key={s.label} style={{
                textAlign: "center",
                padding: "0.75rem",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#60a5fa" }}>{s.num}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={advance}
            style={{
              width: "100%",
              padding: "0.875rem",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0758fc 0%, #7c3aed 100%)",
              border: "none",
              color: "white",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(7,88,252,0.4)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(7,88,252,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(7,88,252,0.4)"; }}
          >
            Get Started →
          </button>
          <button onClick={handleSkip} style={{ display: "block", width: "100%", marginTop: "0.75rem", padding: "0.5rem", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.85rem" }}>
            Skip
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Role picker
  if (step === 1) {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={orbStyle} />
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👋</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>How will you use RotaSphere?</h2>
            <p style={{ color: "rgba(255,255,255,0.55)", marginTop: "0.5rem", fontSize: "0.88rem", margin: "0.5rem 0 0" }}>
              We'll personalize your experience based on your role
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { id: "attendee" as Role, icon: "🎟️", title: "I'm an Attendee", desc: "Discover & book tickets for Rotaract events" },
              { id: "organizer" as Role, icon: "🎪", title: "I'm an Organizer", desc: "Create & manage events for my club" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{
                  padding: "1.25rem",
                  borderRadius: "16px",
                  background: role === r.id
                    ? "linear-gradient(135deg, rgba(7,88,252,0.3), rgba(124,58,237,0.2))"
                    : "rgba(255,255,255,0.04)",
                  border: role === r.id ? "2px solid rgba(7,88,252,0.7)" : "2px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  boxShadow: role === r.id ? "0 0 0 4px rgba(7,88,252,0.15)" : "none",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{r.icon}</div>
                <div style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>{r.title}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", marginTop: "0.25rem", lineHeight: 1.4 }}>{r.desc}</div>
              </button>
            ))}
          </div>

          <button
            onClick={advance}
            disabled={!role}
            style={{
              width: "100%",
              padding: "0.875rem",
              borderRadius: "14px",
              background: role ? "linear-gradient(135deg, #0758fc 0%, #7c3aed 100%)" : "rgba(255,255,255,0.08)",
              border: "none",
              color: role ? "white" : "rgba(255,255,255,0.3)",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: role ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            Continue →
          </button>
          <StepDots current={1} total={3} />
        </div>
      </div>
    );
  }

  // Step 2: Feature highlights
  if (step === 2) {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={orbStyle} />

          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              {role === "organizer" ? "For Organizers" : "For Attendees"}
            </p>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.25rem 0 0" }}>Here's what you can do</h2>
          </div>

          {/* Feature carousel */}
          <div style={{
            borderRadius: "20px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "1.75rem",
            marginBottom: "1rem",
            minHeight: "160px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            transition: "all 0.2s",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>{currentFeature.icon}</div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.5rem" }}>{currentFeature.title}</h3>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", lineHeight: 1.65, margin: 0 }}>{currentFeature.desc}</p>
          </div>

          {/* Dot navigation */}
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "1.5rem" }}>
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => setFeatureIdx(i)}
                style={{
                  width: featureIdx === i ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: featureIdx === i ? "#0758fc" : "rgba(255,255,255,0.2)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>

          {featureIdx < features.length - 1 ? (
            <button
              onClick={() => setFeatureIdx((i) => Math.min(features.length - 1, i + 1))}
              style={{ width: "100%", padding: "0.875rem", borderRadius: "14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "1rem", fontWeight: 600, cursor: "pointer" }}
            >
              Next Feature →
            </button>
          ) : (
            <button
              onClick={advance}
              style={{ width: "100%", padding: "0.875rem", borderRadius: "14px", background: "linear-gradient(135deg, #0758fc 0%, #7c3aed 100%)", border: "none", color: "white", fontSize: "1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(7,88,252,0.4)" }}
            >
              Almost there →
            </button>
          )}
          <StepDots current={2} total={3} />
        </div>
      </div>
    );
  }

  // Step 3: Ready — offer tour
  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={{ ...orbStyle, left: "-60px", right: "auto", background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(7,88,252,0.2) 50%, transparent 70%)" }} />
        <div style={{ ...orbStyle, background: "radial-gradient(circle, rgba(7,88,252,0.3) 0%, transparent 70%)" }} />

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🚀</div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>You're all set!</h2>
          <p style={{ color: "rgba(255,255,255,0.65)", marginTop: "0.5rem", lineHeight: 1.6, fontSize: "0.93rem", margin: "0.75rem 0 0" }}>
            Take a quick interactive tour to discover where everything is — takes only 60 seconds.
          </p>
        </div>

        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { icon: "✅", text: "Role-specific guided walkthrough" },
            { icon: "✅", text: "Highlights key features with visual spotlight" },
            { icon: "✅", text: "Skip anytime — replay from the ? button" },
          ].map((item) => (
            <div key={item.text} style={{ display: "flex", gap: "0.75rem", alignItems: "center", color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleStartTour}
          style={{
            width: "100%",
            padding: "0.9rem",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #0758fc 0%, #7c3aed 100%)",
            border: "none",
            color: "white",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(7,88,252,0.45)",
            marginBottom: "0.75rem",
          }}
        >
          🗺️ Take a Tour
        </button>
        <button
          onClick={handleSkip}
          style={{ width: "100%", padding: "0.75rem", borderRadius: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", cursor: "pointer" }}
        >
          Skip — I'll explore on my own
        </button>
        <StepDots current={3} total={3} />
      </div>
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "1.25rem" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? "20px" : "6px",
            height: "6px",
            borderRadius: "3px",
            background: i === current ? "#0758fc" : "rgba(255,255,255,0.2)",
            transition: "all 0.25s ease",
          }}
        />
      ))}
    </div>
  );
}
