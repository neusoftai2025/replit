import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, roomsTable, reservationsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function getCurrentTimeJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(11, 16);
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const today = getTodayJST();
  const currentTime = getCurrentTimeJST();

  const [totalRoomsResult] = await db.select({ count: sql<number>`count(*)` }).from(roomsTable);
  const totalRooms = Number(totalRoomsResult?.count ?? 0);

  const todayReservations = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.date, today));
  const totalReservationsToday = todayReservations.length;

  const busyRoomIds = new Set(
    todayReservations
      .filter(r => r.startTime <= currentTime && r.endTime > currentTime)
      .map(r => r.roomId)
  );

  const availableRoomsNow = totalRooms - busyRoomIds.size;

  const upcomingReservations = todayReservations.filter(
    r => r.startTime > currentTime
  ).length;

  res.json({
    totalRooms,
    totalReservationsToday,
    availableRoomsNow,
    upcomingReservations,
  });
});

router.get("/dashboard/today", async (_req, res): Promise<void> => {
  const today = getTodayJST();

  const reservations = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.date, today));

  const enriched = await Promise.all(
    reservations.map(async r => {
      const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, r.roomId));
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId));
      return {
        id: r.id,
        roomId: r.roomId,
        userId: r.userId,
        title: r.title,
        description: r.description ?? null,
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        attendees: r.attendees,
        roomName: room?.name ?? "",
        userName: user?.name ?? "",
        createdAt: r.createdAt,
      };
    })
  );

  res.json(enriched);
});

router.get("/dashboard/room-usage", async (_req, res): Promise<void> => {
  const rooms = await db.select().from(roomsTable);
  const allReservations = await db.select().from(reservationsTable);

  const reservationsByRoom: Record<number, number> = {};
  for (const r of allReservations) {
    reservationsByRoom[r.roomId] = (reservationsByRoom[r.roomId] ?? 0) + 1;
  }

  const maxCount = Math.max(...Object.values(reservationsByRoom), 1);

  const usage = rooms.map(room => ({
    roomId: room.id,
    roomName: room.name,
    reservationCount: reservationsByRoom[room.id] ?? 0,
    utilizationPercent: Math.round(((reservationsByRoom[room.id] ?? 0) / maxCount) * 100),
  }));

  res.json(usage);
});

export default router;
