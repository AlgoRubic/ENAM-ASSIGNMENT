import React from 'react';

/**
 * Apple-grade Skeleton Loaders for FINN
 * Provides authentic, matching layout placeholders with smooth wave shimmer
 */

export function TerminalSkeleton() {
  return (
    <div className="space-y-4 pb-24 animate-pulse duration-1000">
      
      {/* Ticker Switcher Placeholder */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-shrink-0 w-16 h-7 rounded-full apple-skeleton" />
        ))}
      </div>

      {/* Hero Header Box Skeleton */}
      <div className="apple-skeleton-card rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="w-48 h-6 rounded-lg apple-skeleton" />
            <div className="w-28 h-3.5 rounded-md apple-skeleton" />
          </div>
          <div className="space-y-1.5 flex flex-col items-end">
            <div className="w-24 h-7 rounded-lg apple-skeleton" />
            <div className="w-16 h-4 rounded-full apple-skeleton" />
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
          <div className="w-56 h-3 rounded-md apple-skeleton" />
          <div className="w-20 h-3 rounded-md apple-skeleton" />
        </div>
      </div>

      {/* Feature Highlight Card Skeleton */}
      <div className="apple-skeleton-card rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="w-36 h-4 rounded-md apple-skeleton" />
          <div className="w-5 h-5 rounded-full apple-skeleton" />
        </div>
        <div className="w-full h-3 rounded-md apple-skeleton" />
      </div>

      {/* Module Selector Pills Skeleton */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-shrink-0 w-24 h-8 rounded-xl apple-skeleton" />
        ))}
      </div>

      {/* Core Statistical Boxes Skeleton (Grid of 6 Cards) */}
      <div className="apple-skeleton-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-32 h-4 rounded-md apple-skeleton" />
          <div className="w-16 h-3 rounded-md apple-skeleton" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-black/40 border border-white/[0.04] space-y-2">
              <div className="w-16 h-2.5 rounded apple-skeleton" />
              <div className="w-24 h-5 rounded-md apple-skeleton" />
            </div>
          ))}
        </div>

        {/* Footer Citation Box Skeleton */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] space-y-1.5">
          <div className="w-40 h-3 rounded apple-skeleton" />
          <div className="w-full h-2.5 rounded apple-skeleton" />
        </div>
      </div>

    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4 pb-24 animate-pulse duration-1000">
      
      {/* Segmented Toolbar Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 h-9 rounded-xl apple-skeleton" />
        <div className="w-24 h-9 rounded-xl apple-skeleton" />
      </div>

      {/* Status Callout Box Skeleton */}
      <div className="apple-skeleton-card rounded-2xl px-4 py-3 flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="w-44 h-4 rounded apple-skeleton" />
          <div className="w-60 h-3 rounded apple-skeleton" />
        </div>
        <div className="w-16 h-5 rounded-full apple-skeleton" />
      </div>

      {/* Triggered Alerts Section Header Skeleton */}
      <div className="flex items-center justify-between px-1">
        <div className="w-32 h-3.5 rounded apple-skeleton" />
        <div className="w-20 h-3.5 rounded apple-skeleton" />
      </div>

      {/* Triggered Alert Cards Skeletons */}
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="apple-skeleton-card rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="w-36 h-4 rounded apple-skeleton" />
                <div className="w-28 h-3 rounded apple-skeleton" />
              </div>
              <div className="w-7 h-7 rounded-full apple-skeleton" />
            </div>
            <div className="w-full h-3 rounded apple-skeleton" />
          </div>
        ))}
      </div>

      {/* Exchange Filings Section Skeleton */}
      <div className="space-y-3 pt-2">
        <div className="w-40 h-3.5 rounded apple-skeleton" />

        {[1, 2].map((i) => (
          <div key={i} className="apple-skeleton-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 rounded apple-skeleton" />
              <div className="w-16 h-3 rounded apple-skeleton" />
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-4 rounded apple-skeleton" />
              <div className="w-3/4 h-3.5 rounded apple-skeleton" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-16 rounded-xl apple-skeleton" />
              <div className="h-16 rounded-xl apple-skeleton" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export function AuditSkeleton() {
  return (
    <div className="space-y-4 pb-24 animate-pulse duration-1000">
      
      {/* Ticker Switcher Placeholder */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-shrink-0 w-16 h-7 rounded-full apple-skeleton" />
        ))}
      </div>

      {/* Credibility Dial Box Skeleton */}
      <div className="apple-skeleton-card rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="w-32 h-3 rounded apple-skeleton" />
            <div className="w-48 h-6 rounded apple-skeleton" />
            <div className="w-64 h-3.5 rounded apple-skeleton" />
          </div>
          <div className="w-20 h-20 rounded-2xl apple-skeleton" />
        </div>
      </div>

      {/* Quarter Audit Cards Skeletons */}
      <div className="space-y-3">
        <div className="w-44 h-3.5 rounded apple-skeleton" />

        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="apple-skeleton-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-20 h-4 rounded apple-skeleton" />
              <div className="w-24 h-5 rounded-full apple-skeleton" />
            </div>
            <div className="p-3 rounded-xl bg-black/40 space-y-2">
              <div className="w-36 h-3 rounded apple-skeleton" />
              <div className="w-full h-4 rounded apple-skeleton" />
            </div>
            <div className="p-3 rounded-xl bg-black/40 space-y-2">
              <div className="w-40 h-3 rounded apple-skeleton" />
              <div className="w-3/4 h-4 rounded apple-skeleton" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
