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
  Youtube,
  Clapperboard,
  Play,
  Music,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImageGenerator } from "@/components/media/ImageGenerator";
import { InfographicBuilder } from "@/components/media/InfographicBuilder";
import { VideoSearch } from "@/components/media/VideoSearch";
import { VideoGenerator } from "@/components/media/VideoGenerator";
import { AudioGenerator } from "@/components/media/AudioGenerator";

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
  VIDEO_EMBED:     "YouTube",
  VIDEO_GENERATED: "Video Preview",
};

const TYPE_COLOURS: Record<MediaAsset["type"], string> = {
  IMAGE:           "bg-sky-100 text-sky-700",
  INFOGRAPHIC:     "bg-violet-100 text-violet-700",
  AUDIO:           "bg-amber-100 text-amber-700",
  VIDEO_EMBED:     "bg-red-100 text-red-700",
  VIDEO_GENERATED: "bg-purple-100 text-purple-700",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function videoIdFromEmbedUrl(url: string): string {
  return url.split("/").pop()?.split("?")[0] ?? "";
}

function AssetCard({
  asset,
  onDelete,
}: {
  asset: MediaAsset;
  onDelete: (id: string) => void;
}) {
  const [deleting, startDelete] = useTransition();
  const [playing,  setPlaying]  = useState(false);

  function handleDelete() {
    if (!confirm("Delete this asset? This cannot be undone.")) return;
    startDelete(async () => {
      const res = await fetch(`/api/media/${asset.id}`, { method: "DELETE" });
      if (res.ok) onDelete(asset.id);
    });
  }

  const isImage       = asset.type === "IMAGE" || asset.type === "INFOGRAPHIC" || asset.type === "VIDEO_GENERATED";
  const isAudio       = asset.type === "AUDIO";
  const isVideoEmbed  = asset.type === "VIDEO_EMBED";
  const videoId       = isVideoEmbed ? videoIdFromEmbedUrl(asset.url) : null;
  const thumbnailUrl  = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  const ytUrl         = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

  return (
    <div className="group rounded-xl border bg-card overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {isVideoEmbed && thumbnailUrl ? (
          playing ? (
            <iframe
              src={`${asset.url}?autoplay=1&rel=0`}
              title={asset.filename ?? "YouTube video"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <Image
                src={thumbnailUrl}
                alt={asset.filename ?? "YouTube video"}
                fill
                className="object-cover transition-transform group-hover:scale-[1.02]"
                unoptimized
              />
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="bg-red-600 rounded-full p-3">
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              </button>
            </>
          )
        ) : isImage ? (
          <Image
            src={asset.url}
            alt={asset.prompt ?? "Media asset"}
            fill
            className="object-cover transition-transform group-hover:scale-[1.02]"
            unoptimized
          />
        ) : isAudio ? (
          <div className="flex h-full w-full items-center justify-center bg-amber-50 text-amber-500">
            <Music className="h-10 w-10" />
          </div>
        ) : (
          <div className="text-muted-foreground/40">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {/* Overlay actions (not shown when video is playing) */}
        {!playing && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 gap-1.5">
            {ytUrl ? (
              <a
                href={ytUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-white/90 p-1.5 text-gray-900 hover:bg-white transition-colors"
              >
                <Youtube className="h-3.5 w-3.5" />
              </a>
            ) : (
              <a
                href={asset.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-white/90 p-1.5 text-gray-900 hover:bg-white transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-500/90 p-1.5 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
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
        {isAudio ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio controls src={asset.url} className="w-full h-8 mt-1" />
        ) : (asset.filename || asset.prompt) ? (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {asset.filename ?? asset.prompt}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground/60 mt-auto pt-1">
          {new Date(asset.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export function MediaClient() {
  const [assets, setAssets]         = useState<MediaAsset[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, startRefresh]  = useTransition();

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
  const audios       = assets.filter((a) => a.type === "AUDIO");
  const videos       = assets.filter((a) => a.type === "VIDEO_EMBED" || a.type === "VIDEO_GENERATED");
  const all          = assets;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated images, infographics, TTS audio, YouTube embeds, and video previews
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

        {/* ── Generate tab ─────────────────────────────────────────────────── */}
        <TabsContent value="generate" className="mt-4 space-y-6">

          {/* Row 1: Image + Infographic */}
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

          {/* Row 2: Text-to-Speech Audio */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-amber-100 p-2">
                <Volume2 className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <p className="font-medium text-sm">Text-to-Speech Audio</p>
                <p className="text-xs text-muted-foreground">Google Cloud Neural2 · CEFR-paced · cached</p>
              </div>
            </div>
            <AudioGenerator onGenerated={handleGenerated} />
          </div>

          {/* Row 3: YouTube Search */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-red-100 p-2">
                <Youtube className="h-4 w-4 text-red-700" />
              </div>
              <div>
                <p className="font-medium text-sm">YouTube Video Search</p>
                <p className="text-xs text-muted-foreground">YouTube Data API v3 · quota-cached</p>
              </div>
            </div>
            <VideoSearch onSaved={() => startRefresh(load)} />
          </div>

          {/* Row 4: Video Generator */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-purple-100 p-2">
                <Clapperboard className="h-4 w-4 text-purple-700" />
              </div>
              <div>
                <p className="font-medium text-sm">Video Preview Generator</p>
                <p className="text-xs text-muted-foreground">Remotion templates · Puppeteer preview frame</p>
              </div>
            </div>
            <VideoGenerator onGenerated={handleGenerated} />
          </div>
        </TabsContent>

        {/* ── Library tab ──────────────────────────────────────────────────── */}
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
                Switch to the <strong>Generate</strong> tab to create your first asset.
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
              {audios.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">Audio ({audios.length})</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {audios.map((a) => <AssetCard key={a.id} asset={a} onDelete={handleDelete} />)}
                  </div>
                </div>
              )}
              {videos.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">Videos ({videos.length})</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {videos.map((a) => <AssetCard key={a.id} asset={a} onDelete={handleDelete} />)}
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
