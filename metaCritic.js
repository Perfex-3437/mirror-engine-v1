export function metaEvaluate(threat, nodes) {
  if (threat > 0.6) {
    nodes.forEach(n => {
      if (n.type === "observer" && Math.random() < 0.2) {
        n.type = "defender";
      }
    });
  }
}