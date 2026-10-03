export default function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  res.status(200).json({
    ok: true,
    configured: false,
    message: "Persistent server storage is available only on the Oracle Node server."
  });
}
