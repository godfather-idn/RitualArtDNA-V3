export const verifyWithRitual =
  async (artwork) => {

    console.log(
      "Sending artwork to backend..."
    );

    const response =
      await fetch(
        "http://localhost:5000/api/ritual/verify",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            artwork
          ),
        }
      );

    return response.json();
};