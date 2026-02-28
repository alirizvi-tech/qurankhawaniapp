import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function OrganizerLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/organizer/login", {
        email: loginEmail,
        password: loginPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      navigate("/organizer/dashboard");
    },
    onError: (err: Error) => {
      toast({
        title: "Login Failed",
        description: err.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/organizer/register", {
        email: regEmail,
        password: regPassword,
        confirmPassword: regConfirm,
      });
      return res.json();
    },
    onSuccess: () => {
      navigate("/organizer/dashboard");
    },
    onError: (err: Error) => {
      toast({
        title: "Registration Failed",
        description: err.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-arabic text-3xl text-[#d4af37] mb-3" data-testid="text-bismillah">
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>
          <h1 className="text-2xl font-bold text-[#f5edd8] tracking-wide" data-testid="text-title">
            Quran Khuwani Tracker
          </h1>
          <p className="text-[#b8a88a] mt-2 text-sm">
            Organize Quran recitation for your loved ones
          </p>
        </div>

        <Card className="border-[#1a2e1a]/60 bg-[#0d1a0d]/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#0a140a] mb-6">
                <TabsTrigger value="login" data-testid="tab-login" className="data-[state=active]:bg-[#1a2e1a] data-[state=active]:text-[#d4af37]">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register" className="data-[state=active]:bg-[#1a2e1a] data-[state=active]:text-[#d4af37]">
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    loginMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-[#f0e6d0]">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      data-testid="input-login-email"
                      className="bg-[#0a140a] border-[#1a2e1a] text-[#f5edd8] placeholder:text-[#666] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-[#f0e6d0]">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      data-testid="input-login-password"
                      className="bg-[#0a140a] border-[#1a2e1a] text-[#f5edd8] placeholder:text-[#666] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#2e7d32] text-white"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    registerMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-[#f0e6d0]">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="your@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      data-testid="input-register-email"
                      className="bg-[#0a140a] border-[#1a2e1a] text-[#f5edd8] placeholder:text-[#666] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-[#f0e6d0]">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      data-testid="input-register-password"
                      className="bg-[#0a140a] border-[#1a2e1a] text-[#f5edd8] placeholder:text-[#666] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm" className="text-[#f0e6d0]">Confirm Password</Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      required
                      data-testid="input-register-confirm"
                      className="bg-[#0a140a] border-[#1a2e1a] text-[#f5edd8] placeholder:text-[#666] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#2e7d32] text-white"
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-[#8a9a7a] text-xs mt-6">
          Coordinate Quran recitation with family and friends
        </p>
      </div>
    </div>
  );
}
