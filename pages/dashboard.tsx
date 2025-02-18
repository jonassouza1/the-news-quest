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
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Filtros */}
      <div className="mb-4 flex gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2"
          placeholder="Data inicial"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2"
          placeholder="Data final"
        />
        <input
          type="text"
          value={newsletterId}
          onChange={(e) => setNewsletterId(e.target.value)}
          className="border p-2"
          placeholder="ID da Newsletter"
        />
        <select
          value={streakStatus}
          onChange={(e) => setStreakStatus(e.target.value)}
          className="border p-2"
        >
          <option value="">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      {/* Exibição das métricas */}
      {metrics && !loading && !error && (
        <div>
          <p className="text-lg">📖 Total de leituras: {metrics.totalReads}</p>

          <h2 className="text-xl font-bold mt-4">🔥 Ranking dos Leitores</h2>
          {metrics.topReaders.length > 0 ? (
            <ul className="list-disc pl-4">
              {metrics.topReaders.map((reader, index) => (
                <li key={index}>
                  {index + 1}. {reader.email} ({reader.streak} dias)
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum leitor engajado ainda.</p>
          )}

          {/* Gráfico de Engajamento */}
          <h2 className="text-xl font-bold mt-6">📊 Engajamento</h2>
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
  );
}
