import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import styles from "styles/dashboard.module.css";

interface Metrics {
  totalReads: number;
  topReaders: {
    email: string;
    streak: number;
  }[];
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para os filtros
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [newsletterId, setNewsletterId] = useState<string>("");
  const [streakStatus, setStreakStatus] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    fetch(
      `api/v1/metrics?startDate=${startDate}&endDate=${endDate}&newsletterId=${newsletterId}&streakStatus=${streakStatus}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar métricas");
        return res.json();
      })
      .then((data) => setMetrics(data))
      .catch((error) => {
        console.error(error);
        setError("Não foi possível carregar os dados.");
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate, newsletterId, streakStatus]);

  return (
    <section className={styles.section}>
      <div className={styles.divContainer}>
        <h1 className={styles.h1}>Dashboard</h1>
        <br />
        <br />

        {loading && <p>Carregando...</p>}
        {error && <p>{error}</p>}

        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Data inicial"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Data final"
          />
          <input
            type="text"
            value={newsletterId}
            onChange={(e) => setNewsletterId(e.target.value)}
            placeholder="ID da Newsletter"
          />
          <select
            value={streakStatus}
            onChange={(e) => setStreakStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        {metrics && !loading && !error && (
          <div>
            <p>📖 Total de leituras: {metrics.totalReads}</p>
            <br />

            <h2 className={styles.h2}>🔥 Ranking dos Leitores</h2>
            {metrics.topReaders.length > 0 ? (
              <ul>
                {metrics.topReaders.map((reader, index) => (
                  <li key={index}>
                    {index + 1}. {reader.email} ({reader.streak} dias)
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum leitor engajado ainda.</p>
            )}
            <div></div>
            <br />
            <h2 className={styles.h2}>📊 Engajamento</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={metrics.topReaders.map((reader) => ({
                  email: reader.email,
                  streak: reader.streak,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="email"
                  label={{
                    value: "Leitores",
                    offset: 0,
                    position: "insideBottom",
                  }}
                />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="streak" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
