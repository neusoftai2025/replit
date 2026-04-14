import { useState, useEffect, useRef, useMemo } from "react";
import {
  useListRooms,
  useListReservations,
  useCreateReservation,
  getListReservationsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetTodayReservationsQueryKey,
  getListRoomsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

// ─── Constants ───────────────────────────────────────────────────────────────
const SLOT_H = 30;        // px per 30-min slot
const TOTAL_SLOTS = 48;   // 00:00–23:30
const TIME_W = 56;        // px, left time-label column
const HEADER_H = 56;      // px, sticky room header row
const ROOM_W = 160;       // px min, each room column

// ─── Helpers ─────────────────────────────────────────────────────────────────
function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2);
  const m = slot % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
}

function timeToSlot(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 2 + (m >= 30 ? 1 : 0);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface DragState {
  roomId: number;
  startSlot: number;
  endSlot: number;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CalendarView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);

  const [date, setDate] = useState(todayStr());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selection, setSelection] = useState<DragState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // form
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAttendees, setFormAttendees] = useState("4");
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("10:00");

  // ── Scroll to 7:00 on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * 2 * SLOT_H - 16;
    }
  }, []);

  // ── Data ────────────────────────────────────────────────────────────────
  const { data: rooms = [] } = useListRooms(undefined, {
    query: { queryKey: getListRoomsQueryKey() },
  });
  const availableRooms = rooms.filter((r) => r.available);

  const { data: reservations = [], refetch } = useListReservations(
    { date },
    { query: { queryKey: getListReservationsQueryKey({ date }) } }
  );

  const resByRoom = useMemo(() => {
    const map: Record<number, typeof reservations> = {};
    for (const r of reservations) {
      (map[r.roomId] ??= []).push(r);
    }
    return map;
  }, [reservations]);

  // ── Mutation ────────────────────────────────────────────────────────────
  const createMutation = useCreateReservation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey({ date }) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodayReservationsQueryKey() });
        refetch();
        toast({ title: "予約が完了しました" });
        setDialogOpen(false);
        resetForm();
      },
      onError: (err: any) => {
        const msg = err?.data?.error ?? "予約の作成に失敗しました";
        toast({ variant: "destructive", title: "エラー", description: msg });
      },
    },
  });

  function resetForm() {
    setFormTitle("");
    setFormDesc("");
    setFormAttendees("4");
    setSelection(null);
  }

  // ── Drag handlers ────────────────────────────────────────────────────────
  function onCellDown(e: React.MouseEvent, roomId: number, slot: number) {
    e.preventDefault();
    isDraggingRef.current = true;
    const s: DragState = { roomId, startSlot: slot, endSlot: slot };
    dragRef.current = s;
    setDragState({ ...s });
  }

  function onCellEnter(roomId: number, slot: number) {
    if (!isDraggingRef.current || !dragRef.current) return;
    if (dragRef.current.roomId !== roomId) return;
    const s: DragState = { ...dragRef.current, endSlot: slot };
    dragRef.current = s;
    setDragState({ ...s });
  }

  // Global mouseup — open dialog
  useEffect(() => {
    const up = () => {
      if (isDraggingRef.current && dragRef.current) {
        const d = dragRef.current;
        const minS = Math.min(d.startSlot, d.endSlot);
        const maxS = Math.max(d.startSlot, d.endSlot);
        const sel: DragState = { roomId: d.roomId, startSlot: minS, endSlot: maxS };
        setSelection(sel);
        setFormStart(slotToTime(minS));
        setFormEnd(slotToTime(Math.min(maxS + 1, TOTAL_SLOTS - 1)));
        setDialogOpen(true);
      }
      isDraggingRef.current = false;
      dragRef.current = null;
      setDragState(null);
    };
    document.addEventListener("mouseup", up);
    return () => document.removeEventListener("mouseup", up);
  }, []);

  // ── Dialog submit ────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selection || !formTitle) return;
    if (formStart >= formEnd) {
      toast({ variant: "destructive", title: "エラー", description: "終了時刻は開始時刻より後に設定してください" });
      return;
    }
    createMutation.mutate({
      data: {
        roomId: selection.roomId,
        title: formTitle,
        description: formDesc || undefined,
        date,
        startTime: formStart,
        endTime: formEnd,
        attendees: parseInt(formAttendees, 10),
      },
    });
  }

  // ── Date helpers ─────────────────────────────────────────────────────────
  const parsedDate = parseISO(date);
  const dateLabel = format(parsedDate, "yyyy年M月d日（E）", { locale: ja });
  const selectedRoom = availableRooms.find((r) => r.id === selection?.roomId);

  const timeOptions: string[] = [];
  for (let h = 0; h < 24; h++)
    for (const m of ["00", "30"])
      timeOptions.push(`${String(h).padStart(2, "0")}:${m}`);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] select-none">
      {/* Date nav */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm">
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => setDate(subDays(parsedDate, 1).toISOString().slice(0, 10))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-gray-800 min-w-[190px] text-center">
            {dateLabel}
          </span>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => setDate(addDays(parsedDate, 1).toISOString().slice(0, 10))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setDate(todayStr())}>
          今日
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-hidden border rounded-lg bg-white shadow-sm">
        <div className="h-full overflow-auto" ref={scrollRef}>
          {/* Total width wrapper */}
          <div style={{ minWidth: TIME_W + availableRooms.length * ROOM_W, position: "relative" }}>

            {/* ── Sticky header ─────────────────────────────────────────── */}
            <div
              className="sticky top-0 z-30 flex border-b bg-white"
              style={{ height: HEADER_H }}
            >
              {/* Corner */}
              <div
                className="sticky left-0 z-40 bg-white border-r flex-shrink-0"
                style={{ width: TIME_W }}
              />
              {/* Room headers */}
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex-shrink-0 border-r px-3 flex flex-col justify-center"
                  style={{ width: ROOM_W }}
                >
                  <div className="font-semibold text-sm text-gray-900 truncate">{room.name}</div>
                  <div className="text-xs text-muted-foreground">定員{room.capacity}名</div>
                </div>
              ))}
            </div>

            {/* ── Body ──────────────────────────────────────────────────── */}
            <div className="flex" style={{ height: TOTAL_SLOTS * SLOT_H }}>

              {/* Sticky time column */}
              <div
                className="sticky left-0 z-20 flex-shrink-0 bg-white border-r"
                style={{ width: TIME_W }}
              >
                {Array.from({ length: TOTAL_SLOTS }, (_, slot) => (
                  <div
                    key={slot}
                    className="border-b flex items-start justify-end pr-2 pt-0.5"
                    style={{ height: SLOT_H }}
                  >
                    {slot % 2 === 0 && (
                      <span className="text-[11px] text-gray-400 font-medium leading-none">
                        {slotToTime(slot)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Room columns */}
              {availableRooms.map((room) => {
                const roomRes = resByRoom[room.id] ?? [];
                return (
                  <div
                    key={room.id}
                    className="flex-shrink-0 relative border-r"
                    style={{ width: ROOM_W, height: TOTAL_SLOTS * SLOT_H }}
                  >
                    {/* Drag-target cells */}
                    {Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
                      const selected =
                        dragState !== null &&
                        dragState.roomId === room.id &&
                        slot >= Math.min(dragState.startSlot, dragState.endSlot) &&
                        slot <= Math.max(dragState.startSlot, dragState.endSlot);

                      return (
                        <div
                          key={slot}
                          className={[
                            "absolute w-full border-b cursor-pointer transition-colors",
                            selected
                              ? "bg-sky-200"
                              : slot % 2 === 0
                              ? "bg-white hover:bg-blue-50/40"
                              : "bg-gray-50/60 hover:bg-blue-50/40",
                          ].join(" ")}
                          style={{ top: slot * SLOT_H, height: SLOT_H }}
                          onMouseDown={(e) => onCellDown(e, room.id, slot)}
                          onMouseEnter={() => onCellEnter(room.id, slot)}
                        />
                      );
                    })}

                    {/* Reservation blocks */}
                    {roomRes.map((res) => {
                      const s = timeToSlot(res.startTime);
                      const e = timeToSlot(res.endTime);
                      const top = s * SLOT_H;
                      const height = Math.max((e - s) * SLOT_H, SLOT_H);
                      return (
                        <div
                          key={res.id}
                          className="absolute rounded-md px-2 py-1 overflow-hidden pointer-events-auto z-10"
                          style={{
                            top,
                            left: 3,
                            right: 3,
                            height,
                            background: "linear-gradient(160deg,#1d6fe8 0%,#2563eb 100%)",
                            boxShadow: "0 1px 4px rgba(37,99,235,0.35)",
                          }}
                          title={`${res.title}\n${res.startTime}–${res.endTime}\n${res.userName}`}
                        >
                          <p className="text-white text-[11px] font-semibold leading-tight truncate">
                            {res.startTime}
                          </p>
                          <p className="text-white text-xs font-bold leading-tight truncate">
                            {res.title}
                          </p>
                          {height >= SLOT_H * 2 && (
                            <p className="text-white/80 text-[11px] leading-tight truncate">
                              {res.userName}
                            </p>
                          )}
                          {height >= SLOT_H * 3 && (
                            <p className="text-white/70 text-[11px] leading-tight">
                              {res.startTime}–{res.endTime}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog ────────────────────────────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新規予約</DialogTitle>
          </DialogHeader>

          {selection && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-1">
              {/* Room & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">会議室</Label>
                  <div className="text-sm font-semibold bg-gray-50 border rounded px-3 py-2 text-gray-900">
                    {selectedRoom?.name ?? "-"}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">日付</Label>
                  <div className="text-sm font-semibold bg-gray-50 border rounded px-3 py-2 text-gray-900">
                    {format(parseISO(date), "M月d日（E）", { locale: ja })}
                  </div>
                </div>
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">開始時刻</Label>
                  <Select value={formStart} onValueChange={setFormStart}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">終了時刻</Label>
                  <Select value={formEnd} onValueChange={setFormEnd}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <Label className="text-xs">
                  会議タイトル <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例：週次ミーティング"
                  required
                  autoFocus
                  className="bg-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs">詳細（任意）</Label>
                <Textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="会議の目的など"
                  rows={2}
                  className="bg-white resize-none"
                />
              </div>

              {/* Attendees */}
              <div className="space-y-1">
                <Label className="text-xs">参加人数</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedRoom?.capacity ?? 100}
                  value={formAttendees}
                  onChange={(e) => setFormAttendees(e.target.value)}
                  className="bg-white w-28"
                />
                {selectedRoom && (
                  <p className="text-xs text-muted-foreground">定員 {selectedRoom.capacity}名</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !formTitle}
                  className="bg-primary hover:bg-primary/90"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  予約を確定する
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDialogOpen(false); resetForm(); }}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
