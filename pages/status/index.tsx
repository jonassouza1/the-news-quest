import useSWR from "swr";
async function fetchAPI(key: any) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}
export default function StatusPage() {
  return (
    <div>
      <h1>Status</h1>
      <UpdatedAt />
      <DataBaseStatus />
    </div>
  );
}
function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando ...";
  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }
  return <div>Última atualização: {updatedAtText}</div>;
}

function DataBaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });
  let databaseStatusInformation: any = "Carregando...";
  if (!isLoading && data) {
    databaseStatusInformation = (
      <>
        <div>Versão:{data.dependencies.database.version}</div>
        <div>
          Conexões abertas:{data.dependencies.database.opened_connections}
        </div>
        <div>Conexões máximas:{data.dependencies.database.max_connections}</div>
      </>
    );
  }
  return (
    <>
      <h2>Database</h2>
      <div>{databaseStatusInformation}</div>
    </>
  );
}
