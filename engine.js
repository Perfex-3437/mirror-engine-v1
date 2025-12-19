const width = window.innerWidth;
const height = window.innerHeight * 0.7;
const svg = d3.select("#canvas");

// Groups for layers
const edgeGroup = svg.append("g");
const nodeGroup = svg.append("g");
const labelGroup = svg.append("g");

// Zoom & pan
svg.call(d3.zoom().scaleExtent([0.5, 3]).on("zoom", (event)=>{
  edgeGroup.attr("transform", event.transform);
  nodeGroup.attr("transform", event.transform);
  labelGroup.attr("transform", event.transform);
}));

let nodes = [];
let edges = [];
let selectedNode = null;
let globalUncertainty = 0.1;
const AGENT_TYPES = ["attacker","defender","observer"];

// Force simulation
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(edges).distance(120).id(d=>d.id))
  .force("charge", d3.forceManyBody().strength(-250))
  .force("center", d3.forceCenter(width/2, height/2))
  .on("tick", ticked);

// Reset button
document.getElementById("resetBtn").addEventListener("click", () => {
  nodes = [];
  edges = [];
  selectedNode = null;
  update();
});

// Node type popup
let pendingNodePos = null;
const popup = document.getElementById("nodeTypePopup");
popup.querySelectorAll("button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const role = btn.dataset.role;
    if(pendingNodePos) addNode(pendingNodePos[0], pendingNodePos[1], role);
    popup.style.display="none";
    pendingNodePos = null;
  });
});

// Add node
svg.on("click",(event)=>{
  const [x,y]=d3.pointer(event);
  pendingNodePos=[x,y];
  popup.style.display="block";
});

// Node creation function
function addNode(x,y,role){
  const node = {
    id: crypto.randomUUID(),
    x,y,
    role,
    uncertainty: Math.random()*0.3,
    aggressiveness: Math.random(),
    vigilance: Math.random()
  };
  nodes.push(node);
  update();
}

// Probe node
function probeNode(node){
  node.uncertainty=Math.min(1,node.uncertainty+0.15);
  propagateUncertainty(node);
  updateGlobalUncertainty();
}

// Uncertainty propagation
function propagateUncertainty(source){
  edges.forEach(edge=>{
    if(edge.source.id===source.id||edge.target.id===source.id){
      const other = edge.source.id===source.id?edge.target:edge.source;
      other.uncertainty=Math.min(1,other.uncertainty+source.uncertainty*0.1);
    }
  });
}

// Update global metric
function updateGlobalUncertainty(){
  if(!nodes.length) return;
  globalUncertainty = nodes.reduce((s,n)=>s+n.uncertainty,0)/nodes.length;
  document.getElementById("globalUncertainty").textContent = globalUncertainty.toFixed(2);
}

// Update render
function update(){
  // Edges
  const edge=edgeGroup.selectAll(".edge").data(edges);
  edge.enter().append("line").attr("class","edge").merge(edge)
      .attr("stroke-opacity",d=>((d.source.uncertainty+d.target.uncertainty)/2));
  edge.exit().remove();

  // Nodes
  const node=nodeGroup.selectAll(".node").data(nodes,d=>d.id);
  const nodeEnter=node.enter().append("circle")
      .attr("class","node")
      .attr("r",22)
      .call(d3.drag()
        .on("start",dragStart)
        .on("drag",dragging)
        .on("end",dragEnd))
      .on("click",(event,d)=>{
        event.stopPropagation();
        probeNode(d);
        if(selectedNode && selectedNode!==d){
          edges.push({source:selectedNode,target:d});
          selectedNode=null;
        } else {
          selectedNode=d;
        }
        update();
      });
  nodeEnter.merge(node)
      .attr("fill",d=>{
        if(d.role==="attacker") return d3.interpolateReds(d.uncertainty);
        if(d.role==="defender") return d3.interpolateBlues(d.vigilance);
        return "#888";
      })
      .classed("selected",d=>d===selectedNode);
  node.exit().remove();

  // Labels
  const labels = labelGroup.selectAll(".label").data(nodes,d=>d.id);
  labels.enter().append("text").attr("class","label").merge(labels)
    .text(d=>d.uncertainty.toFixed(2));
  labels.exit().remove();

  simulation.nodes(nodes);
  simulation.force("link").links(edges);
  simulation.alpha(0.8).restart();
}

// Tick
function ticked(){
  edgeGroup.selectAll(".edge")
    .attr("x1",d=>d.source.x).attr("y1",d=>d.source.y)
    .attr("x2",d=>d.target.x).attr("y2",d=>d.target.y);
  nodeGroup.selectAll(".node")
    .attr("cx",d=>d.x).attr("cy",d=>d.y);
  labelGroup.selectAll(".label")
    .attr("x",d=>d.x+24).attr("y",d=>d.y+6);
}

// Drag handlers
function dragStart(event,d){if(!event.active) simulation.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y;}
function dragging(event,d){d.fx=event.x; d.fy=event.y;}
function dragEnd(event,d){if(!event.active) simulation.alphaTarget(0); d.fx=null; d.fy=null;}

// Multi-agent autonomous behavior
function agentStep(){
  nodes.forEach(agent=>{
    if(agent.role==="attacker") attackerAction(agent);
    if(agent.role==="defender") defenderAction(agent);
    if(agent.role==="observer") observerAction(agent);
  });
  updateGlobalUncertainty();
  update();
}
setInterval(agentStep,1200);

function attackerAction(agent){
  edges.forEach(edge=>{
    if(edge.source.id===agent.id||edge.target.id===agent.id){
      const target=edge.source.id===agent.id?edge.target:edge.source;
      if(Math.random()<agent.aggressiveness) target.uncertainty=Math.min(1,target.uncertainty+0.08);
    }
  });
}

function defenderAction(agent){
  edges.forEach(edge=>{
    if(edge.source.id===agent.id||edge.target.id===agent.id){
      const target=edge.source.id===agent.id?edge.target:edge.source;
      if(Math.random()<agent.vigilance) target.uncertainty=Math.max(0,target.uncertainty-0.06);
    }
  });
}

function observerAction(agent){
  if(agent.uncertainty>0.7 && Math.random()<0.2) agent.role="defender";
  if(agent.uncertainty<0.2 && Math.random()<0.2) agent.role="attacker";
}
