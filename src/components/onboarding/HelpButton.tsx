"use client";

/**
 * HelpButton — Floating ? button that opens the help menu.
 * Lets users replay tours, jump to specific sections, or access support.
 */

import React from "react";
import { useOnboarding } from "./OnboardingProvider";
import { attendeeTourSteps, organizerDashboardTourSteps } from "./tourSteps";

export function HelpButton() {
  const { showHelp, setShowHelp, startTour, tourActive } = useOnboarding();

  // Don't show while a tour is active
  if (tourActive) return null;

  const menuItems = [
    {
      icon: "🗺️",
      label: "Attendee Tour",
      desc: "How to browse & book events",
      onClick: () => { setShowHelp(false); startTour(attendeeTourSteps); },
    },
    {
      icon: "🎛️",
      label: "Organizer Tour",
      desc: "Dashboard & event management",
      onClick: () => { setShowHelp(false); startTour(organizerDashboardTourSteps); },
    },
    {
      icon: "📧",
      label: "Contact Support",
      desc: "Get help from our team",
      onClick: () => { setShowHelp(false); window.open("mailto:support@rotaract3192.org", "_blank"); },
    },
  ];

  return (
    <>
      {/* Backdrop to close menu */}
      {showHelp && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99979 }}
          onClick={() => setShowHelp(false)}
        />
      )}

      {/* Help menu */}
      {showHelp && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "24px",
            zIndex: 99980,
            width: "260px",
            background: "linear-gradient(145deg, rgba(15,20,40,0.98) 0%, rgba(10,14,32,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "20px",
            padding: "1rem",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(7,88,252,0.1) inset",
            color: "white",
            animation: "helpMenuIn 0.2s ease",
          }}
        >
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>
            Help & Tours
          </p>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.7rem 0.75rem",
                background: "none",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s",
                marginBottom: "2px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{item.icon}</span>
              <span>
                <span style={{ display: "block", color: "white", fontSize: "0.88rem", fontWeight: 600 }}>{item.label}</span>
                <span style={{ display: "block", color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>{item.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* The ? button */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        title="Help & Tour"
        aria-label="Open help menu"
        style={{
          position: "fixed",
          bottom: "100px",
          right: "24px",
          zIndex: 99981,
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: showHelp
            ? "linear-gradient(135deg, #0758fc, #7c3aed)"
            : "linear-gradient(145deg, rgba(15,20,40,0.95), rgba(10,14,32,0.95))",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "white",
          fontSize: "1.1rem",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: showHelp
            ? "0 8px 24px rgba(7,88,252,0.5)"
            : "0 4px 16px rgba(0,0,0,0.4)",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          if (!showHelp) {
            e.currentTarget.style.background = "linear-gradient(135deg, #0758fc, #7c3aed)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(7,88,252,0.45)";
            e.currentTarget.style.transform = "scale(1.08)";
          }
        }}
        onMouseLeave={(e) => {
          if (!showHelp) {
            e.currentTarget.style.background = "linear-gradient(145deg, rgba(15,20,40,0.95), rgba(10,14,32,0.95))";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
        {showHelp ? "✕" : "?"}
      </button>

      <style>{`
        @keyframes helpMenuIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
