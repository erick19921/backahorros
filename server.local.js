// server.local.js
import app from "./api/index.js";

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API local en http://localhost:${port}`);
});
