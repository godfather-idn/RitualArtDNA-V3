import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import ritualLogo from "./assets/ritual-logo.png";

import {
  generateFingerprint,
} from "./utils/fingerprint";

import {
  verifyWithRitual,
} from "./ritual/ritualService";

function App() {

const [title, setTitle] = useState("");
const [artist, setArtist] = useState("");
const [image, setImage] = useState(null);

const [artworks, setArtworks] =
  useState([]);

const [history, setHistory] =
  useState([]);

const [registry, setRegistry] =
  useState([]);

const [registryStatus, setRegistryStatus] =
  useState("Ready");

const [wallet, setWallet] =
  useState(null);

const [searchDNA, setSearchDNA] =
  useState("");

const [verifiedArt, setVerifiedArt] = useState(null);
const [selectedArtwork, setSelectedArtwork] = useState(null);
const [certificates, setCertificates] = useState([]);
const [aiScore, setAiScore] = useState(null);
const [scanStatus, setScanStatus] = useState("");

const [isScanning, setIsScanning] =
  useState(false);

const handleImage = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onloadend = () => {
    setImage(reader.result);
  };

  reader.readAsDataURL(file);
};

const saveArtwork = async () => {
  console.log("SAVE BUTTON CLICKED");

  if (!title || !artist || !image) {
    alert("Lengkapi data dulu bro");
    return;
  }

  const fingerprint = generateFingerprint(image);

  const existingArtwork =
    artworks.find(
      (art) =>
        art.hash ===
        fingerprint.hash
    );

  if (existingArtwork) {
    alert(
      "Artwork sudah pernah diregistrasi."
    );
    return;
  }

    const newArtwork = {
      id: Date.now(),

      dna:
        fingerprint.dnaId,

      hash:
        fingerprint.hash,

      verified: false,

      title,
      artist,

      image,

      ownerWallet:
        wallet ||
        "Not Connected",

      createdAt:
        new Date().toISOString(),
    };

  const updatedArtworks = [
  ...artworks,
  newArtwork,
];

setArtworks(updatedArtworks);

localStorage.setItem(
  "ritual-artworks",
  JSON.stringify(updatedArtworks)
);

console.log("SEBELUM POST");
console.log(newArtwork);

try {
  await fetch(
    "http://localhost:5000/api/artworks",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
        newArtwork
      ),
    }
  );

  console.log(
    "Artwork saved to backend"
  );

  console.log("SETELAH POST");

} catch (error) {

  console.error(
    "Backend unavailable:",
    error
  );
}

  setTitle("");
  setArtist("");
  setImage(null);
};

useEffect(() => {
  const style =
    document.createElement("style");

  style.innerHTML = `
    @keyframes scanMove {
      0% {
        transform:
          translateX(-100%);
      }

      100% {
        transform:
          translateX(100%);
      }
    }
  `;

  document.head.appendChild(style);
}, []);

useEffect(() => {
  const savedWallet =
    localStorage.getItem(
      "ritual-wallet"
    );

  if (savedWallet) {
    setWallet(savedWallet);
  }
}, []);

useEffect(() => {
  if (wallet) {
    localStorage.setItem(
      "ritual-wallet",
      wallet
    );
  }
}, [wallet]);
/*
useEffect(() => {
  localStorage.setItem(
    "ritual-history",
    JSON.stringify(history)
  );
}, [history]);

useEffect(() => {
  localStorage.setItem(
    "ritual-registry",
    JSON.stringify(registry)
  );
}, [registry]);
*/
useEffect(() => {
  const migratedArtworks =
    artworks.map((art) => ({
      ...art,

      ownerWallet:
        art.ownerWallet ||
        "Not Connected",

      createdAt:
        art.createdAt ||
        new Date().toISOString(),

      hash:
        art.hash || null,

      score:
        art.score ?? null,

      status:
        art.status ||
        (art.verified
          ? "UNKNOWN"
          : null),

      verifiedAt:
        art.verifiedAt || null,
    }));

  const hasChanges =
    JSON.stringify(migratedArtworks) !==
    JSON.stringify(artworks);

  if (hasChanges) {
    setArtworks(
      migratedArtworks
    );

    localStorage.setItem(
      "ritual-artworks",
      JSON.stringify(
        migratedArtworks
      )
    );
  }
}, []);

useEffect(() => {
  console.log("Loading data from backend...");

  fetch("http://localhost:5000/api/artworks")
    .then((res) => res.json())
    .then((data) => {
      console.log(
        "Artworks loaded:",
        data
      );

      setArtworks(data);
    });

  fetch("http://localhost:5000/api/history")
    .then((res) => res.json())
    .then((data) => {
      console.log(
        "History loaded:",
        data
      );

      setHistory(data);
    });

  fetch("http://localhost:5000/api/registry")
    .then((res) => res.json())
    .then((data) => {
      console.log(
        "Registry loaded:",
        data
      );

      setRegistry(data);
    });

  fetch("http://localhost:5000/api/certificates")
    .then((res) => res.json())
    .then((data) => {
      console.log("Certificates loaded:", data);

      setCertificates(data);
    });

}, []);

const verifyArtwork = (art) => {

  if (art.verified) {
    alert(
      "Artwork sudah diverifikasi."
    );
    return;
  }

  setIsScanning(true);

  setTimeout(async () => {
        
    setRegistryStatus(art.title);

    const ritualResult =
      await verifyWithRitual(art);

    const randomScore =
      ritualResult.score;

    const verificationStatus =
      randomScore >= 90
        ? "AUTHENTIC"
        : "MODIFIED";

    const now =
      new Date().toLocaleString();

    const updatedArtworks =
      artworks.map((item) =>
        item.id === art.id
          ? {
              ...item,

              verified: true,

              score: randomScore,

              status:
                verificationStatus,

              verifiedAt: now,
            }
          : item
      );

    setArtworks(updatedArtworks);

    const verifiedArtwork = updatedArtworks.find(
      (item) => item.id === art.id
    );

    setVerifiedArt(verifiedArtwork);

    setSelectedArtwork(verifiedArtwork);

    localStorage.setItem(
      "ritual-artworks",
      JSON.stringify(updatedArtworks)
    );

    fetch(
      `http://localhost:5000/api/artworks/${art.id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          verified: true,

          score: randomScore,

          status:
            verificationStatus,

          verifiedAt: now,
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(
          "Verification synced:",
          data
        );
      })
      .catch((err) => {
        console.error(
          "PATCH failed:",
          err
        );
      });
    
    setAiScore(randomScore);

    setScanStatus(
      verificationStatus ===
        "AUTHENTIC"
        ? "Authentic Artwork"
        : "Potentially Modified"
    );

    setHistory((prev) => [
      {
        time: now,
        title: art.title,
        dna: art.dna,

        wallet:
          art.ownerWallet,
          
        score: randomScore,
        status:
          verificationStatus,
      },
      ...prev,
    ]);

    fetch(
      "http://localhost:5000/api/history",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          time: now,
          title: art.title,
          dna: art.dna,
          wallet: art.ownerWallet,
          score: randomScore,
          status: verificationStatus,
        }),
      }
    )
    .then(() => {
      console.log(
        "History saved to backend"
      );
    })
    .catch((err) => {
      console.error(err);
    });

  const registryExists =
    registry.some(
      (item) =>
        item.dna === art.dna
    );

  if (!registryExists) {

    setRegistry((prev) => [
      {
        dna: art.dna,
        title: art.title,
        artist: art.artist,

        wallet:
          art.ownerWallet,

        score: randomScore,

        status:
          verificationStatus,

        time: now,
      },

      ...prev,
    ]);
  }

  fetch(
    "http://localhost:5000/api/registry",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        dna: art.dna,
        title: art.title,
        artist: art.artist,
        wallet: art.ownerWallet,
        score: randomScore,
        status: verificationStatus,
        time: now,
      }),
    }
  )
  .then(() => {
    console.log(
      "Registry saved to backend"
    );
  })
  .catch((err) => {
    console.error(err);
  });

  const verifiedCertificate =
    updatedArtworks.find(
      (item) => item.id === art.id
    );
  
  const certificateRecord = {
    id: verifiedCertificate.id,

    dna: verifiedCertificate.dna,

    title: verifiedCertificate.title,

    artist: verifiedCertificate.artist,

    ownerWallet:
      verifiedCertificate.ownerWallet,

    hash:
      verifiedCertificate.hash,

    score:
      verifiedCertificate.score,

    status:
      verifiedCertificate.status,

    createdAt:
      verifiedCertificate.createdAt,

    verifiedAt:
      verifiedCertificate.verifiedAt,
  };

  setVerifiedArt(
    verifiedCertificate
  );

  setCertificates((prev) => [
    certificateRecord,
    ...prev,
  ]);

  fetch(
    "http://localhost:5000/api/certificates",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        certificateRecord
      ),
    }
  )
    .then(() =>
      console.log(
        "Certificate saved"
      )
    )
    .catch(console.error);

    setIsScanning(false);
  }, 2500);
  
};

const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      alert(
        "MetaMask belum terinstall bro"
      );
      return;
    }

    const accounts =
      await window.ethereum.request({
        method:
          "eth_requestAccounts",
      });

    setWallet(accounts[0]);

        localStorage.setItem(
      "ritual-wallet",
      accounts[0]
    );

  } catch (err) {
    console.error(err);
  }
};

const disconnectWallet = () => {
  localStorage.removeItem(
    "ritual-wallet"
  );

  setWallet(null);
};

const downloadCertificate = async () => {
  const element =
    document.getElementById(
      "ritual-certificate"
    );

  if (!element) return;

  const canvas =
    await html2canvas(element);

  const image =
    canvas.toDataURL("image/png");

  const link =
    document.createElement("a");

  link.href = image;

  link.download =
    "RitualArtDNA-Certificate.png";

  link.click();
};

const verifiedCount =
  artworks.filter(
    (art) => art.verified
  ).length;

const explorerRecord =
  selectedArtwork
    ? artworks.find(
        (item) =>
          item.dna ===
          selectedArtwork.dna
      )
    : null;

const certificateArt =
  verifiedArt || selectedArtwork;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0f172a 0%, #020617 50%, #000000 100%)",
        color: "white",
        padding: "60px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "40px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: "400px",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              color: "#00ff88",
              marginBottom: "20px",
              textShadow:
                "0 0 20px #00ff88",
            }}
          >
            RitualArtDNA
          </h1>

          <p
            style={{
              fontSize: "22px",
              color: "#94a3b8",
              lineHeight: "1.8",
              maxWidth: "700px",
            }}
          >
            AI-Powered Artwork Verification
            built on Ritual Infrastructure.
          </p>

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "35px",
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                background: "#00ff88",
                color: "#000",
                border: "none",
                padding: "15px 28px",
                borderRadius: "14px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Verify Artwork
            </button>

            <button
              style={{
                background: "transparent",
                border:
                  "1px solid #00ff88",
                color: "#00ff88",
                padding: "15px 28px",
                borderRadius: "14px",
                cursor: "pointer",
              }}
            >
              Explore Registry
            </button>

            <button
              onClick={
                wallet
                  ? disconnectWallet
                  : connectWallet
              }
              style={{
                background: wallet
                  ? "#ef4444"
                  : "#8b5cf6",

                color: "white",
                border: "none",
                padding: "15px 28px",
                borderRadius: "14px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {wallet
                ? `Disconnect ${wallet.slice(0, 6)}...${wallet.slice(-4)}`
                : "Connect Wallet"}
            </button>
          </div>
        </div>

        <img
          src={ritualLogo}
          alt="Ritual Logo"
          style={{
            width: "260px",
            filter:
              "drop-shadow(0 0 35px #00ff88)",
          }}
        />
      </div>

            {/* DASHBOARD STATS */}

      <div
        style={{
          maxWidth: "1400px",
          margin: "60px auto 0",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "#111827",
            padding: "30px",
            borderRadius: "20px",
            border: "1px solid #00ff88",
          }}
        >
          <h3>🎨 Artworks</h3>
          <h1 style={{ color: "#00ff88" }}>
          {artworks.length}
          </h1>
        </div>

        <div
          style={{
            background: "#111827",
            padding: "30px",
            borderRadius: "20px",
            border: "1px solid #8b5cf6",
          }}
        >
          <h3>👛 Wallet</h3>

          <h1
            style={{
              fontSize: "18px",
            }}
          >
            {wallet 
              ? ` ${wallet.slice(0, 6)}...${wallet.slice(-4)}` 
              : "Offline"}
          </h1>

          <p
            style={{
              color: wallet
                ? "#00ff88"
                : "#ef4444",
              fontWeight: "bold",
              marginTop: "10px",
            }}
          >
            {
              wallet
              ? "🟢 Connected"
              : "🔴 Not Connected"}
          </p>
        </div>

        <div
          style={{
            background: "#111827",
            padding: "30px",
            borderRadius: "20px",
            border: "1px solid #00ffcc",
          }}
        >
          <h3>🤖 AI Verified</h3>
          <h1>{verifiedCount}</h1>
        </div>

        <div
          style={{
            background: "#111827",
            padding: "30px",
            borderRadius: "20px",
            border: "1px solid #f97316",
          }}
        >
          <h3>📜 Registry</h3>
          <h1>
            {registry.length}
          </h1>
        </div>
      </div>

            {/* UPLOAD PANEL */}

      <div
        style={{
          maxWidth: "1400px",
          margin: "50px auto",
        }}
      >
        <div
          style={{
            background: "#111827",
            border: "1px solid #1e293b",
            borderRadius: "24px",
            padding: "40px",
          }}
        >
          <h2
            style={{
              color: "#00ff88",
              marginBottom: "30px",
            }}
          >
            Upload Artwork
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <input
              type="text"
              placeholder="Artwork Title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              style={{
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "white",
                fontSize: "16px",
              }}
            />

            <input
              type="text"
              placeholder="Artist Name"
              value={artist}
              onChange={(e) =>
                setArtist(e.target.value)
              }
              style={{
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "white",
                fontSize: "16px",
              }}
            />

            <input
              type="file"
              onChange={handleImage}
              style={{
                padding: "12px",
                borderRadius: "12px",
                background: "#0f172a",
                color: "white",
              }}
            />

            <button
              onClick={saveArtwork}
              style={{
                background:
                  "linear-gradient(90deg,#00ff88,#00ffcc)",
                color: "#000",
                border: "none",
                padding: "16px",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Save Artwork
            </button>
          </div>
        </div>
      </div>
      
            {/* ARTWORK GALLERY */}

      <div
        style={{
          maxWidth: "1400px",
          margin: "40px auto",
        }}
      >
        <input
          type="text"
          placeholder="Search DNA, Hash, Wallet, Artwork, Artist..."
          value={searchDNA}
          onChange={(e) =>
            setSearchDNA(e.target.value)
          }
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #334155",
            background: "#0f172a",
            color: "white",
            fontSize: "16px",
          }}
        />
      </div>

      <div
        style={{
          maxWidth: "1400px",
          margin: "40px auto",
          background: "#111827",
          borderRadius: "20px",
          padding: "25px",
          border: "1px solid #1e293b",
        }}
      >
        <h2
          style={{
            color: "#00ff88",
            marginBottom: "20px",
          }}
        >
          Registry Activity
        </h2>

        {history.length === 0 ? (
          <p>No activity yet</p>
        ) : (
          history.map((item, index) => (
            <p key={index}>
              [{item.time}] {item.title}
              {" "}
              verified
            </p>
          ))
        )}
      </div>

      <div
        style={{
          maxWidth: "1400px",
          margin: "50px auto",
        }}
      >
        <h2
          style={{
            color: "#00ff88",
            marginBottom: "25px",
          }}
        >
          Artwork Registry
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(300px,1fr))",
            gap: "25px",
          }}
        >
                      {artworks.length === 0 ? (
              <div
                style={{
                  background: "#111827",
                  padding: "40px",
                  borderRadius: "20px",
                  border: "1px solid #1e293b",
                  textAlign: "center",
                }}
              >
                No Artwork Uploaded Yet
              </div>
            ) : (
              artworks
                .filter((art) => {
                  const keyword =
                    searchDNA.toLowerCase();

                  return (
                    searchDNA === "" ||

                    art.dna
                      ?.toLowerCase()
                      .includes(keyword) ||

                    art.title
                      ?.toLowerCase()
                      .includes(keyword) ||

                    art.artist
                      ?.toLowerCase()
                      .includes(keyword) ||

                    art.ownerWallet
                      ?.toLowerCase()
                      .includes(keyword) ||

                    art.hash
                      ?.toLowerCase()
                      .includes(keyword)
                  );
                })

                .map((art) => (
                  
                <div
                  key={art.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedArtwork(art);
                  }}
                  style={{
                    cursor: "pointer",
                    background: "#111827",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "1px solid #1e293b",
                  }}
                >
                  <img
                    src={art.image}
                    alt={art.title}
                    style={{
                      width: "100%",
                      height: "220px",
                      objectFit: "cover",
                    }}
                  />

                  <div
                    style={{
                      padding: "20px",
                    }}
                  >
                    <h3>{art.title}</h3>

                    <p
                      style={{
                        color: "#94a3b8",
                        marginTop: "8px",
                      }}
                    >
                      By {art.artist}
                    </p>

                    <p
                      style={{
                        color: "#00ff88",
                        fontSize: "12px",
                        marginTop: "6px",
                        fontWeight: "bold",
                      }}
                    >
                      {art.dna}
                    </p>

                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: "11px",
                        marginTop: "4px",
                      }}
                    >
                      Hash:
                      {" "}
                      {art.hash?.slice(0, 12)}...
                    </p>

                    {art.verified && (
                    <p
                      style={{
                        color: "#00ff88",
                        fontWeight: "bold",
                        marginTop: "10px",
                      }}
                    >
                      ✔ VERIFIED
                    </p>
                  )}

                  {!art.verified ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        verifyArtwork(art);
                      }}
                      style={{
                        marginTop: "20px",
                        width: "100%",
                        padding: "12px",
                        background: "#00ff88",
                        color: "#000",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Verify Artwork
                    </button>
                  ) : (
                    <button
                      disabled
                      style={{
                        marginTop: "20px",
                        width: "100%",
                        padding: "12px",
                        background: "#334155",
                        color: "#94a3b8",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      Already Verified
                    </button>
                  )}
                  </div>
                </div>
              ))
            )}
          
                        {isScanning && (
                <div
                  style={{
                    marginTop: "40px",
                    background: "#111827",
                    padding: "30px",
                    borderRadius: "20px",
                    border:
                      "1px solid #00ff88",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <h2
                    style={{
                      color: "#00ff88",
                    }}
                  >
                    Scanning Artwork...
                  </h2>

                  <p
                    style={{
                      color: "#94a3b8",
                    }}
                  >
                    Ritual AI is analyzing
                    ownership fingerprints...
                  </p>

                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "4px",
                      background:
                        "linear-gradient(90deg,#00ff88,#00ffcc)",
                      animation:
                        "scanMove 1s linear infinite",
                    }}
                  />
                </div>
              )}

            {(verifiedArt || selectedArtwork) && (
              <div
                id="ritual-certificate"
                style={{
                  maxWidth: "1400px",
                  margin: "40px auto",
                  background: "#111827",
                  border: "1px solid #00ff88",
                  borderRadius: "20px",
                  padding: "30px",
                }}
              >
                <>
                  <h2
                    style={{
                      color: "#00ff88",
                      textAlign: "center",
                      marginBottom: "5px",
                    }}
                  >
                    RitualArtDNA
                  </h2>

                  <p
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      marginBottom: "25px",
                    }}
                  >
                    Certificate of Authenticity
                  </p>
                </>

                <p>
                  Artwork ID:
                  {" "}
                  {verifiedArt?.id || selectedArtwork?.id}
                </p>
                
                <p>
                  <strong>Artwork:</strong>
                  {" "}
                  {certificateArt.title}
                </p>

                <p>
                  <strong>Artist:</strong>
                  {" "}
                  {certificateArt.artist}
                </p>

                <p>
                  <strong>Owner:</strong>
                  {" "}
                  {certificateArt.ownerWallet}
                </p>

                <p
                  style={{
                    color: "#00ff88",
                    fontWeight: "bold",                                        
                  }}
                >
                  <strong>DNA ID:</strong>
                  {certificateArt.dna}
                </p>

                <p
                  style={{
                    wordBreak: "break-all",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  <strong>Hash:</strong>{" "}
                  {certificateArt.hash}
                </p>
                
                <p>
                  <strong>Authenticity Score:</strong>
                  {" "}
                  {certificateArt.score ?? "Not Available"}%
                </p>

                <p>
                  <strong>Created At:</strong>
                  {" "}
                  {new Date(
                    certificateArt.createdAt
                  ).toLocaleString()}
                </p>

                <p>
                  <strong>Verified At:</strong>
                  {" "}
                  {certificateArt.verifiedAt || "Not Verified"}
                </p>

                <p
                  style={{
                    color:
                      certificateArt.status === "AUTHENTIC"
                        ? "#00ff88"
                        : "#f97316",
                    fontWeight: "bold",
                  }}
                >
                  {certificateArt.status || "NOT VERIFIED"}
                </p>

                <h3
                  style={{
                    marginTop: "25px",
                    color: "#00ff88",
                    textAlign: "center",
                  }}
                >
                  RitualArtDNA Certificate
                </h3>

                <div
                  style={{
                    marginTop: "30px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <hr
                    style={{
                      margin: "25px 0",
                      border: "1px solid #1e293b",
                    }}
                  />

                  <QRCodeCanvas
                    size={180}
                    value={`
                  Artwork ID: ${certificateArt.id}
                  DNA ID: ${certificateArt.dna}
                  Title: ${certificateArt.title}
                  Artist: ${certificateArt.artist}
                  Score: ${certificateArt.score}
                  Status: ${certificateArt.status}
                  Registry:
                  https://ritualartdna.io/verify/${certificateArt.dna}
                  `}
                  />

                  <p
                    style={{
                      marginTop: "15px",
                      color: "#94a3b8",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    Verified by Ritual Infrastructure
                  </p>

                  <button
                    onClick={downloadCertificate}
                    style={{
                      marginTop: "25px",
                      background: "#00ff88",
                      color: "#000",
                      border: "none",
                      padding: "14px 24px",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Download Certificate
                  </button>

                  <p
                    style={{
                      marginTop: "10px",
                      fontSize: "11px",
                      color: "#94a3b8",
                      wordBreak: "break-all",
                    }}
                  >
                      ritualartdna.io/verify/
                      {certificateArt.dna}
                  </p>
                </div>

              </div>
            )}

        </div>
      </div>

      {/* VERIFICATION HISTORY */}

      {selectedArtwork && (
        <div
          style={{
            maxWidth: "1400px",
            margin: "40px auto",
            background: "#111827",
            border: "1px solid #00ff88",
            borderRadius: "20px",
            padding: "30px",
          }}
        >
          <h2
            style={{
              color: "#00ff88",
              marginBottom: "20px",
            }}
          >
            Registry Explorer
          </h2>

          <p>
            DNA ID
            {" "}
            {selectedArtwork.dna}
          </p>

          <p
            style={{
              wordBreak: "break-all",
              color: "#94a3b8",
            }}
          >
            Hash:
            {" "}
            {selectedArtwork.hash}
          </p>

          <p>
            Artwork:
            {" "}
            {selectedArtwork.title}
          </p>

          <p>
            Artist:
            {" "}
            {selectedArtwork.artist}
          </p>

          <p>
            Created:
            {" "}
            {new Date(
              selectedArtwork.createdAt
            ).toLocaleString()}
          </p>

          <hr
            style={{
              margin: "20px 0",
              borderColor: "#1e293b",
            }}
          />

          <p
            style={{
              wordBreak: "break-all",
            }}
          >
            Owner:
            {" "}
            {selectedArtwork.ownerWallet ||
              "Not Available"}
          </p>

          <p>
            Score:
            {" "}
            {explorerRecord?.score
              ? `${explorerRecord.score}%`
              : "Not Verified"}
          </p>

          <p>
            Status:
            {" "}
            {explorerRecord?.status ||
              "Not Verified"}
          </p>

          <p>
            Verified At:
            {" "}
            {explorerRecord?.time ||
              "Not Available"}
          </p>
        </div>
      )}

      <div
        style={{
          maxWidth: "1400px",
          margin: "40px auto",
        }}
      >
        <h2
          style={{
            color: "#00ff88",
            marginBottom: "20px",
          }}
        >
          Verification History
        </h2>

        {history.length === 0 ? (
          <div
            style={{
              background: "#111827",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            No verification history yet.
          </div>
        ) : (
          history.map((item, index) => (
            <div
              key={index}
              style={{
                background: "#111827",
                padding: "20px",
                marginBottom: "12px",
                borderRadius: "12px",
                border: "1px solid #1e293b",
              }}
            >
              <p>
                <strong>DNA:</strong>{" "}
                {item.dna}
              </p>

              <p>
                <strong>Owner:</strong>{" "}
                {item.wallet}
              </p>

              <p>
                <strong>Artwork:</strong>{" "}
                {item.title}
              </p>

              <p>
                <strong>Score:</strong>{" "}
                {item.score}%
              </p>

              <p
                style={{
                  color:
                    item.status ===
                    "AUTHENTIC"
                      ? "#00ff88"
                      : "#f97316",
                  fontWeight: "bold",
                }}
              >
                {item.status}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {item.time}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default App;