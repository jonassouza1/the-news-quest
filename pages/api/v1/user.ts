import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const email = req.query.email as string;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Email inválido" });
  }

  try {
    const userQuery = await database.query({
      text: `
        SELECT streaks.streak_count, streaks.last_read_at
        FROM users
        LEFT JOIN streaks ON users.id = streaks.user_id
        WHERE users.email = $1
      `,
      values: [email],
    });

    if (userQuery.rowCount === 0) {
      // Caso o email não seja encontrado, retorna um status 404 (não encontrado)
      return res.status(404).json({ exists: false });
    }

    const { streak_count, last_read_at } = userQuery.rows[0];

    // Caso o usuário seja encontrado, retorna as informações do streak
    return res.status(200).json({
      exists: true,
      streak: streak_count ?? 0,
      lastRead: last_read_at || "Nenhuma leitura registrada",
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
