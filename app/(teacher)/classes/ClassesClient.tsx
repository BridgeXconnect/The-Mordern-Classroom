"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Plus, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CefrLevel } from "@prisma/client";

const CEFR_COLORS: Record<CefrLevel, string> = {
  L1: "bg-slate-100 text-slate-700",
  A1: "bg-green-100 text-green-700",
  A2: "bg-blue-100 text-blue-700",
  B1: "bg-yellow-100 text-yellow-700",
  B2: "bg-orange-100 text-orange-700",
};

type ClassWithUnits = {
  id: string;
  name: string;
  cefrLevel: CefrLevel;
  academicYear: string;
  description: string | null;
  createdAt: Date;
  units: { id: string; _count: { lessons: number } }[];
};

export function ClassesClient({ initialClasses }: { initialClasses: ClassWithUnits[] }) {
  const router = useRouter();
  const [classes, setClasses] = useState(initialClasses);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cefrLevel: "" as CefrLevel | "",
    academicYear: new Date().getFullYear().toString(),
    description: "",
  });

  const totalLessons = (cls: ClassWithUnits) =>
    cls.units.reduce((sum, u) => sum + u._count.lessons, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cefrLevel) return;
    setLoading(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const created = await res.json();
      setClasses((prev) => [{ ...created, units: [] }, ...prev]);
      setOpen(false);
      setForm({ name: "", cefrLevel: "", academicYear: new Date().getFullYear().toString(), description: "" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-muted-foreground text-sm mt-1">{classes.length} class{classes.length !== 1 ? "es" : ""}</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New Class
        </Button>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No classes yet</p>
            <p className="text-muted-foreground text-sm mt-1">Create your first class to get started.</p>
            <Button onClick={() => setOpen(true)} className="mt-4 gap-2" size="sm">
              <Plus className="h-4 w-4" /> New Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/classes/${cls.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-md px-2 py-1 text-xs font-semibold ${CEFR_COLORS[cls.cefrLevel]}`}>
                      {cls.cefrLevel}
                    </div>
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cls.academicYear} · {cls.units.length} unit{cls.units.length !== 1 ? "s" : ""} · {totalLessons(cls)} lesson{totalLessons(cls) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Class name</Label>
              <Input
                id="name"
                placeholder="e.g. English B — Group 3"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CEFR Level</Label>
                <Select
                  value={form.cefrLevel}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, cefrLevel: v as CefrLevel }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["L1", "A1", "A2", "B1", "B2"] as CefrLevel[]).map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year">Academic year</Label>
                <Input
                  id="year"
                  placeholder="2024–2025"
                  value={form.academicYear}
                  onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="desc"
                placeholder="Any notes about this class..."
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading || !form.cefrLevel}>
                {loading ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
