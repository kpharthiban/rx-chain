export default function formatRxId(id) {
  return `RX-${String(Number(id)).padStart(3, "0")}`;
}
