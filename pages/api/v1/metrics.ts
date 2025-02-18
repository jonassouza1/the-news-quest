import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { startDate, endDate, newsletterId, streakStatus } = req.query;

    // **Total de leituras filtradas por data e newsletter**
    const totalReadsQuery = await database.query({
      text: `
        SELECT COUNT(*)::INT AS total_reads 
        FROM reads 
        WHERE ($1::DATE IS NULL OR read_at >= CAST($1 AS DATE)) 
          AND ($2::DATE IS NULL OR read_at <= CAST($2 AS DATE)) 
          AND ($3::INTEGER IS NULL OR newsletter_id = $3)
      `,
      values: [startDate || null, endDate || null, newsletterId || null],
    });

    // **Ranking dos leitores mais engajados**
    const topReadersQuery = await database.query({
      text: `
        SELECT users.email, COALESCE(streaks.streak_count, 0) AS streak 
        FROM users 
        LEFT JOIN streaks ON users.id = streaks.user_id 
        WHERE (
          $1::TEXT IS NULL 
          OR ($1 = 'ativo' AND streaks.streak_count > 0)
          OR ($1 = 'inativo' AND streaks.streak_count IS NULL)
        )
        ORDER BY streak DESC 
        LIMIT 10
      `,
      values: [streakStatus || null],
    });

    // **Garantindo que os valores são retornados corretamente**
    const totalReads = totalReadsQuery.rows[0]?.total_reads || 0;
    const topReaders = topReadersQuery.rows.map((row: any) => ({
      email: row.email,
      streak: row.streak,
    }));

    return res.status(200).json({ totalReads, topReaders });
  } catch (error) {
    console.error("Erro ao carregar métricas:", error);
    return res.status(500).json({ error: "Erro ao carregar métricas" });
  }
}
