export const handler = async () => ({
  statusCode: 200,
  body: JSON.stringify({ env: { ...process.env }, now: new Date().toISOString() }),
});
