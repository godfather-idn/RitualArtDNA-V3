const express = require("express");
const cors = require("cors");
const fs = require("fs");

const {
  verifyArtwork,
} = require("./services/ritualEngine");

const app = express();

app.use(cors());
app.use(express.json({
  limit: "10mb",
}));

app.use(express.urlencoded({
  extended: true,
  limit: "10mb",
}));

const DB_FILE = "./db.json";

function readDB() {
  return JSON.parse(
    fs.readFileSync(DB_FILE, "utf8")
  );
}

function writeDB(data) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2)
  );
}

app.get("/", (req, res) => {
  res.send(
    "RitualArtDNA Backend Running 🚀"
  );
});

app.get("/api/artworks", (req, res) => {
  console.log("GET /api/artworks");

  const db = readDB();

  res.json(db.artworks);
});

app.get("/api/history", (req, res) => {
  console.log("GET /api/history");

  const db = readDB();

  res.json(db.history);
});

app.get("/api/registry", (req, res) => {
  console.log("GET /api/registry");

  const db = readDB();

  res.json(db.registry);
});

app.post("/api/artworks", (req, res) => {
  console.log(
    "POST /api/artworks"
  );

  console.log(req.body);

  const db = readDB();

  const artwork = req.body;

  db.artworks.push(artwork);

  writeDB(db);

  res.status(201).json({
    success: true,
  });
});

app.post("/api/history", (req, res) => {
  console.log("POST /api/history");

  const db = readDB();

  db.history.push(req.body);

  writeDB(db);

  res.json({
    success: true,
  });
});

app.post("/api/registry", (req, res) => {
  console.log("POST /api/registry");

  const db = readDB();

  db.registry.push(req.body);

  writeDB(db);

  res.json({
    success: true,
  });
});

app.patch("/api/artworks/:id", (req, res) => {
  console.log(
    "PATCH /api/artworks",
    req.params.id
  );

  const db = readDB();

  const id = Number(req.params.id);

  const artworkIndex =
    db.artworks.findIndex(
      (art) => art.id === id
    );

  if (artworkIndex === -1) {
    return res.status(404).json({
      message: "Artwork not found",
    });
  }

  db.artworks[artworkIndex] = {
    ...db.artworks[artworkIndex],
    ...req.body,
  };

  writeDB(db);

  res.json({
    success: true,
    artwork:
      db.artworks[artworkIndex],
  });
});

app.get("/api/artworks/dna/:dna", (req, res) => {
  const db = readDB();

  const artwork = db.artworks.find(
    (art) => art.dna === req.params.dna
  );

  if (!artwork) {
    return res.status(404).json({
      message: "Artwork not found",
    });
  }

  res.json(artwork);
});

app.get("/api/search", (req, res) => {
  const db = readDB();

  const q =
    (req.query.q || "").toLowerCase();

  const results =
    db.artworks.filter((art) =>
      art.title?.toLowerCase().includes(q) ||
      art.artist?.toLowerCase().includes(q) ||
      art.dna?.toLowerCase().includes(q)
    );

  res.json(results);
});

app.get("/api/registry/:dna", (req, res) => {
  const db = readDB();

  const record =
    db.registry.find(
      (item) => item.dna === req.params.dna
    );

  if (!record) {
    return res.status(404).json({
      message: "Registry record not found",
    });
  }

  res.json(record);
});

app.get("/api/certificates", (req, res) => {
  console.log("GET /api/certificates");

  const db = readDB();

  res.json(db.certificates);
});

app.post("/api/certificates", (req, res) => {
  console.log("POST /api/certificates");

  const db = readDB();

  db.certificates.push(req.body);

  writeDB(db);

  res.status(201).json({
    success: true,
  });
});

app.post(
  "/api/ritual/verify",
  async (req, res) => {

    console.log(
      "POST /api/ritual/verify"
    );

    const artwork =
      req.body;

    const result =
      await verifyArtwork(
        artwork
      );

    res.json(result);
  }
);

app.listen(5000, () => {
  console.log(
    "Backend running on port 5000"
  );
});