"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Image from "next/image";
import {
  ImageIcon,
  LayoutTemplate,
  Trash2,
  Loader2,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImageGenerator } from "@/components/media/ImageGenerator";
import { InfographicBuilder } from "@/components/media/InfographicBuilder";

interface MediaAsset {
  id: string;
  type: "IMAGE" | "AUDIO" | "VIDEO_EMBED" | "VIDEO_GENERATED" | "INFOGRAPHIC";
  url: string;
  prompt: string | null;
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  lessonId: string | null;
}

const TYPE_LABELS: Record<MediaAsset["type"], string> = {
  IMAGE:           "Image",
  INFOGRAPHIC:     "Infographic",
  AUDIO:           "Audio",
  VIDEO_EMBED:     "Video",
  VIDEO_GENERATED: "Video",
};

const TYPE_COLOURS: Record<MediaAsset["type"], string> = {
  IMAGE:           "bg-sky-100 text-sky-700",
  INFOGRAPHIC:     "bg-violet-100 text-violet-700",
  AUDIO:           "bg-amber-100 text-amber-700",
  VIDEO_EMBED:     "bg-emerald-100 text-emerald-700",
  VIDEO_GENERATED: "bg-emerald-100 text-emerald-700",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function AssetCard({
  asset,
  onDelete,
}: {
  asset: MediaAsset;
  onDelete: (id: string) => void;
}) {
  const [deleting, startDelete] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this asset? This cannot be undone.")) return;
    startDelete(async () => {
      const res = await fetch(`/api/media/${asset.id}`, { method: "DELETE" });
      if (res.ok) onDelete(asset.id);
    });
  }

  const isImage = asset.type === "IMAGE" || asset.type === "INFOGRAPHIC";

  return (
    <div className="group rounded-xl border bg-card overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {isImage ? (
          <Image
            src={asset.url}
            alt={asset.prompt ?? "Media asset"}
            fill
            className="object-cover transition-transform group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="text-muted-foreground/40">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 gap-1.5">
          <a
            href={asset.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-white/90 p-1.5 text-gray-900 hover:bg-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-500/90 p-1.5 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge className={`text-xs px-1.5 py-0 ${TYPE_COLOURS[asset.type]}`} variant="outline">
            {TYPE_LABELS[asset.type]}
          </Badge>
          {asset.sizeBytes && (
            <span className="text-xs text-muted-foreground ml-auto">{formatBytes(asset.sizeBytes)}</span>
          )}
        </div>
        {asset.prompt && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{asset.prompt}</p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-auto pt-1">
          {new Date(asset.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export function MediaClient() {
  const [assets, setAssets]     = useState<MediaAsset[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, startRefresh] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      if (res.ok) setAssets(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleGenerated(_url: string, id: string) {
    // Optimistically reload the library after a short delay (R2 CDN propagation)
    startRefresh(async () => {
      await new Promise((r) => setTimeout(r, 800));
      const res = await fetch("/api/media");
      if (res.ok) setAssets(await res.json());
      void id;
    });
  }

  function handleDelete(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  const images       = assets.filter((a) => a.type === "IMAGE");
  const infographics = assets.filter((a) => a.type === "INFOGRAPHIC");
  const all          = assets;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated images and infographics — stored in Cloudflare R2
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => startRefresh(load)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="library">
            Library
            {assets.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">{assets.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Generate tab */}
        <TabsContent value="generate" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Generator */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-sky-100 p-2">
                  <ImageIcon className="h-4 w-4 text-sky-700" />
                </div>
                <div>
                  <p className="font-medium text-sm">Image Generator</p>
                  <p className="text-xs text-muted-foreground">Pollinations.ai · FLUX.1-schnell</p>
                </div>
              </div>
              <ImageGenerator onGenerated={handleGenerated} />
            </div>

            {/* Infographic Builder */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-violet-100 p-2">
                  <LayoutTemplate className="h-4 w-4 text-violet-700" />
                </div>
                <div>
                  <p className="font-medium text-sm">Infographic Builder</p>
                  <p className="text-xs text-muted-foreground">Puppeteer · 3 templates</p>
                </div>
              </div>
              <InfographicBuilder onGenerated={handleGenerated} />
            </div>
          </div>
        </TabsContent>

        {/* Library tab */}
        <TabsContent value="library" className="mt-4">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : all.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed bg-muted/30">
              <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">No media yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Switch to the <strong>Generate</strong> tab to create your first image or infographic.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {images.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">Images ({images.length})</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {images.map((a) => <AssetCard key={a.id} asset={a} onDelete={handleDelete} />)}
                  </div>
                </div>
              )}
              {infographics.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">Infographics ({infographics.length})</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {infographics.map((a) => <AssetCard key={a.id} asset={a} onDelete={handleDelete} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
