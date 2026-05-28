(async () => {
  try {
    const res = await fetch("http://localhost:3000/api/email/password-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@local.invalid" }),
    });
    console.log("status", res.status);
    console.log(await res.text());
  } catch (e) {
    console.error("fetch error", e.message);
  }
})();
