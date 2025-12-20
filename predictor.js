export function predictThreat(nodes, links) {
  const avg =
    nodes.reduce((s, n) => s + n.uncertainty, 0) / Math.max(1, nodes.length);
  const density = links.length / Math.max(1, nodes.length);

  return Math.min(1, avg * 0.6 + density * 0.4);
}
