"use client";

import React, { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { Search, Play, Loader2, ExternalLink, BookmarkPlus, Check, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type CefrLevel = "L1" | "A1" | "A2" | "B1" | "B2";

interface VideoAsset {
  id:        string;
  url:       string;       // https://www.youtube.com/embed/VIDEO_ID
  filename:  string | null; // video title
  prompt:    string | null; // cache key (query|level)
  createdAt: string;
}

interface Props {
  lessonId?:   string;
  cefrLevel?:  CefrLevel;
  onSaved?:    (asset: VideoAsset) => void;
}

const CEFR_OPTIONS: CefrLevel[] = ["L1", "A1", "A2", "B1", "B2"];

function videoIdFromEmbedUrl(url: string): string {
  return url.split("/").pop()?.split("?")[0] ?? "";
}

function thumbUrl(embedUrl: string): string {
  const id = videoIdFromEmbedUrl(embedUrl);
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

function EmbedModal({ asset, onClose }: { asset: VideoAsset; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={`${asset.url}?autoplay=1&rel=0`}
          title={asset.filename ?? "YouTube video"}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-colors text-sm font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function VideoCard({
  asset,
  onPlay,
  onSave,
  saving,
  saved,
}: {
  asset:  VideoAsset;
  onPlay: () => void;
  onSave: () => void;
  saving: boolean;
  saved:  boolean;
}) {
  const thumbnail = thumbUrl(asset.url);
  const videoId   = videoIdFromEmbedUrl(asset.url);
  const ytUrl     = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="group rounded-xl border bg-card overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <Image
          src={thumbnail}
          alt={asset.filename ?? "YouTube video"}
          fill
          className="object-cover transition-transform group-hover:scale-[1.03]"
          unoptimized
        />
        {/* Play overlay */}
        <button
          onClick={onPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Play video"
        >
          <div className="bg-red-600 rounded-full p-3 shadow-lg">
            <Play className="h-5 w-5 text-white fill-white" />
          </div>
        </button>
        <Badge className="absolute top-2 left-2 bg-red-600/90 text-white border-0 text-xs gap-1">
          <Youtube className="h-3 w-3" />
          YouTube
        </Badge>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <p className="text-xs font-medium leading-snug line-clamp-2">
          {asset.filename ?? "Untitled video"}
        </p>
        <div className="flex gap-1.5 mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={onSave}
            disabled={saving || saved}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : saved ? (
              <><Check className="h-3 w-3 mr-1 text-emerald-600" /><span className="text-emerald-600">Saved</span></>
            ) : (
              <><BookmarkPlus className="h-3 w-3 mr-1" />Save</>
            )}
          </Button>
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open on YouTube"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function VideoSearch({ lessonId, cefrLevel: initialLevel = "B1", onSaved }: Props) {
  const [query,     setQuery]     = useState("");
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>(initialLevel);
  const [results,   setResults]   = useState<VideoAsset[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [searching, startSearch]  = useTransition();
  const [playing,   setPlaying]   = useState<VideoAsset | null>(null);
  const [savedIds,  setSavedIds]  = useState<Set<string>>(new Set());
  const [savingId,  setSavingId]  = useState<string | null>(null);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setError(null);
    startSearch(async () => {
      try {
        const params = new URLSearchParams({
          q:         query.trim(),
          cefrLevel,
          ...(lessonId ? { lessonId } : {}),
        });
        const res = await fetch(`/api/video/search?${params}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? `Search failed (${res.status})`);
        }
        const json = await res.json();
        setResults(json.videos ?? []);
        setFromCache(json.fromCache ?? false);
        if ((json.videos ?? []).length === 0) setError("No videos found for this query.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
        setResults([]);
      }
    });
  }, [query, cefrLevel, lessonId]);

  async function handleSave(asset: VideoAsset) {
    if (savedIds.has(asset.id) || savingId) return;
    setSavingId(asset.id);
    try {
      // Asset already exists in DB (created during search); just mark as saved
      setSavedIds((prev) => new Set([...prev, asset.id]));
      onSaved?.(asset);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Search YouTube</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Present Perfect Tense, travel vocabulary…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="text-sm h-9"
          />
          <Button onClick={handleSearch} disabled={searching || !query.trim()} size="sm" className="h-9 px-4 shrink-0">
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* CEFR level selector */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-muted-foreground">Level filter</Label>
        <div className="flex gap-1.5 flex-wrap">
          {CEFR_OPTIONS.map((lvl) => (
            <Button
              key={lvl}
              variant="outline"
              size="sm"
              className={`h-7 px-3 text-xs ${cefrLevel === lvl ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"}`}
              onClick={() => setCefrLevel(lvl)}
            >
              {lvl}
            </Button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Cache badge */}
      {results.length > 0 && fromCache && (
        <p className="text-xs text-muted-foreground">
          Showing cached results — <button className="underline underline-offset-2" onClick={handleSearch}>refresh</button>
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {results.map((asset) => (
            <VideoCard
              key={asset.id}
              asset={asset}
              onPlay={() => setPlaying(asset)}
              onSave={() => handleSave(asset)}
              saving={savingId === asset.id}
              saved={savedIds.has(asset.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !searching && !error && (
        <div className="py-12 text-center rounded-xl border border-dashed bg-muted/30">
          <Youtube className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Search for YouTube videos above</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Results are cached to preserve your API quota</p>
        </div>
      )}

      {/* Embed modal */}
      {playing && <EmbedModal asset={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
