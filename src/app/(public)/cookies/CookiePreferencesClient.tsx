"use client";

import { useState, useEffect } from "react";
import { Cookie, ShieldCheck, Check, Save, Info, RefreshCw } from "lucide-react";

interface CookieSetting {
  id: string;
  name: string;
  required: boolean;
  enabled: boolean;
  description: string;
  examples: string[];
}

export function CookiePreferencesClient() {
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rotasphere_cookie_preferences");
      if (stored) {
        setPreferences(JSON.parse(stored));
      } else {
        const consent = localStorage.getItem("rotasphere_cookie_consent");
        if (consent === "all") {
          setPreferences({ essential: true, functional: true, analytics: true, marketing: false });
        }
      }
    } catch {}
  }, []);

  function handleToggle(key: string) {
    if (key === "essential") return; // cannot disable essential
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
  }

  function handleSave() {
    try {
      localStorage.setItem("rotasphere_cookie_preferences", JSON.stringify(preferences));
      localStorage.setItem("rotasphere_cookie_consent", preferences.analytics ? "all" : "essential");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  }

  function handleAcceptAll() {
    const all = { essential: true, functional: true, analytics: true, marketing: false };
    setPreferences(all);
    try {
      localStorage.setItem("rotasphere_cookie_preferences", JSON.stringify(all));
      localStorage.setItem("rotasphere_cookie_consent", "all");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  }

  const cookieCategories: CookieSetting[] = [
    {
      id: "essential",
      name: "1. Strictly Essential Cookies",
      required: true,
      enabled: true,
      description:
        "Necessary for the website to function securely. They handle authentication sessions via Clerk SSO, CSRF protection, gate scanner authorization, and ticket checkout state.",
      examples: ["__clerk_session", "__session_token", "csrf_token"],
    },
    {
      id: "functional",
      name: "2. Functional & Preference Cookies",
      required: false,
      enabled: preferences.functional,
      description:
        "Enable personalized features like remembering your active Rotaract club selection, theme preference (Dark/Light mode), and cached event filters.",
      examples: ["theme", "rotasphere_active_club", "last_event_category"],
    },
    {
      id: "analytics",
      name: "3. Performance & Usage Telemetry",
      required: false,
      enabled: preferences.analytics,
      description:
        "Help us measure aggregated page load speeds, error rates, and booking success rates so we can optimize gate scanner speed and checkout reliability.",
      examples: ["_telemetry_perf", "_error_diagnostics"],
    },
    {
      id: "marketing",
      name: "4. Third-Party Advertising Cookies",
      required: false,
      enabled: preferences.marketing,
      description:
        "RotaSphere operates a strict Zero-Advertising Policy. We do NOT use third-party advertising cookies or share behavioral cookies with data brokers.",
      examples: ["Disabled by default on RotaSphere"],
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Cookie className="text-[#0758fc]" size={18} /> Manage Cookie Preferences
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure which cookie categories are stored on your device.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Accept Recommended
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-extrabold px-5 py-2 rounded-xl bg-[#0758fc] hover:bg-[#054fe0] text-white shadow-sm transition-all cursor-pointer"
          >
            {saved ? (
              <>
                <Check size={14} /> Saved!
              </>
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {cookieCategories.map((cat) => (
          <div
            key={cat.id}
            className="p-4 sm:p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/60 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                  {cat.name}
                </span>
                {cat.required ? (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Required
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                    Optional
                  </span>
                )}
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={cat.enabled}
                aria-label={`Toggle ${cat.name}`}
                disabled={cat.required}
                onClick={() => handleToggle(cat.id)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  cat.enabled ? "bg-[#0758fc]" : "bg-gray-300 dark:bg-gray-600"
                } ${cat.required ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    cat.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {cat.description}
            </p>

            <div className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
              Examples: {cat.examples.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
