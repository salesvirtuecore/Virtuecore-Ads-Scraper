import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
    content: [
        "./src/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    purple: {
                        DEFAULT: "#6944d7",
                        dark: "#241b55",
                        deeper: "#110c2c",
                        faint: "rgba(105,68,215,0.12)",
                    },
                    gold: {
                        DEFAULT: "#e5bf44",
                        light: "#f0cb54",
                        dim: "#cc9519",
                    },
                    ink: {
                        DEFAULT: "#080612",
                        mid: "#0d0a1b",
                        soft: "#120c28",
                    },
                },
            },
            fontFamily: {
                display: ["var(--font-display)", "Georgia", "serif"],
                sans: ["var(--font-sans)", "system-ui", "sans-serif"],
                mono: ["var(--font-mono)", "monospace"],
            },
            backgroundImage: {
                "app-bg":
                    "radial-gradient(circle at 12% 12%, rgba(105,68,215,0.34), transparent 28%), radial-gradient(circle at 78% 20%, rgba(229,191,68,0.2), transparent 24%), linear-gradient(145deg,#070510,#0d0a1b 52%,#120c28)",
                "card-gradient":
                    "linear-gradient(135deg, rgba(36,27,85,0.92), rgba(17,12,44,0.94))",
                "gold-btn":
                    "linear-gradient(120deg, rgba(240,203,84,0.92), rgba(204,149,25,0.92))",
            },
            borderColor: {
                "gold-mid": "rgba(229,191,68,0.5)",
                "gold-dim": "rgba(229,191,68,0.3)",
                "white-low": "rgba(255,255,255,0.12)",
                "white-faint": "rgba(255,255,255,0.07)",
            },
            boxShadow: {
                "gold-sm": "0 0 0 1px rgba(229,191,68,0.35)",
                card: "0 4px 24px rgba(0,0,0,0.45)",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0", transform: "translateY(8px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                "fade-in": "fade-in 0.25s ease both",
            },
        },
    },
    plugins: [typography],
};

export default config;
