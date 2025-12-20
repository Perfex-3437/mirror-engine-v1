import { agentStep } from "./behavior.js";
import { predictThreat } from "./predictor.js";
import { metaEvaluate } from "./metaCritic.js";

const svg = d3.select("#graph");
const width = window.innerWidth;
const height = window.innerHeight * 0.75;

svg.attr("viewBox", `0 0 ${width} ${height}`);

let nodes = [];
let links = [];

const gLinks = svg.append("g");
const gNodes = svg.append("g");

const sim = d3.forceSimulation(nodes)
  .force("charge", d3.forceManyBody().strength(-200))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("link", d3.forceLink(links).distance(120))
  .on("tick", tick);

function addNode(type = "observer") {
  const node = {
    id: crypto.randomUUID(),
    type,
    uncertainty: Math.random() * 0.3
  };
  nodes.push(node);

  if (nodes.length > 1) {
    links.push({
      source: node,
      target: nodes[Math.floor(Math.random() * (nodes.length - 1))],
      weight: Math.random()
    });
  }
}

function tick() {
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
  edges.enter().append("line")
    .attr("class", "edge")
    .merge(edges)
    .attr("stroke-opacity", d => (d.source.uncertainty + d.target.uncertainty) / 2)
    .attr("stroke", "#aaa");
  edges.exit().remove();

  const nodesSel = gNodes.selectAll("circle").data(nodes, d => d.id);
  nodesSel.enter().append("circle")
    .attr("r", 18)
    .attr("class", "node")
    .merge(nodesSel)
    .attr("fill", d =>
      d.type === "attacker"
        ? d3.interpolateReds(d.uncertainty)
        : d.type === "defender"
        ? d3.interpolateBlues(1 - d.uncertainty)
        : "#888"
    );
  nodesSel.exit().remove();

  sim.nodes(nodes);
  sim.force("link").links(links);
  sim.alpha(0.7).restart();

  updateStats();
}

function updateStats() {
  document.getElementById("nodeCount").textContent = nodes.length;
  document.getElementById("edgeCount").textContent = links.length;

  const avg = nodes.reduce((s, n) => s + n.uncertainty, 0) / Math.max(1, nodes.length);
  document.getElementById("uncertainty").textContent = avg.toFixed(2);
}

// --- Autonomous loop ---
setInterval(() => {
  if (Math.random() < 0.2) addNode(Math.random() < 0.5 ? "attacker" : "observer");

  agentStep(nodes, links);

  const threat = predictThreat(nodes, links);
  metaEvaluate(threat, nodes);

  render();
}, 1200);

// bootstrap
addNode("attacker");
addNode("defender");
addNode("observer");
render();