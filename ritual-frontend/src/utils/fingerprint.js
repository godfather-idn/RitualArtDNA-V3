import SHA256 from "crypto-js/sha256";

export const generateFingerprint = (
  imageData
) => {
  const hash =
    SHA256(imageData).toString();

  return {
    hash,

    dnaId:
      "ART-" +
      hash
        .slice(0, 12)
        .toUpperCase(),
  };
};