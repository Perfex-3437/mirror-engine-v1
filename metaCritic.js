export function metaCritic(threat, nodes) {
  if (threat > 0.65) {
    nodes.forEach(n => {
      if (n.type === "observer" && Math.random() < 0.25) {
        n.type = "defender";
      }
    });
  }
}
