const http = require("http");

const routes = [
  "/patient",
  "/patient/profile",
  "/patient/profile/abha",
  "/patient/privacy",
  "/patient/consent",
  "/patient/appointments",
  "/patient/records",
  "/patient/emergency",
  "/patient/prescriptions",
  "/patient/reports",
  "/patient/pharmacy",
  "/patient/bills",
  "/patient/health",
  "/patient/care",
  "/patient/language",
  "/patient/settings",
  "/patient/help",
];

async function testAll() {
  console.log("Testing MEDORA Patient Routes on http://localhost:3000...\n");
  let passed = 0;
  for (const r of routes) {
    try {
      const code = await new Promise((resolve, reject) => {
        http.get("http://localhost:3000" + r, (res) => {
          resolve(res.statusCode);
        }).on("error", reject);
      });
      console.log(`✓ ${r.padEnd(26)} -> HTTP ${code}`);
      if (code === 200 || code === 307 || code === 308) passed++;
    } catch (err) {
      console.log(`✗ ${r.padEnd(26)} -> ERROR: ${err.message}`);
    }
  }
  console.log(`\nResult: ${passed}/${routes.length} routes verified.`);
}

testAll();
