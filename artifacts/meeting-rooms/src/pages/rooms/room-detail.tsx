import { useParams, useLocation, Link } from "wouter";
import { 
  useGetRoom, 
  useListReservations, 
  useDeleteReservation,
  getGetRoomQueryKey, 
  getListReservationsQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Users, CalendarPlus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-context";

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const roomId = parseInt(id ?? "0", 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: room, isLoading: loadingRoom } = useGetRoom(roomId, {
    query: { enabled: !!roomId, queryKey: getGetRoomQueryKey(roomId) },
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: reservations, isLoading: loadingReservations } = useListReservations(
    { roomId },
    { query: { queryKey: getListReservationsQueryKey({ roomId }) } }
  );

  const deleteMutation = useDeleteReservation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey({ roomId }) });
        toast({ title: "予約を削除しました" });
      },
      onError: () => {
        toast({ variant: "destructive", title: "削除に失敗しました" });
      },
    },
  });

  if (loadingRoom) {
    return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
  }

  if (!room) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">会議室が見つかりませんでした</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/rooms")}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  const upcomingReservations = reservations?.filter(r => r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/rooms")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          会議室一覧
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{room.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {room.floor}階
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-4 h-4" /> 定員 {room.capacity}名
            </span>
            <Badge variant={room.available ? "default" : "secondary"} className={room.available ? "bg-green-600 hover:bg-green-700" : ""}>
              {room.available ? "利用可能" : "利用不可"}
            </Badge>
          </div>
        </div>

        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href={`/reservations/new?roomId=${room.id}`}>
            <CalendarPlus className="w-4 h-4 mr-2" />
            この部屋を予約
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">設備</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {room.equipment.length > 0
                ? room.equipment.map((eq, i) => (
                    <Badge key={i} variant="outline" className="bg-gray-50 text-gray-700">
                      {eq}
                    </Badge>
                  ))
                : <span className="text-sm text-muted-foreground">設備情報なし</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">今後の予約</CardTitle>
            <CardDescription>この会議室の今後の予約一覧</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReservations ? (
              <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
            ) : upcomingReservations.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
                予約はありません
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">{res.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(res.date), 'yyyy年MM月dd日 (E)', { locale: ja })} {res.startTime} - {res.endTime}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        予約者: {res.userName} / {res.attendees}名
                      </div>
                    </div>
                    {(user?.role === "admin" || user?.id === res.userId) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-red-50"
                        onClick={() => deleteMutation.mutate({ id: res.id })}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
