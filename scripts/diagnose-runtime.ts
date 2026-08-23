// ============================================================
// MEDORA â€” RUNTIME ROUTE DIAGNOSTIC TRACER
// ============================================================

async function fetchRoute(path: string) {
  const url = `http://localhost:3000${path}`;
  try {
    const res = await fetch(url, {
      redirect: "manual",
    });

    const status = res.status;
    const location = res.headers.get("location");
    const text = await res.text();
    
    // Extract title
    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "No <title>";

    // Extract prominent headings or component markers
    const h1Match = text.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "No <h1>";

    return {
      path,
      status,
      location,
      title,
      h1,
      bodyLength: text.length,
      snippet: text.slice(0, 300).replace(/\s+/g, " "),
    };
  } catch (err: any) {
    return {
      path,
      error: err.message,
    };
  }
}

async function main() {
  console.log("============================================================");
  console.log("MEDORA RUNTIME ROUTE DIAGNOSTIC REPORT");
  console.log("============================================================\n");

  const routes = [
    "/",
    "/login",
    "/patient",
    "/doctor",
    "/doctor/schedule",
    "/hospital",
    "/hospital/emergency",
    "/reception",
    "/lab",
    "/pharmacy",
  ];

  for (const r of routes) {
    const info = await fetchRoute(r);
    console.log(`ROUTE: ${r}`);
    console.log(`  Status: ${info.status}`);
    if (info.location) console.log(`  Redirect Location: ${info.location}`);
    if (info.title) console.log(`  Title: ${info.title}`);
    if (info.h1) console.log(`  Primary H1: ${info.h1}`);
    console.log(`  Body Length: ${info.bodyLength} bytes`);
    console.log("------------------------------------------------------------");
  }
}

main();
