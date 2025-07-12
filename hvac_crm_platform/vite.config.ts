import path from "node:path";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Enable React Fast Refresh for better development experience
      fastRefresh: true,
      // Optimize JSX runtime for production
      jsxRuntime: mode === "production" ? "automatic" : "classic",
    }),
    // Bundle analyzer for performance optimization
    mode === "production" &&
      visualizer({
        filename: "dist/bundle-analysis.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    // The code below enables dev tools like taking screenshots of your site
    // while it is being developed on chef.convex.dev.
    // Feel free to remove this code if you're no longer developing your app with Chef.
    mode === "development"
      ? {
          name: "inject-chef-dev",
          transform(code: string, id: string) {
            if (id.includes("main.tsx")) {
              return {
                code: `${code}

/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
                map: null,
              };
            }
            return null;
          },
        }
      : null,
    // End of code for taking screenshots on chef.convex.dev.
  ].filter(Boolean),

  // Performance optimizations
  build: {
    // Target modern browsers for better performance
    target: "es2020",

    // Optimize bundle size
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: mode === "production",
        pure_funcs: mode === "production" ? ["console.log", "console.info"] : [],
      },
    },

    // Code splitting configuration
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          "vendor-react": ["react", "react-dom"],
          "vendor-ui": ["lucide-react", "@radix-ui/react-dialog", "@radix-ui/react-select"],
          "vendor-charts": ["recharts"],
          "vendor-maps": ["leaflet", "react-leaflet"],
          "vendor-convex": ["convex/react"],

          // Feature chunks
          dashboard: [
            "./src/components/modules/HVACDashboard.tsx",
            "./src/components/modules/DashboardOverview.tsx",
            "./src/components/modules/PerformanceDashboard.tsx",
          ],
          analytics: [
            "./src/components/modules/BusinessIntelligenceDashboard.tsx",
            "./src/components/modules/AdvancedAnalyticsDashboard.tsx",
            "./src/components/modules/EnergyAnalyticsChart.tsx",
          ],
          modules: [
            "./src/components/modules/JobsModule.tsx",
            "./src/components/modules/ContactsModule.tsx",
            "./src/components/modules/EquipmentModule.tsx",
          ],
        },

        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const _facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split("/").pop()
            : "chunk";
          return `js/[name]-[hash].js`;
        },
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },

    // Optimize chunk size warnings
    chunkSizeWarningLimit: 800, // 800KB warning limit

    // Source maps for production debugging
    sourcemap: mode === "production" ? "hidden" : true,
  },

  // Development server optimizations
  server: {
    // Enable HTTP/2 for better performance
    https: false,

    // Optimize HMR
    hmr: {
      overlay: true,
    },

    // Preload modules for faster development
    warmup: {
      clientFiles: [
        "./src/components/modules/HVACDashboard.tsx",
        "./src/components/modules/BusinessIntelligenceDashboard.tsx",
        "./src/hooks/useConvexRealTime.ts",
      ],
    },
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "convex/react",
      "lucide-react",
      "recharts",
      "leaflet",
      "react-leaflet",
      "sonner",
    ],
    exclude: [
      // Exclude large dependencies that should be loaded on demand
      "@weaviate-client",
    ],
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // CSS optimization
  css: {
    devSourcemap: mode === "development",
    postcss: {
      plugins: [
        // Add autoprefixer and other PostCSS plugins if needed
      ],
    },
  },

  // Performance monitoring
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __PERFORMANCE_TARGET__: JSON.stringify({
      bundleSize: 800, // KB
      responseTime: 300, // ms
      mobileScore: 95, // Lighthouse score
    }),
  },
}));
