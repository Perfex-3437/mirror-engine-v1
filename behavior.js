export function applyBehavior(nodes) {
  nodes.forEach(node => {
    if (node.type === "attacker") {
      node.uncertainty = Math.min(1, node.uncertainty + Math.random() * 0.08);
    }

    if (node.type === "defender") {
      node.uncertainty = Math.max(0, node.uncertainty - Math.random() * 0.06);
    }
  });
}
