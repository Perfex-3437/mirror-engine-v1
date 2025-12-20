export function agentStep(nodes, links) {
  nodes.forEach(n => {
    if (n.type === "attacker") {
      n.uncertainty = Math.min(1, n.uncertainty + Math.random() * 0.08);
    }
    if (n.type === "defender") {
      n.uncertainty = Math.max(0, n.uncertainty - Math.random() * 0.06);
    }
  });

  links.forEach(l => {
    const flow = l.source.uncertainty * 0.05;
    l.target.uncertainty = Math.min(1, l.target.uncertainty + flow);
  });
}