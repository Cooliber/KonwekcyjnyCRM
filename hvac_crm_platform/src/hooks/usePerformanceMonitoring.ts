/**
 * Enhanced Performance Monitoring Hook
 * Real-time tracking of performance metrics for 137/137 godlike quality
 * Targets: <800KB bundle, <300ms response, >95% mobile score
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface PerformanceTargets {
  bundleSize: 800; // KB
  responseTime: 300; // ms
  mobileScore: 95; // Lighthouse score
  cacheHitRate: 80; // percentage
  memoryUsage: 100; // MB
}

interface RealTimeMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  
  // Resource metrics
  bundleSize: number; // KB
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
  networkLatency: number; // ms
  
  // User experience
  mobileScore: number;
  pwaCompliant: boolean;
  offlineCapable: boolean;
  
  // Performance scores
  performanceScore: number; // 0-100
  accessibilityScore: number; // 0-100
  bestPracticesScore: number; // 0-100
  seoScore: number; // 0-100
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
    bundleSize: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    mobileScore: 0,
    pwaCompliant: false,
    offlineCapable: false,
    performanceScore: 0,
    accessibilityScore: 0,
    bestPracticesScore: 0,
    seoScore: 0,
  });
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);

  const TARGETS: PerformanceTargets = {
    bundleSize: 800,
    responseTime: 300,
    mobileScore: 95,
    cacheHitRate: 80,
    memoryUsage: 100,
  };

  // Core Web Vitals measurement
  const measureCoreWebVitals = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observerRef.current = lcpObserver;
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    }
  }, []);

  // Memory and CPU monitoring
  const measureResourceUsage = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsageMB = memory.usedJSHeapSize / (1024 * 1024);
      setMetrics(prev => ({ ...prev, memoryUsage: memoryUsageMB }));
    }

    // Network latency estimation
    const startTime = performance.now();
    fetch('/api/ping', { method: 'HEAD' })
      .then(() => {
        const latency = performance.now() - startTime;
        setMetrics(prev => ({ ...prev, networkLatency: latency }));
      })
      .catch(() => {
        // Fallback: estimate based on navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        if (navigation) {
          const latency = navigation.responseStart - navigation.requestStart;
          setMetrics(prev => ({ ...prev, networkLatency: latency }));
        }
      });
  }, []);

  // Bundle size calculation
  const calculateBundleSize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;

    resources.forEach((resource) => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        totalSize += resource.transferSize || 0;
      }
    });

    const bundleSizeKB = totalSize / 1024;
    setMetrics(prev => ({ ...prev, bundleSize: bundleSizeKB }));
  }, []);

  // PWA compliance check
  const checkPWACompliance = useCallback(() => {
    if (typeof window === 'undefined') return;

    const hasSW = 'serviceWorker' in navigator;
    const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    
    const pwaCompliant = hasSW && hasManifest && isHTTPS;
    const offlineCapable = hasSW && 'caches' in window;

    setMetrics(prev => ({ 
      ...prev, 
      pwaCompliant,
      offlineCapable 
    }));
  }, []);

  // Performance score calculation
  const calculatePerformanceScore = useCallback((currentMetrics: RealTimeMetrics) => {
    let score = 100;

    // LCP scoring (0-2.5s = 100, 2.5-4s = 50, >4s = 0)
    if (currentMetrics.lcp > 4000) score -= 25;
    else if (currentMetrics.lcp > 2500) score -= 12;

    // FID scoring (0-100ms = 100, 100-300ms = 50, >300ms = 0)
    if (currentMetrics.fid > 300) score -= 25;
    else if (currentMetrics.fid > 100) score -= 12;

    // CLS scoring (0-0.1 = 100, 0.1-0.25 = 50, >0.25 = 0)
    if (currentMetrics.cls > 0.25) score -= 25;
    else if (currentMetrics.cls > 0.1) score -= 12;

    // Bundle size scoring
    if (currentMetrics.bundleSize > TARGETS.bundleSize * 1.5) score -= 15;
    else if (currentMetrics.bundleSize > TARGETS.bundleSize) score -= 8;

    // Memory usage scoring
    if (currentMetrics.memoryUsage > TARGETS.memoryUsage * 1.5) score -= 10;
    else if (currentMetrics.memoryUsage > TARGETS.memoryUsage) score -= 5;

    return Math.max(0, score);
  }, [TARGETS]);

  // Alert generation
  const checkThresholds = useCallback((currentMetrics: RealTimeMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    // Bundle size alert
    if (currentMetrics.bundleSize > TARGETS.bundleSize) {
      newAlerts.push({
        type: currentMetrics.bundleSize > TARGETS.bundleSize * 1.2 ? 'error' : 'warning',
        metric: 'Bundle Size',
        value: currentMetrics.bundleSize,
        threshold: TARGETS.bundleSize,
        message: `Bundle size (${currentMetrics.bundleSize.toFixed(1)}KB) exceeds target (${TARGETS.bundleSize}KB)`,
        timestamp: new Date(),
      });
    }

    // LCP alert
    if (currentMetrics.lcp > 2500) {
      newAlerts.push({
        type: currentMetrics.lcp > 4000 ? 'error' : 'warning',
        metric: 'Largest Contentful Paint',
        value: currentMetrics.lcp,
        threshold: 2500,
        message: `LCP (${currentMetrics.lcp.toFixed(0)}ms) is slower than recommended (2.5s)`,
        timestamp: new Date(),
      });
    }

    // Memory usage alert
    if (currentMetrics.memoryUsage > TARGETS.memoryUsage) {
      newAlerts.push({
        type: currentMetrics.memoryUsage > TARGETS.memoryUsage * 1.5 ? 'error' : 'warning',
        metric: 'Memory Usage',
        value: currentMetrics.memoryUsage,
        threshold: TARGETS.memoryUsage,
        message: `Memory usage (${currentMetrics.memoryUsage.toFixed(1)}MB) exceeds target (${TARGETS.memoryUsage}MB)`,
        timestamp: new Date(),
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-9), ...newAlerts]); // Keep last 10 alerts
      
      // Show toast for critical alerts
      newAlerts.forEach(alert => {
        if (alert.type === 'error') {
          toast.error(`Performance Alert: ${alert.message}`);
        } else if (alert.type === 'warning') {
          toast.warning(`Performance Warning: ${alert.message}`);
        }
      });
    }
  }, [TARGETS]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    measureCoreWebVitals();
    checkPWACompliance();

    intervalRef.current = setInterval(() => {
      measureResourceUsage();
      calculateBundleSize();
      
      setMetrics(currentMetrics => {
        const performanceScore = calculatePerformanceScore(currentMetrics);
        const updatedMetrics = { ...currentMetrics, performanceScore };
        
        checkThresholds(updatedMetrics);
        return updatedMetrics;
      });
    }, 5000); // Update every 5 seconds
  }, [isMonitoring, measureCoreWebVitals, measureResourceUsage, calculateBundleSize, checkPWACompliance, calculatePerformanceScore, checkThresholds]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  return {
    metrics,
    alerts,
    isMonitoring,
    targets: TARGETS,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
  };
}
