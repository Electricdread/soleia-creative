import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
        logo: ['Montserrat', 'ui-sans-serif', 'sans-serif'],
        'logo-alt': ['Montserrat', 'ui-sans-serif', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        tech: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        glass: "hsl(var(--glass))",
        surface: "hsl(var(--surface))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      // iOS reads 100vh as the viewport with Safari's toolbars hidden, so an
      // h-screen box ran under the toolbar and every min-h-screen page scrolled
      // by a toolbar's worth. A page's floor is the small viewport (svh: stable
      // while the toolbars move) inside the safe-area padding on <html>; a
      // full-screen box is the dynamic one. 100vh first, for browsers without.
      minHeight: {
        screen: ["100vh", "calc(100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom))"] as unknown as string,
      },
      height: {
        screen: ["100vh", "100dvh"] as unknown as string,
      },
      maxHeight: {
        screen: ["100vh", "100dvh"] as unknown as string,
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 30px -10px hsl(38 92% 50% / 0.4)" },
          "50%": { boxShadow: "0 0 50px -10px hsl(38 92% 50% / 0.6)" },
        },
        "luxury-fade": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "accordion-up": "accordion-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in": "fade-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "scale-in": "scale-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "slide-up": "slide-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "luxury-fade": "luxury-fade 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "shimmer": "shimmer 3s infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // touch: -- a finger, not a mouse (phones and iPads). For the tap
    // equivalent of a hover-only control: opacity-0 group-hover:opacity-100
    // touch:opacity-100. Scoped under :root so it outranks the responsive
    // variants, which Tailwind emits after it: `sm:min-h-0 touch:min-h-11`
    // must keep an iPad's 44px.
    plugin(({ addVariant }) => {
      addVariant("touch", "@media (hover: none) and (pointer: coarse) { :root & }");
      // short: a phone on its side (iPhone 16 Pro landscape is 874 x 402), where
      // a hero sized for the width would fill the whole screen with headline.
      addVariant("short", "@media (orientation: landscape) and (max-height: 500px) { :root & }");
    }),
  ],
} satisfies Config;
