import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, RotateCcw, Trash2, Plus, LogOut, Check, BookOpen, PlusCircle } from "lucide-react";
import type { Khuwani, Claim } from "@shared/schema";

interface KhuwaniWithClaims extends Khuwani {
  claims: Claim[];
}

interface OrganizerSession {
  id: number;
  email: string;
}

export default function OrganizerDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [marhoomName, setMarhoomName] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const sessionQuery = useQuery<OrganizerSession | null>({
    queryKey: ["/api/organizer/session"],
  });

  const khuwaniesQuery = useQuery<KhuwaniWithClaims[]>({
    queryKey: ["/api/organizer/khuwanies"],
    enabled: !!sessionQuery.data,
    refetchInterval: 15000,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/organizer/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      navigate("/organizer/login");
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/organizer/khuwani/create", {
        marhoomName,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizer/khuwanies"] });
      setMarhoomName("");
      toast({ title: "Khuwani created successfully" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/organizer/khuwani/${id}/delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizer/khuwanies"] });
      toast({ title: "Khuwani deleted" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/organizer/khuwani/${id}/reset`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizer/khuwanies"] });
      toast({ title: "All claims reset" });
    },
  });

  const addQuranMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/organizer/khuwani/${id}/add-quran`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizer/khuwanies"] });
      toast({ title: "Quran added" });
    },
  });

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (!sessionQuery.data) {
    navigate("/organizer/login");
    return null;
  }

  const copyLink = (slug: string, id: number) => {
    const url = `${window.location.origin}/k/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const khuwanies = khuwaniesQuery.data || [];

  return (
    <div className="min-h-screen animate-fade-in">
      <header className="border-b border-[#1a2e1a] px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#d4af37]" />
            <h1 className="text-lg font-bold text-[#f0e6d0]" data-testid="text-dashboard-title">
              Quran Khuwani Tracker
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#b8a88a] hidden sm:block" data-testid="text-organizer-email">
              {sessionQuery.data.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
              className="text-[#d4af37]"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
        <Card className="border-[#1a2e1a]/60 bg-[#0d1a0d]/80">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-[#d4af37] mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Khuwani
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="flex-1 space-y-1">
                <Label className="text-[#f0e6d0] text-sm">Marhoom / Marhooma's Name</Label>
                <Input
                  placeholder="e.g. Haji Abdul Rehman"
                  value={marhoomName}
                  onChange={(e) => setMarhoomName(e.target.value)}
                  required
                  data-testid="input-marhoom-name"
                  className="bg-[#0a140a] border-[#1a2e1a] text-[#f0e6d0] placeholder:text-[#666] focus:border-[#d4af37]"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !marhoomName.trim()}
                  data-testid="button-create-khuwani"
                  className="bg-[#2e7d32] text-white w-full sm:w-auto"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Khuwani
                </Button>
              </div>
            </form>
            <p className="text-[#8a9a7a] text-xs mt-2">Starts with 1 Quran. You can add more anytime.</p>
          </CardContent>
        </Card>

        {khuwaniesQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
          </div>
        ) : khuwanies.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-[#1a2e1a] mx-auto mb-4" />
            <p className="text-[#f0e6d0] text-lg mb-1">No Khuwanies yet</p>
            <p className="text-[#8a9a7a] text-sm">Create one above to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#d4af37]" data-testid="text-your-khuwanies">
              Your Khuwanies ({khuwanies.length})
            </h2>
            {khuwanies.map((k) => {
              const totalSiparas = k.numQurans * 30;
              const claimedCount = k.claims.length;
              const progress = totalSiparas > 0 ? (claimedCount / totalSiparas) * 100 : 0;

              const perQuranClaims: Record<number, number> = {};
              for (let i = 1; i <= k.numQurans; i++) perQuranClaims[i] = 0;
              k.claims.forEach((c) => {
                perQuranClaims[c.quranNumber] = (perQuranClaims[c.quranNumber] || 0) + 1;
              });

              return (
                <Card
                  key={k.id}
                  className="border-[#1a2e1a]/60 bg-[#0d1a0d]/80"
                  data-testid={`card-khuwani-${k.id}`}
                >
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#f0e6d0]" data-testid={`text-marhoom-${k.id}`}>
                          {k.marhoomName}
                        </h3>
                        <p className="text-sm text-[#8a9a7a]">
                          Created {new Date(k.createdAt!).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          {" · "}{k.numQurans} Quran{k.numQurans > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addQuranMutation.mutate(k.id)}
                          disabled={addQuranMutation.isPending}
                          data-testid={`button-add-quran-${k.id}`}
                          className="bg-[#1a2e1a] text-[#d4af37] border-[#2a3e2a]"
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                          Add Quran
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyLink(k.slug, k.id)}
                          data-testid={`button-copy-link-${k.id}`}
                          className="bg-[#1a2e1a] text-[#f0e6d0] border-[#2a3e2a]"
                        >
                          {copiedId === k.id ? (
                            <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          {copiedId === k.id ? "Copied!" : "Copy Link"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (confirm("Reset all claims for this Khuwani? Participants will need to re-claim their Siparas.")) {
                              resetMutation.mutate(k.id);
                            }
                          }}
                          disabled={resetMutation.isPending}
                          data-testid={`button-reset-${k.id}`}
                          className="bg-[#1a2e1a] text-[#f0e6d0] border-[#2a3e2a]"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Delete this Khuwani and all its claims? This cannot be undone.")) {
                              deleteMutation.mutate(k.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${k.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-[#f0e6d0]" data-testid={`text-progress-${k.id}`}>
                          {claimedCount} / {totalSiparas} Siparas claimed
                        </span>
                        <span className="text-sm text-[#d4af37]">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#0a140a] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            background: `linear-gradient(90deg, #2e7d32, #d4af37)`,
                          }}
                        />
                      </div>
                    </div>

                    {k.numQurans > 1 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Array.from({ length: k.numQurans }, (_, i) => i + 1).map((qNum) => (
                          <span
                            key={qNum}
                            className="text-xs px-2.5 py-1 rounded-md bg-[#0a140a] text-[#b8a88a]"
                            data-testid={`text-quran-progress-${k.id}-${qNum}`}
                          >
                            Quran {qNum}: {perQuranClaims[qNum] || 0}/30
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-[#8a9a7a] font-mono truncate" data-testid={`text-link-${k.id}`}>
                      {window.location.origin}/k/{k.slug}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
