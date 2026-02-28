import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Moon, Sun, X } from "lucide-react";
import { SIPARA_NAMES_ARABIC, ARABIC_NUMERALS } from "@shared/schema";
import type { Claim } from "@shared/schema";

interface KhuwaniData {
  id: number;
  marhoomName: string;
  numQurans: number;
  slug: string;
  claims: Claim[];
}

const THEME_KEY = "khuwaani_theme";

export default function ParticipantView() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();
  const [activeQuran, setActiveQuran] = useState(1);
  const [claimDialog, setClaimDialog] = useState<{ quranNumber: number; siparaNumber: number } | null>(null);
  const [nameInput, setNameInput] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light-mode", theme === "light");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (claimDialog && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [claimDialog]);

  const khuwaniQuery = useQuery<KhuwaniData>({
    queryKey: ["/api/k", slug],
    refetchInterval: 8000,
    enabled: !!slug,
  });

  const claimMutation = useMutation({
    mutationFn: async (data: { quranNumber: number; siparaNumber: number; participantName: string }) => {
      const res = await apiRequest("POST", `/api/k/${slug}/claim`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/k", slug] });
      setClaimDialog(null);
      setNameInput("");
    },
    onError: (err: Error) => {
      toast({
        title: "Could not claim",
        description: err.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/k", slug] });
    },
  });

  const unclaimMutation = useMutation({
    mutationFn: async (data: { quranNumber: number; siparaNumber: number; participantName: string }) => {
      const res = await apiRequest("POST", `/api/k/${slug}/unclaim`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/k", slug] });
    },
    onError: (err: Error) => {
      toast({
        title: "Could not release",
        description: err.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  if (khuwaniQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (khuwaniQuery.isError || !khuwaniQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <p className="font-arabic text-2xl text-[#d4af37] mb-4">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
          <p className="text-foreground text-lg mb-2">Khuwani not found</p>
          <p className="text-muted-foreground text-sm">This link may be invalid or the Khuwani has been removed.</p>
        </div>
      </div>
    );
  }

  const data = khuwaniQuery.data;
  const isDark = theme === "dark";

  const currentClaims = data.claims.filter((c) => c.quranNumber === activeQuran);
  const claimedInQuran = currentClaims.length;
  const allComplete = claimedInQuran === 30;

  const getClaimForSipara = (siparaNum: number) =>
    currentClaims.find((c) => c.siparaNumber === siparaNum);

  const handleCardClick = (siparaNum: number) => {
    const existing = getClaimForSipara(siparaNum);
    if (!existing) {
      setClaimDialog({ quranNumber: activeQuran, siparaNumber: siparaNum });
      setNameInput("");
    } else {
      if (confirm(`Release Para ${siparaNum} claimed by "${existing.participantName}"?`)) {
        unclaimMutation.mutate({
          quranNumber: activeQuran,
          siparaNumber: siparaNum,
          participantName: existing.participantName,
        });
      }
    }
  };

  const handleClaimSubmit = () => {
    if (!claimDialog || !nameInput.trim()) return;
    claimMutation.mutate({
      ...claimDialog,
      participantName: nameInput.trim(),
    });
  };

  const colors = isDark
    ? {
        headerBg: "bg-[#070c07]/95",
        headerBorder: "border-[#1a2e1a]",
        gold: "text-[#d4af37]",
        text: "text-[#f0e6d0]",
        muted: "text-[#8a9a7a]",
        progressTrack: "bg-[#0a140a]",
        availableBg: "bg-[#1a2e1a]",
        availableBorder: "border-[#2a3e2a]",
        availableHover: "hover:bg-[#223d22] hover:border-[#3a5e3a]",
        availableLabel: "text-[#a0d0a0]",
        claimedBg: "bg-[#3d2e0a]",
        claimedBorder: "border-[#5a3e00]",
        claimedLabel: "text-[#d4af37]",
        tabActive: "bg-[#2e7d32] text-white",
        tabInactive: "bg-[#1a2e1a] text-[#f0e6d0]",
        completeBg: "bg-[#1a2e1a] border-[#2e7d32]/30",
        dialogBg: "bg-[#0d1a0d]",
        dialogBorder: "border-[#1a2e1a]",
        inputBg: "bg-[#0a140a] border-[#2a3e2a] text-[#f5edd8] placeholder:text-[#555]",
        themeBtnBg: "bg-[#1a2e1a] text-[#d4af37]",
        legendAvailBg: "bg-[#1a2e1a] border-[#2a3e2a]",
        legendClaimedBg: "bg-[#3d2e0a] border-[#5a3e00]",
        paraNumColor: "text-[#f0e6d0]",
        goldAlpha: "text-[#d4af37]/80",
      }
    : {
        headerBg: "bg-white/95",
        headerBorder: "border-[#e0d5c0]",
        gold: "text-[#8b6914]",
        text: "text-[#2d2416]",
        muted: "text-[#8a7a5a]",
        progressTrack: "bg-[#f0e8d8]",
        availableBg: "bg-[#f8f4ec]",
        availableBorder: "border-[#e0d5c0]",
        availableHover: "hover:bg-[#f0ead8] hover:border-[#c8b88a]",
        availableLabel: "text-[#2e7d32]",
        claimedBg: "bg-[#fff8e8]",
        claimedBorder: "border-[#e0c870]",
        claimedLabel: "text-[#8b6914]",
        tabActive: "bg-[#2e7d32] text-white",
        tabInactive: "bg-[#f0e8d8] text-[#2d2416]",
        completeBg: "bg-[#e8f5e9] border-[#2e7d32]/30",
        dialogBg: "bg-white",
        dialogBorder: "border-[#e0d5c0]",
        inputBg: "bg-[#faf8f2] border-[#d0c4a8] text-[#2d2416] placeholder:text-[#aaa]",
        themeBtnBg: "bg-[#f0e8d8] text-[#8b6914]",
        legendAvailBg: "bg-[#f8f4ec] border-[#e0d5c0]",
        legendClaimedBg: "bg-[#fff8e8] border-[#e0c870]",
        paraNumColor: "text-[#2d2416]",
        goldAlpha: "text-[#8b6914]/70",
      };

  return (
    <div className={`min-h-screen animate-fade-in pb-24 ${isDark ? "bg-[#070c07]" : "bg-[#fefcf6]"}`}>
      <header className={`border-b ${colors.headerBorder} px-3 py-3 sticky top-0 z-50 ${colors.headerBg} backdrop-blur-sm`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`font-arabic text-sm ${colors.gold} hidden sm:inline`}>بسم الله</span>
            <span className={`${colors.text} font-semibold truncate`} data-testid="text-marhoom-header">
              {data.marhoomName}
            </span>
          </div>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${colors.themeBtnBg} text-sm shrink-0 cursor-pointer border-0 transition-colors`}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 py-4">
        <div className="text-center mb-4">
          <p className={`font-arabic text-xl ${colors.gold} leading-loose`}>
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>
          <p className={`text-sm ${colors.muted} mt-1`}>Quran Khuwani for</p>
          <h1 className={`text-xl font-bold ${colors.text}`} data-testid="text-marhoom-title">
            {data.marhoomName}
          </h1>
        </div>

        {data.numQurans > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
            {Array.from({ length: data.numQurans }, (_, i) => i + 1).map((qNum) => {
              const qClaimed = data.claims.filter((c) => c.quranNumber === qNum).length;
              return (
                <button
                  key={qNum}
                  onClick={() => setActiveQuran(qNum)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-0 ${
                    activeQuran === qNum ? colors.tabActive : colors.tabInactive
                  }`}
                  data-testid={`tab-quran-${qNum}`}
                >
                  Quran {qNum} ({qClaimed}/30)
                </button>
              );
            })}
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-sm ${colors.text}`} data-testid="text-quran-progress">
              {data.numQurans > 1 ? `Quran ${activeQuran}: ` : ""}{claimedInQuran}/30 Siparas claimed
            </span>
            <span className={`text-sm ${colors.gold}`}>{Math.round((claimedInQuran / 30) * 100)}%</span>
          </div>
          <div className={`w-full h-2.5 rounded-full ${colors.progressTrack} overflow-hidden`}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(claimedInQuran / 30) * 100}%`,
                background: "linear-gradient(90deg, #2e7d32, #d4af37)",
              }}
            />
          </div>
        </div>

        {allComplete && (
          <div
            className={`text-center py-4 px-3 mb-4 rounded-md border ${colors.completeBg}`}
            data-testid="text-completion-banner"
          >
            <Moon className={`w-5 h-5 inline-block ${colors.gold} mr-2`} />
            <span className={`${colors.gold} font-semibold`}>
              Alhamdulillah! {data.numQurans > 1 ? `Quran ${activeQuran}` : "Quran"} Complete!
            </span>
            <Moon className={`w-5 h-5 inline-block ${colors.gold} ml-2`} />
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((siparaNum) => {
            const claim = getClaimForSipara(siparaNum);
            const isAvailable = !claim;
            const isBusy = claimMutation.isPending || unclaimMutation.isPending;

            let cardBg: string;
            let cardBorder: string;
            let hoverClass = "";

            if (isAvailable) {
              cardBg = colors.availableBg;
              cardBorder = colors.availableBorder;
              hoverClass = `${colors.availableHover} transition-colors`;
            } else {
              cardBg = claim ? colors.claimedBg : "";
              cardBorder = claim ? colors.claimedBorder : "";
            }

            return (
              <button
                key={siparaNum}
                onClick={() => !isBusy && handleCardClick(siparaNum)}
                disabled={isBusy}
                className={`relative rounded-md border p-2 sm:p-3 text-center ${cardBg} ${cardBorder} cursor-pointer ${hoverClass} disabled:opacity-75 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px]`}
                data-testid={`card-sipara-${siparaNum}`}
              >
                <span className={`font-arabic text-xl sm:text-2xl ${colors.gold} leading-none mb-1`}>
                  {ARABIC_NUMERALS[siparaNum - 1]}
                </span>
                <span className={`text-[11px] sm:text-xs ${colors.paraNumColor} font-semibold mb-0.5`}>
                  Para {siparaNum}
                </span>
                <span className={`font-arabic text-[11px] sm:text-sm ${colors.goldAlpha} leading-tight line-clamp-1 px-0.5`} dir="rtl">
                  {SIPARA_NAMES_ARABIC[siparaNum - 1]}
                </span>
                <div className="mt-1.5">
                  {isAvailable && (
                    <span className={`text-[10px] sm:text-[11px] ${colors.availableLabel}`}>Tap to claim</span>
                  )}
                  {claim && (
                    <span className={`text-[10px] sm:text-[11px] ${colors.claimedLabel} truncate max-w-full block px-1 font-medium`}>
                      {claim.participantName}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className={`mt-6 flex items-center justify-center gap-4 flex-wrap text-[11px] sm:text-xs ${colors.muted}`}>
          <span className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${colors.legendAvailBg} border inline-block`} />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${colors.legendClaimedBg} border inline-block`} />
            Claimed
          </span>
        </div>

        <p className={`text-center text-[11px] sm:text-xs ${colors.muted} mt-3`} data-testid="text-footer-note">
          Tap to claim · Tap a claimed Sipara to release it
        </p>
      </main>

      {claimDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setClaimDialog(null)} />
          <div
            className={`relative w-full max-w-sm rounded-lg border ${colors.dialogBorder} ${colors.dialogBg} p-6 shadow-xl animate-fade-in`}
            data-testid="dialog-claim"
          >
            <button
              onClick={() => setClaimDialog(null)}
              className={`absolute top-3 right-3 ${colors.muted} cursor-pointer border-0 bg-transparent p-1`}
              data-testid="button-close-dialog"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className={`${colors.gold} font-semibold text-lg mb-1`}>
              Claim Para {claimDialog.siparaNumber}
            </h3>
            <p className={`font-arabic text-sm ${colors.goldAlpha} mb-4`} dir="rtl">
              {SIPARA_NAMES_ARABIC[claimDialog.siparaNumber - 1]}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleClaimSubmit();
              }}
            >
              <label className={`text-sm ${colors.text} mb-1.5 block`}>
                Enter name for this Sipara
              </label>
              <Input
                ref={nameInputRef}
                placeholder="e.g. Ahmed, Fatima, etc."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                data-testid="input-claim-name"
                className={`${colors.inputBg} focus:border-[#d4af37] text-base py-5 mb-3`}
              />
              <Button
                type="submit"
                className="w-full bg-[#2e7d32] text-white py-5"
                disabled={!nameInput.trim() || claimMutation.isPending}
                data-testid="button-confirm-claim"
              >
                {claimMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Claim Sipara
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
