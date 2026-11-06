import { createApiServer } from "../server/dev-server.mjs";
if (!process.env.PORTFOLIO_LOCAL_STORE)
  throw new Error("Usá un archivo .env local con PORTFOLIO_LOCAL_STORE.");
const port = Number(process.env.PORT || 4317);
createApiServer().listen(port, "127.0.0.1", () =>
  console.log(`API local: http://127.0.0.1:${port}`),
);
