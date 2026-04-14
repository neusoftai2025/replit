import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, roomsTable } from "@workspace/db";
import {
  ListRoomsQueryParams,
  CreateRoomBody,
  GetRoomParams,
  UpdateRoomParams,
  UpdateRoomBody,
  DeleteRoomParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/rooms", async (req, res): Promise<void> => {
  const params = ListRoomsQueryParams.safeParse(req.query);

  let query = db.select().from(roomsTable).$dynamic();

  const conditions = [];
  if (params.success && params.data.floor !== undefined) {
    conditions.push(eq(roomsTable.floor, params.data.floor));
  }
  if (params.success && params.data.capacity !== undefined) {
    conditions.push(eq(roomsTable.capacity, params.data.capacity));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const rooms = await query.execute();
  res.json(rooms.map(r => ({
    id: r.id,
    name: r.name,
    floor: r.floor,
    capacity: r.capacity,
    equipment: r.equipment ?? [],
    available: r.available,
    createdAt: r.createdAt,
  })));
});

router.post("/rooms", async (req, res): Promise<void> => {
  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [room] = await db.insert(roomsTable).values({
    name: parsed.data.name,
    floor: parsed.data.floor,
    capacity: parsed.data.capacity,
    equipment: parsed.data.equipment ?? [],
    available: parsed.data.available ?? true,
  }).returning();

  res.status(201).json({
    id: room.id,
    name: room.name,
    floor: room.floor,
    capacity: room.capacity,
    equipment: room.equipment ?? [],
    available: room.available,
    createdAt: room.createdAt,
  });
});

router.get("/rooms/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetRoomParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, params.data.id));
  if (!room) {
    res.status(404).json({ error: "会議室が見つかりません" });
    return;
  }

  res.json({
    id: room.id,
    name: room.name,
    floor: room.floor,
    capacity: room.capacity,
    equipment: room.equipment ?? [],
    available: room.available,
    createdAt: room.createdAt,
  });
});

router.patch("/rooms/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateRoomParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof roomsTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.floor !== undefined) updateData.floor = parsed.data.floor;
  if (parsed.data.capacity !== undefined) updateData.capacity = parsed.data.capacity;
  if (parsed.data.equipment !== undefined) updateData.equipment = parsed.data.equipment;
  if (parsed.data.available !== undefined) updateData.available = parsed.data.available;

  const [room] = await db
    .update(roomsTable)
    .set(updateData)
    .where(eq(roomsTable.id, params.data.id))
    .returning();

  if (!room) {
    res.status(404).json({ error: "会議室が見つかりません" });
    return;
  }

  res.json({
    id: room.id,
    name: room.name,
    floor: room.floor,
    capacity: room.capacity,
    equipment: room.equipment ?? [],
    available: room.available,
    createdAt: room.createdAt,
  });
});

router.delete("/rooms/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteRoomParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [room] = await db
    .delete(roomsTable)
    .where(eq(roomsTable.id, params.data.id))
    .returning();

  if (!room) {
    res.status(404).json({ error: "会議室が見つかりません" });
    return;
  }

  res.sendStatus(204);
});

export default router;
