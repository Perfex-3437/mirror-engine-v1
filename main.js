import { applyBehavior } from "./behavior.js";
import { predictThreat } from "./predictor.js";
import { metaCritic } from "./metaCritic.js";

const svg = d3.select("#graph");
const width = window.innerWidth;
const height = window.innerHeight * 0.7;

svg.attr("viewBox", `0 0 ${width} ${height}`);

let nodes = [];
let links = [];

const gLinks = svg.append("g");
const gNodes = svg.append("g");

const simulation = d3.forceSimulation(nodes)
  .force("charge", d3.forceManyBody().strength(-200))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("link", d3.forceLink(links).distance(120))
  .on("tick", ticked);

function ticked() {
  gLinks.selectAll("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  gNodes.selectAll("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
}

function render() {
  const edges = gLinks.selectAll("line").data(links);
  edges.enter().append("line").attr("class", "edge").merge(edges)
    .attr("stroke-opacity", d =>
      Math.min(1, (d.source.uncertainty + d.target.uncertainty) / 2)
    );
  edges.exit().remove();

  const nodeSel = gNodes.selectAll("circle").data(nodes, d => d.id);
  nodeSel.enter().append("circle")
    .attr("r", 16)
    .attr("class", "node")
    .merge(nodeSel)
    .attr("fill", d => {
      if (d.type === "attacker") return d3.interpolateReds(d.uncertainty);
      if (d.type === "defender") return d3.interpolateBlues(1 - d.uncertainty);
      return d3.interpolateGreys(d.uncertainty);
    });
  nodeSel.exit().remove();

  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(0.6).restart();

  // Update status
  document.getElementById("nodeCount").textContent = nodes.length;
  document.getElementById("edgeCount").textContent = links.length;
}

function step() {
  applyBehavior(nodes);

  links.forEach(l => {
    l.target.uncertainty = Math.min(
      1,
      l.target.uncertainty + l.source.uncertainty * 0.05
    );
  });

  const threat = predictThreat(nodes, links);
  metaCritic(threat, nodes);

  document.getElementById("threatLevel").textContent = threat.toFixed(2);
  document.getElementById("prediction").textContent =
    threat > 0.6 ? "Escalation" : "Low";

  render();
}

// --- Interaction Wiring ---

let paused = false;

// Step once
document.getElementById("stepSim").onclick = () => {
  step();
};

// Pause / resume
document.getElementById("pauseSim").onclick = () => {
  paused = !paused;
};

// Run multiple steps quickly
document.getElementById("runScenario").onclick = () => {
  for (let i = 0; i < 6; i++) step();
};

// Trigger a probe (random node)
document.getElementById("triggerProbe").onclick = () => {
  if (nodes.length === 0) return;
  const target = nodes[Math.floor(Math.random() * nodes.length)];
  target.uncertainty = Math.min(1, target.uncertainty + 0.3);
  step();
};

// Add node on space / click (UX)
svg.on("click", () => {
  const newNode = {
    id: crypto.randomUUID(),
    type: Math.random() < 0.5 ? "attacker" : "observer",
    uncertainty: Math.random() * 0.2
  };
  nodes.push(newNode);

  if (nodes.length > 1) {
    links.push({
      source: newNode,
      target: nodes[Math.floor(Math.random() * (nodes.length - 1))]
    });
  }
  render();
});

// Autonomous loop
setInterval(() => {
  if (!paused) step();
}, 1500);

// Bootstrap with a few nodes
addNode("attacker");
addNode("defender");
addNode("observer");
render();

function addNode(type) {
  const node = {
    id: crypto.randomUUID(),
    type,
    uncertainty: Math.random() * 0.3
  };
  nodes.push(node);

  if (nodes.length > 1) {
    links.push({
      source: node,
      target: nodes[Math.floor(Math.random() * (nodes.length - 1))]
    });
  }
}
