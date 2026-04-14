import { useState } from "react";
import { Link } from "wouter";
import { useListRooms, getListRoomsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, MapPin, MonitorPlay, Wifi, Video } from "lucide-react";

export default function RoomsList() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: rooms, isLoading } = useListRooms(undefined, {
    query: { queryKey: getListRoomsQueryKey() }
  });

  const filteredRooms = rooms?.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEquipmentIcon = (eq: string) => {
    if (eq.includes("モニター") || eq.includes("ディスプレイ")) return <MonitorPlay className="w-3 h-3 mr-1" />;
    if (eq.includes("Wi-Fi") || eq.includes("Wifi")) return <Wifi className="w-3 h-3 mr-1" />;
    if (eq.includes("カメラ") || eq.includes("ビデオ")) return <Video className="w-3 h-3 mr-1" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">会議室一覧</h1>
          <p className="text-muted-foreground mt-2">施設内の会議室を検索・確認できます</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="会議室名で検索..." 
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRooms?.map((room) => (
            <Card key={room.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{room.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1.5">
                      <MapPin className="w-3.5 h-3.5 mr-1" /> {room.floor}階
                    </CardDescription>
                  </div>
                  <Badge variant={room.available ? "default" : "secondary"} className={room.available ? "bg-green-600 hover:bg-green-700" : ""}>
                    {room.available ? "利用可能" : "利用不可"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col">
                <div className="flex items-center text-sm mb-4">
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>定員: {room.capacity}名</span>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">設備:</p>
                  <div className="flex flex-wrap gap-2">
                    {room.equipment.map((eq, i) => (
                      <Badge key={i} variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        {getEquipmentIcon(eq)}
                        {eq}
                      </Badge>
                    ))}
                    {room.equipment.length === 0 && <span className="text-sm text-muted-foreground">なし</span>}
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/rooms/${room.id}`}>詳細・予約</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredRooms?.length === 0 && (
            <div className="col-span-full text-center py-12 border border-dashed rounded-lg text-muted-foreground bg-gray-50/50">
              該当する会議室が見つかりませんでした
            </div>
          )}
        </div>
      )}
    </div>
  );
}
