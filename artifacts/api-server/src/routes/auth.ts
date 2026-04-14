import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user || user.password !== password) {
    res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません" });
    return;
  }

  req.session = req.session ?? {};
  (req as any).session.userId = user.id;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    message: "ログインに成功しました",
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req as any).session?.userId;
  if (!userId) {
    res.status(401).json({ error: "未認証です" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) {
    res.status(401).json({ error: "ユーザーが見つかりません" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  (req as any).session = null;
  res.json({ message: "ログアウトしました" });
});

export default router;
