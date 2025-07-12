/**
 * Performance Optimization Utilities
 * Advanced optimization techniques for 137/137 godlike quality
 * Targets: <800KB bundle, <300ms response, >95% mobile score
 */

import React, { lazy, ComponentType, LazyExoticComponent } from 'react';
import { toast } from 'sonner';

// Performance monitoring
interface PerformanceMetrics {
  componentRenderTime: number;
  bundleLoadTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

// Lazy loading with error boundaries and loading states
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string,
  preloadCondition?: () => boolean
): LazyExoticComponent<T> {
  const LazyComponent = lazy(async () => {
    const startTime = performance.now();
    
    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;
      
      // Log performance metrics
      console.log(`🚀 Lazy loaded ${componentName} in ${loadTime.toFixed(2)}ms`);
      
      // Alert if loading is slow
      if (loadTime > 1000) {
        toast.warning(`Slow component load: ${componentName} took ${loadTime.toFixed(0)}ms`);
      }
      
      return module;
    } catch (error) {
      console.error(`❌ Failed to load ${componentName}:`, error);
      toast.error(`Failed to load ${componentName}. Please refresh the page.`);
      throw error;
    }
  });

  // Preload component if condition is met
  if (preloadCondition && preloadCondition()) {
    importFn().catch(error => {
      console.warn(`Preload failed for ${componentName}:`, error);
    });
  }

  return LazyComponent;
}

// Advanced memoization with performance tracking
export function createMemoizedComponent<T extends ComponentType<any>>(
  Component: T,
  areEqual?: (prevProps: any, nextProps: any) => boolean,
  componentName?: string
): T {
  const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
    const startTime = performance.now();
    
    // Default shallow comparison
    const isEqual = areEqual ? areEqual(prevProps, nextProps) : shallowEqual(prevProps, nextProps);
    
    const compareTime = performance.now() - startTime;
    
    // Log expensive comparisons
    if (compareTime > 5) {
      console.warn(`🐌 Expensive memo comparison for ${componentName || Component.name}: ${compareTime.toFixed(2)}ms`);
    }
    
    return isEqual;
  });

  return MemoizedComponent as T;
}

// Shallow equality check for props
function shallowEqual(obj1: any, obj2: any): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

// Debounced function with performance optimization
export function createOptimizedDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T>;
  let lastThis: any;
  let result: ReturnType<T>;

  const { leading = false, trailing = true, maxWait } = options;

  function invokeFunc(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = undefined as any;
    lastThis = undefined;
    lastInvokeTime = time;
    
    const startTime = performance.now();
    result = func.apply(thisArg, args);
    const executeTime = performance.now() - startTime;
    
    // Log slow function executions
    if (executeTime > 100) {
      console.warn(`🐌 Slow debounced function execution: ${executeTime.toFixed(2)}ms`);
    }
    
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined as any;
    lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastCallTime = 0;
    lastArgs = undefined as any;
    lastThis = undefined;
    timeoutId = null;
    maxTimeoutId = null;
  }

  function flush() {
    return timeoutId === null ? result : trailingEdge(Date.now());
  }

  function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced as T & { cancel: () => void; flush: () => void };
}

// Throttled function with performance optimization
export function createOptimizedThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel: () => void; flush: () => void } {
  return createOptimizedDebounce(func, delay, {
    ...options,
    maxWait: delay,
  });
}

// Virtual scrolling helper for large lists
export function calculateVirtualScrollItems(
  totalItems: number,
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  overscan: number = 5
) {
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleItemCount + overscan * 2);

  return {
    startIndex,
    endIndex,
    visibleItemCount,
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight,
  };
}

// Image optimization helper
export function optimizeImageLoading(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
    lazy?: boolean;
  } = {}
): {
  src: string;
  srcSet?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
} {
  const { width, height, quality = 85, format = 'webp', lazy = true } = options;

  // Generate optimized URL (this would integrate with your image optimization service)
  let optimizedSrc = src;
  const params = new URLSearchParams();

  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality !== 85) params.append('q', quality.toString());
  if (format !== 'webp') params.append('f', format);

  if (params.toString()) {
    optimizedSrc = `${src}?${params.toString()}`;
  }

  // Generate srcSet for responsive images
  const srcSet = width
    ? [
        `${optimizedSrc} 1x`,
        `${optimizedSrc.replace(`w=${width}`, `w=${width * 2}`)} 2x`,
      ].join(', ')
    : undefined;

  return {
    src: optimizedSrc,
    srcSet,
    loading: lazy ? 'lazy' : 'eager',
    decoding: 'async',
  };
}

// Bundle size analyzer
export function analyzeBundleSize(): Promise<{
  totalSize: number;
  chunks: Array<{ name: string; size: number }>;
  recommendations: string[];
}> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ totalSize: 0, chunks: [], recommendations: [] });
      return;
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const chunks: Array<{ name: string; size: number }> = [];
    let totalSize = 0;

    resources.forEach((resource) => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        const size = resource.transferSize || 0;
        const name = resource.name.split('/').pop() || 'unknown';
        
        chunks.push({ name, size });
        totalSize += size;
      }
    });

    const totalSizeKB = totalSize / 1024;
    const recommendations: string[] = [];

    if (totalSizeKB > 800) {
      recommendations.push('Bundle size exceeds 800KB target. Consider code splitting.');
    }

    const largeChunks = chunks.filter(chunk => chunk.size > 100 * 1024); // >100KB
    if (largeChunks.length > 0) {
      recommendations.push(`Large chunks detected: ${largeChunks.map(c => c.name).join(', ')}`);
    }

    resolve({
      totalSize: totalSizeKB,
      chunks: chunks.sort((a, b) => b.size - a.size),
      recommendations,
    });
  });
}

// Performance monitoring decorator
export function withPerformanceMonitoring<T extends ComponentType<any>>(
  Component: T,
  componentName?: string
): T {
  const PerformanceMonitoredComponent = (props: any) => {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      
      if (renderTime > 16) { // >16ms = potential 60fps issue
        console.warn(`🐌 Slow render: ${componentName || Component.name} took ${renderTime.toFixed(2)}ms`);
      }
    });

    return React.createElement(Component, props);
  };

  return PerformanceMonitoredComponent as T;
}

// Memory leak detector
export function detectMemoryLeaks() {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as any).memory;
  const memoryInfo = {
    usedJSHeapSize: memory.usedJSHeapSize / (1024 * 1024), // MB
    totalJSHeapSize: memory.totalJSHeapSize / (1024 * 1024), // MB
    jsHeapSizeLimit: memory.jsHeapSizeLimit / (1024 * 1024), // MB
  };

  // Alert if memory usage is high
  if (memoryInfo.usedJSHeapSize > 100) { // >100MB
    console.warn('🚨 High memory usage detected:', memoryInfo);
    toast.warning(`High memory usage: ${memoryInfo.usedJSHeapSize.toFixed(1)}MB`);
  }

  return memoryInfo;
}

// Export all optimization utilities
export const PerformanceOptimizer = {
  createLazyComponent,
  createMemoizedComponent,
  createOptimizedDebounce,
  createOptimizedThrottle,
  calculateVirtualScrollItems,
  optimizeImageLoading,
  analyzeBundleSize,
  withPerformanceMonitoring,
  detectMemoryLeaks,
};
