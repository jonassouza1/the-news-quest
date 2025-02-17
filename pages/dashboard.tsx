import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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

  // Estado dos filtros
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [newsletterId, setNewsletterId] = useState<string>("");
  const [streakStatus, setStreakStatus] = useState<string>("");

  useEffect(() => {
    fetch(
      `/api/v1/metrics?startDate=${startDate}&endDate=${endDate}&newsletterId=${newsletterId}&streakStatus=${streakStatus}`,
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erro ao carregar métricas");
        }
        return res.json();
      })
      .then((data) => {
        setMetrics({
          totalReads: data.totalReads || 0,
          topReaders: data.topReaders || [],
        });
      })
      .catch((error) => {
        console.error(error);
        setError("Não foi possível carregar os dados.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [startDate, endDate, newsletterId, streakStatus]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Filtros */}
      <div className="mb-4">
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

      {/* Exibição das métricas */}
      {metrics && !loading && !error && (
        <div>
          <p>Total de leituras: {metrics.totalReads}</p>

          <h2 className="text-xl font-bold mt-4">Ranking dos Leitores</h2>
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

          {/* Gráfico de engajamento */}
          <h2 className="text-xl font-bold mt-6">
            Engajamento ao Longo do Tempo
          </h2>
          <LineChart width={600} height={300} data={metrics.topReaders}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="email" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="streak" stroke="#8884d8" />
          </LineChart>
        </div>
      )}
    </div>
  );
}
