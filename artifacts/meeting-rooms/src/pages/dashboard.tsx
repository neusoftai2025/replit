import { 
  useGetDashboardSummary, 
  useGetTodayReservations, 
  useGetRoomUsage,
  getGetDashboardSummaryQueryKey,
  getGetTodayReservationsQueryKey,
  getGetRoomUsageQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/components/auth-context";
import { Building2, CalendarCheck, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  
  const { data: todayReservations, isLoading: loadingToday } = useGetTodayReservations({
    query: { queryKey: getGetTodayReservationsQueryKey() }
  });

  const { data: roomUsage, isLoading: loadingUsage } = useGetRoomUsage({
    query: { queryKey: getGetRoomUsageQueryKey() }
  });

  const today = format(new Date(), 'yyyy年MM月dd日 (E)', { locale: ja });

  if (loadingSummary || loadingToday || loadingUsage) {
    return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">ダッシュボード</h1>
        <p className="text-muted-foreground mt-2">
          ようこそ、{user?.name}さん。本日は {today} です。
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総会議室数</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalRooms || 0}</div>
            <p className="text-xs text-muted-foreground">登録されている会議室</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の予約件数</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalReservationsToday || 0}</div>
            <p className="text-xs text-muted-foreground">今日予定されている会議</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">現在空いている会議室</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.availableRoomsNow || 0}</div>
            <p className="text-xs text-muted-foreground">すぐに利用可能</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今後のあなたの予約</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{summary?.upcomingReservations || 0}</div>
            <p className="text-xs text-muted-foreground">予定されている会議</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Today's schedule */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>本日の予約一覧</CardTitle>
              <CardDescription>今日予定されているすべての会議</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/reservations/new">新規予約</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todayReservations && todayReservations.length > 0 ? (
              <div className="space-y-4">
                {todayReservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-gray-900">{res.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {res.startTime} - {res.endTime} • {res.roomName} • {res.userName}
                      </span>
                    </div>
                    <div className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                      {res.attendees}名
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                本日の予約はありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room usage stats */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>会議室利用状況</CardTitle>
            <CardDescription>今週の稼働率</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {roomUsage?.map((usage) => (
                <div key={usage.roomId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{usage.roomName}</span>
                    <span className="text-muted-foreground">{usage.utilizationPercent}%</span>
                  </div>
                  <Progress value={usage.utilizationPercent} className="h-2" />
                </div>
              ))}
              {(!roomUsage || roomUsage.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  データがありません
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
