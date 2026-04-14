import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, reservationsTable, roomsTable, usersTable } from "@workspace/db";
import {
  ListReservationsQueryParams,
  CreateReservationBody,
  GetReservationParams,
  UpdateReservationParams,
  UpdateReservationBody,
  DeleteReservationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichReservation(r: typeof reservationsTable.$inferSelect) {
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
}

router.get("/reservations", async (req, res): Promise<void> => {
  const params = ListReservationsQueryParams.safeParse(req.query);

  const conditions = [];
  if (params.success && params.data.roomId !== undefined) {
    conditions.push(eq(reservationsTable.roomId, params.data.roomId));
  }
  if (params.success && params.data.date !== undefined) {
    conditions.push(eq(reservationsTable.date, params.data.date));
  }
  if (params.success && params.data.userId !== undefined) {
    conditions.push(eq(reservationsTable.userId, params.data.userId));
  }

  let query = db.select().from(reservationsTable).$dynamic();
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const reservations = await query.execute();
  const enriched = await Promise.all(reservations.map(enrichReservation));
  res.json(enriched);
});

router.post("/reservations", async (req, res): Promise<void> => {
  const userId = (req as any).session?.userId ?? 1;

  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { roomId, title, description, date, startTime, endTime, attendees } = parsed.data;

  const existing = await db
    .select()
    .from(reservationsTable)
    .where(
      and(
        eq(reservationsTable.roomId, roomId),
        eq(reservationsTable.date, date),
        sql`NOT (${reservationsTable.endTime} <= ${startTime} OR ${reservationsTable.startTime} >= ${endTime})`
      )
    );

  if (existing.length > 0) {
    res.status(409).json({ error: "この時間帯は既に予約されています" });
    return;
  }

  const [reservation] = await db
    .insert(reservationsTable)
    .values({ roomId, userId, title, description, date, startTime, endTime, attendees })
    .returning();

  const enriched = await enrichReservation(reservation);
  res.status(201).json(enriched);
});

router.get("/reservations/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetReservationParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reservation] = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.id, params.data.id));

  if (!reservation) {
    res.status(404).json({ error: "予約が見つかりません" });
    return;
  }

  const enriched = await enrichReservation(reservation);
  res.json(enriched);
});

router.patch("/reservations/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateReservationParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof reservationsTable.$inferInsert> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
  if (parsed.data.startTime !== undefined) updateData.startTime = parsed.data.startTime;
  if (parsed.data.endTime !== undefined) updateData.endTime = parsed.data.endTime;
  if (parsed.data.attendees !== undefined) updateData.attendees = parsed.data.attendees;

  const [reservation] = await db
    .update(reservationsTable)
    .set(updateData)
    .where(eq(reservationsTable.id, params.data.id))
    .returning();

  if (!reservation) {
    res.status(404).json({ error: "予約が見つかりません" });
    return;
  }

  const enriched = await enrichReservation(reservation);
  res.json(enriched);
});

router.delete("/reservations/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteReservationParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reservation] = await db
    .delete(reservationsTable)
    .where(eq(reservationsTable.id, params.data.id))
    .returning();

  if (!reservation) {
    res.status(404).json({ error: "予約が見つかりません" });
    return;
  }

  res.sendStatus(204);
});

export default router;
