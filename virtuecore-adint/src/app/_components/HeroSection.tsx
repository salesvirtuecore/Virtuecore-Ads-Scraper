"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

/* ----------- */
function DotGrid() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let raf: number;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const draw = (t: number) => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            const spacing = 30;
            const cols = Math.ceil(w / spacing) + 2;
            const rows = Math.ceil(h / spacing) + 2;
            const cx = w / 2;
            const cy = h * 0.42;
            const maxDist = Math.hypot(w * 0.6, h * 0.7);

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * spacing;
                    const y = j * spacing;
                    const wave = Math.sin(t * 0.0007 + i * 0.38 + j * 0.22) * 2.2;
                    const dist = Math.hypot(x - cx, y - cy);
                    const proximity = Math.max(0, 1 - dist / maxDist);
                    const pulse = 0.55 + 0.45 * Math.sin(t * 0.0005 + i * 0.45 + j * 0.3);
                    const alpha = proximity * pulse * 0.16;
                    if (alpha < 0.006) continue;

                    ctx.beginPath();
                    ctx.arc(x + wave, y + wave * 0.55, 1.3, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(229,191,68,${alpha.toFixed(3)})`;
                    ctx.fill();
                }
            }

            raf = requestAnimationFrame(draw);
        };

        raf = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                display: "block",
                pointerEvents: "none",
            }}
        />
    );
}

/* ----------- */
function LiveLabel() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ display: "flex", justifyContent: "center" }}
        >
            <div style={{ position: "relative", display: "inline-flex" }}>
                {/* pulsing border glow */}
                <motion.div
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        inset: -1,
                        borderRadius: 999,
                        background:
                            "linear-gradient(90deg, rgba(229,191,68,0.75), rgba(229,191,68,0.1), rgba(229,191,68,0.75))",
                        filter: "blur(3px)",
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "rgba(10,7,22,0.92)",
                        border: "1px solid rgba(229,191,68,0.3)",
                        borderRadius: 999,
                        padding: "0.35rem 1.1rem",
                    }}
                >
                    {/* live dot */}
                    <motion.span
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            display: "inline-block",
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "#e5bf44",
                            boxShadow: "0 0 8px rgba(229,191,68,0.95)",
                            flexShrink: 0,
                        }}
                    />
                    <span
                        style={{
                            color: "rgba(229,191,68,0.9)",
                            fontSize: "0.69rem",
                            fontWeight: 700,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                        }}
                    >
                        VirtueCore · Ad Intelligence Platform
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

/* ----------- */
type Word = { text: string; gold: boolean };

const LINES: Word[][] = [
    [
        { text: "Know", gold: false },
        { text: "exactly", gold: false },
        { text: "what", gold: false },
        { text: "your", gold: false },
    ],
    [
        { text: "competitors", gold: true },
        { text: "are", gold: false },
        { text: "running\u00a0\u2014", gold: false },
    ],
    [
        { text: "and", gold: false },
        { text: "why", gold: false },
        { text: "it\u2019s", gold: false },
        { text: "working.", gold: true },
    ],
];

function AnimatedHeadline() {
    let globalIdx = 0;
    return (
        <h1
            style={{
                fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                margin: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.08em",
            }}
        >
            {LINES.map((line, li) => (
                <span
                    key={li}
                    style={{
                        display: "flex",
                        gap: "0.28em",
                        flexWrap: "wrap",
                        justifyContent: "center",
                    }}
                >
                    {line.map((word) => {
                        const delay = 0.28 + globalIdx * 0.075 + (word.gold ? 0.05 : 0);
                        globalIdx++;
                        return (
                            <motion.span
                                key={`${li}-${word.text}`}
                                initial={{ opacity: 0, y: 26 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.6,
                                    delay,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                style={{
                                    display: "inline-block",
                                    color: word.gold ? "#e5bf44" : "#ffffff",
                                    ...(word.gold && {
                                        textShadow: "0 0 48px rgba(229,191,68,0.4)",
                                    }),
                                }}
                            >
                                {word.text}
                            </motion.span>
                        );
                    })}
                </span>
            ))}
        </h1>
    );
}

/* ----------- */
function ShimmerButton() {
    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{ position: "relative", display: "inline-block" }}
        >
            {/* ambient glow */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -6,
                    borderRadius: 18,
                    background: "rgba(229,191,68,0.22)",
                    filter: "blur(14px)",
                    pointerEvents: "none",
                }}
            />
            <Link
                href="/auth/signup"
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    overflow: "hidden",
                    background: "linear-gradient(120deg, #f0cb54, #cc9519)",
                    color: "#1e1703",
                    fontWeight: 700,
                    fontSize: "1rem",
                    padding: "0.85rem 2rem",
                    borderRadius: "12px",
                    textDecoration: "none",
                    letterSpacing: "0.01em",
                    whiteSpace: "nowrap",
                }}
            >
                Start free trial →
                {/* shimmer sweep */}
                <motion.span
                    aria-hidden="true"
                    animate={{ x: ["-140%", "240%"] }}
                    transition={{
                        duration: 0.75,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 2.8,
                    }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "38%",
                        height: "100%",
                        background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.48), transparent)",
                        transform: "skewX(-15deg)",
                        pointerEvents: "none",
                    }}
                />
            </Link>
        </motion.div>
    );
}

/* ----------- */
export default function HeroSection() {
    return (
        <section
            style={{
                position: "relative",
                width: "min(1100px, 92vw)",
                margin: "5rem auto 4rem",
                textAlign: "center",
            }}
        >
            {/* Dot grid canvas layer */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: "-8rem -12vw",
                    overflow: "hidden",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            >
                <DotGrid />
            </div>

            {/* Radial amber glow behind headline */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: "24%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "min(720px, 95vw)",
                    height: 380,
                    background:
                        "radial-gradient(ellipse at center, rgba(229,191,68,0.07) 0%, transparent 68%)",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            {/* Content stack */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    gap: "1.75rem",
                }}
            >
                <LiveLabel />

                <AnimatedHeadline />

                <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.15, ease: "easeOut" }}
                    style={{
                        fontSize: "clamp(1rem, 2vw, 1.2rem)",
                        color: "rgba(255,255,255,0.6)",
                        lineHeight: 1.7,
                        margin: "0 auto",
                        maxWidth: 580,
                    }}
                >
                    Scan the Meta Ads Library, identify ads that have been running for months (the
                    profitable ones), and get an AI-powered strategy report built around your brand.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.35, ease: "easeOut" }}
                    style={{
                        display: "flex",
                        gap: "0.75rem",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <ShimmerButton />

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    >
                        <Link
                            href="/auth/login"
                            style={{
                                display: "inline-block",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.16)",
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: "1rem",
                                padding: "0.85rem 2rem",
                                borderRadius: "12px",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Sign in
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.55 }}
                    style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", margin: 0 }}
                >
                    7 days Ultimate · 3 days Pro · then free forever · No credit card required
                </motion.p>
            </div>
        </section>
    );
}
