import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  useListRooms,
  useCreateReservation,
  getListReservationsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetTodayReservationsQueryKey,
  getListRoomsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewReservation() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultRoomId = params.get("roomId") ?? "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);

  const [roomId, setRoomId] = useState(defaultRoomId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [attendees, setAttendees] = useState("4");

  const { data: rooms, isLoading: loadingRooms } = useListRooms(undefined, {
    query: { queryKey: getListRoomsQueryKey() },
  });

  const createMutation = useCreateReservation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodayReservationsQueryKey() });
        toast({ title: "予約が完了しました", description: `${title}の予約を作成しました` });
        setLocation("/reservations");
      },
      onError: (error: any) => {
        const msg = error?.data?.error ?? "予約の作成に失敗しました";
        toast({ variant: "destructive", title: "エラー", description: msg });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !title || !date || !startTime || !endTime) return;
    if (startTime >= endTime) {
      toast({ variant: "destructive", title: "エラー", description: "終了時刻は開始時刻より後に設定してください" });
      return;
    }

    createMutation.mutate({
      data: {
        roomId: parseInt(roomId, 10),
        title,
        description: description || undefined,
        date,
        startTime,
        endTime,
        attendees: parseInt(attendees, 10),
      },
    });
  };

  const timeOptions = [];
  for (let h = 8; h <= 21; h++) {
    for (const m of ["00", "30"]) {
      timeOptions.push(`${String(h).padStart(2, "0")}:${m}`);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/reservations")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          予約一覧
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">新規予約</h1>
        <p className="text-muted-foreground mt-2">会議室の予約を作成します</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">予約情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="room">会議室 <span className="text-destructive">*</span></Label>
              {loadingRooms ? (
                <div className="text-muted-foreground text-sm">読み込み中...</div>
              ) : (
                <Select value={roomId} onValueChange={setRoomId} required>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="会議室を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms?.filter(r => r.available).map((room) => (
                      <SelectItem key={room.id} value={String(room.id)}>
                        {room.name} — {room.floor}階 / 定員{room.capacity}名
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">会議タイトル <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：営業会議、チームミーティング"
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">詳細（任意）</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="会議の目的や議題など"
                rows={3}
                className="bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">日付 <span className="text-destructive">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>開始時刻 <span className="text-destructive">*</span></Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>終了時刻 <span className="text-destructive">*</span></Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendees">参加人数 <span className="text-destructive">*</span></Label>
              <Input
                id="attendees"
                type="number"
                min="1"
                max="100"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                required
                className="bg-white w-32"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || !roomId || !title}
                className="bg-primary hover:bg-primary/90"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                予約を確定する
              </Button>
              <Button type="button" variant="outline" onClick={() => setLocation("/reservations")}>
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
