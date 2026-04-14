import { useState } from "react";
import { Link } from "wouter";
import {
  useListReservations,
  useDeleteReservation,
  getListReservationsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetTodayReservationsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-context";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarPlus, Trash2, MapPin, Clock, Users } from "lucide-react";

export default function ReservationsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  const { data: reservations, isLoading } = useListReservations(
    user?.role === "admin" ? {} : { userId: user?.id },
    { query: { queryKey: getListReservationsQueryKey({ userId: user?.id }) } }
  );

  const deleteMutation = useDeleteReservation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodayReservationsQueryKey() });
        toast({ title: "予約を削除しました" });
      },
      onError: () => {
        toast({ variant: "destructive", title: "削除に失敗しました" });
      },
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const currentTime = new Date().toTimeString().slice(0, 5);

  const filtered = (reservations ?? []).filter((r) => {
    if (filter === "upcoming") return r.date > today || (r.date === today && r.endTime > currentTime);
    if (filter === "past") return r.date < today || (r.date === today && r.endTime <= currentTime);
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {user?.role === "admin" ? "全予約一覧" : "自分の予約"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {user?.role === "admin" ? "全員の予約を管理できます" : "自分の予約一覧"}
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/reservations/new">
            <CalendarPlus className="w-4 h-4 mr-2" />
            新規予約
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        {(["upcoming", "past", "all"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-primary" : ""}
          >
            {f === "upcoming" ? "今後の予約" : f === "past" ? "過去の予約" : "すべて"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">予約が見つかりませんでした</p>
            <Button asChild variant="outline">
              <Link href="/reservations/new">今すぐ予約する</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((res) => {
            const isPast = res.date < today || (res.date === today && res.endTime <= currentTime);
            return (
              <Card key={res.id} className={`hover:shadow-sm transition-shadow ${isPast ? "opacity-70" : ""}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 text-lg">{res.title}</h3>
                        {isPast ? (
                          <Badge variant="secondary">終了</Badge>
                        ) : (
                          <Badge className="bg-green-600 hover:bg-green-700">予定</Badge>
                        )}
                      </div>

                      {res.description && (
                        <p className="text-sm text-muted-foreground">{res.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {res.roomName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(res.date), 'yyyy年MM月dd日 (E)', { locale: ja })} {res.startTime} - {res.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {res.attendees}名
                        </span>
                        {user?.role === "admin" && (
                          <span className="text-primary font-medium">予約者: {res.userName}</span>
                        )}
                      </div>
                    </div>

                    {!isPast && (user?.role === "admin" || user?.id === res.userId) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-red-50 shrink-0"
                        onClick={() => deleteMutation.mutate({ id: res.id })}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        キャンセル
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
