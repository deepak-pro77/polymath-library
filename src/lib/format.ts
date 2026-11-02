export function formatYear(y: number) {
  return y < 0 ? `c. ${Math.abs(y)} BC` : y < 1000 ? `c. ${y} AD` : String(y);
}
