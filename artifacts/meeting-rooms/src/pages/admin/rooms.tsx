import { useState } from "react";
import {
  useListRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
  getListRoomsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, MapPin, Users } from "lucide-react";

interface RoomFormData {
  name: string;
  floor: string;
  capacity: string;
  equipment: string;
  available: boolean;
}

const defaultForm: RoomFormData = {
  name: "",
  floor: "1",
  capacity: "10",
  equipment: "",
  available: true,
};

export default function AdminRooms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RoomFormData>(defaultForm);

  const { data: rooms, isLoading } = useListRooms(undefined, {
    query: { queryKey: getListRoomsQueryKey() },
  });

  const createMutation = useCreateRoom({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
        toast({ title: "会議室を登録しました" });
        setIsDialogOpen(false);
        setForm(defaultForm);
      },
      onError: () => toast({ variant: "destructive", title: "登録に失敗しました" }),
    },
  });

  const updateMutation = useUpdateRoom({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
        toast({ title: "会議室情報を更新しました" });
        setIsDialogOpen(false);
        setEditingId(null);
        setForm(defaultForm);
      },
      onError: () => toast({ variant: "destructive", title: "更新に失敗しました" }),
    },
  });

  const deleteMutation = useDeleteRoom({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
        toast({ title: "会議室を削除しました" });
      },
      onError: () => toast({ variant: "destructive", title: "削除に失敗しました" }),
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setIsDialogOpen(true);
  };

  const openEdit = (room: any) => {
    setEditingId(room.id);
    setForm({
      name: room.name,
      floor: String(room.floor),
      capacity: String(room.capacity),
      equipment: room.equipment.join("、"),
      available: room.available,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      floor: parseInt(form.floor, 10),
      capacity: parseInt(form.capacity, 10),
      equipment: form.equipment ? form.equipment.split(/[,、,]/).map(s => s.trim()).filter(Boolean) : [],
      available: form.available,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">会議室管理</h1>
          <p className="text-muted-foreground mt-2">会議室の追加・編集・削除ができます</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              会議室を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "会議室を編集" : "会議室を追加"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>会議室名 <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例：会議室A" required className="bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>フロア（階）</Label>
                  <Input type="number" min="1" max="50" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>定員（名）</Label>
                  <Input type="number" min="1" max="200" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="bg-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>設備（カンマ区切り）</Label>
                <Input value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} placeholder="プロジェクター、ホワイトボード、TV会議システム" className="bg-white" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.available} onCheckedChange={v => setForm(f => ({ ...f, available: v }))} />
                <Label>利用可能</Label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? "更新する" : "登録する"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rooms?.map((room) => (
            <Card key={room.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{room.floor}階</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{room.capacity}名</span>
                    </div>
                  </div>
                  <Badge variant={room.available ? "default" : "secondary"} className={room.available ? "bg-green-600 hover:bg-green-700" : ""}>
                    {room.available ? "利用可" : "利用不可"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="flex flex-wrap gap-1 mb-4">
                  {room.equipment.map((eq, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-gray-50 text-gray-600">{eq}</Badge>
                  ))}
                  {room.equipment.length === 0 && <span className="text-xs text-muted-foreground">設備なし</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(room)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    編集
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-red-50"
                    onClick={() => deleteMutation.mutate({ id: room.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
