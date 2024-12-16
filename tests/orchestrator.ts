import retry from "async-retry";
import database from "infra/database";

async function waitForAllServices() {
  await waitForWebServer();
}
async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function waitForWebServer() {
  return retry(fatchStatusPage, {
    retries: 100,
    maxTimeout: 1000,
  });

  async function fatchStatusPage() {
    const response = await fetch("http://localhost:3000/api/v1/status");
    if (response.status !== 200) {
      throw Error();
    }
  }
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
};

export default orchestrator;
