const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

const endpoints = [
  "/api/health/db",
  "/api/health/catalog",
  "/api/catalog/search?q=matrix&type=movie",
  "/api/titles?q=matrix",
  "/api/reviews?limit=1",
  "/api/lists",
];

async function checkEndpoint(path) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url.toString());
  const text = await response.text();
  return { path, status: response.status, text };
}

async function run() {
  const results = [];
  for (const path of endpoints) {
    try {
      results.push(await checkEndpoint(path));
    } catch (error) {
      results.push({
        path,
        status: 0,
        text: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const failures = results.filter(
    (result) => result.status === 0 || result.status >= 400
  );

  for (const result of results) {
    const statusLabel = result.status || "ERR";
    console.log(`${statusLabel} ${result.path}`);
  }

  if (failures.length > 0) {
    console.error("\nSmoke check failures:");
    for (const failure of failures) {
      console.error(`- ${failure.path}: ${failure.status}`);
    }
    process.exit(1);
  }

  console.log("\nSmoke checks passed.");
}

run();
