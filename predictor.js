export function predictThreat(nodes, links) {
  const density = links.length / Math.max(1, nodes.length);
  const avgUncertainty =
    nodes.reduce((s, n) => s + n.uncertainty, 0) / Math.max(1, nodes.length);

  return Math.min(1, density * 0.5 + avgUncertainty * 0.5);
}