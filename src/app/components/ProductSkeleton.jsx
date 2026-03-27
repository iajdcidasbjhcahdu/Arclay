"use client";

import { motion } from "framer-motion";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-[#ECE8E0] animate-pulse">
      <div className="relative aspect-[4/5] bg-[#F3EFE8]/50" />
      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div className="h-5 bg-[#F3EFE8] rounded-md w-3/4" />
        <div className="h-3 bg-[#F3EFE8] rounded-md w-1/2" />
        <div className="flex items-center gap-2 mt-auto">
          <div className="h-6 bg-[#F3EFE8] rounded-md w-20" />
          <div className="h-4 bg-[#F3EFE8] rounded-md w-12" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#FEFBF6] py-12">
      <div className="container mx-auto px-4 xl:px-8 max-w-7xl animate-pulse">
        <div className="grid lg:grid-cols-2 gap-16">
          <div className="aspect-square bg-[#F3EFE8]/50 rounded-2xl" />
          <div className="space-y-6">
            <div className="h-4 bg-[#F3EFE8] rounded w-1/4" />
            <div className="h-12 bg-[#F3EFE8] rounded w-3/4" />
            <div className="h-6 bg-[#F3EFE8] rounded w-1/2" />
            <div className="h-32 bg-[#F3EFE8] rounded-2xl" />
            <div className="h-16 bg-[#F3EFE8] rounded-2xl w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-14 bg-[#F3EFE8] rounded-xl" />
              <div className="h-14 bg-[#F3EFE8] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
