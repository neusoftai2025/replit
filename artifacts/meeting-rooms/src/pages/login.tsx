import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/components/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import loginImage from "@assets/image_1776129995881.png"; // Fallback or design reference if needed

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        toast({
          title: "ログイン成功",
          description: "ダッシュボードに移動します",
        });
        setLocation("/");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "ログイン失敗",
          description: "メールアドレスまたはパスワードが正しくありません。",
        });
      }
    }
  });

  // If already logged in, redirect
  if (user && !authLoading) {
    setLocation("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    loginMutation.mutate({
      data: { email, password }
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary border-l-0 border-r-0 border-b-0 rounded-lg">
        <CardHeader className="space-y-1 pb-8 pt-8">
          <CardTitle className="text-2xl font-medium text-center text-gray-800 tracking-tight">
            会議室予約システム
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-600 font-normal">
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="taro.yamada@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-600 font-normal">
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-md font-medium mt-2 bg-[#0066CC] hover:bg-[#0052A3]"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              ログイン
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
