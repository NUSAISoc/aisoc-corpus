import { useEffect, useRef, useState } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { drag } from "d3-drag";
import graphData from "../lib/graph-data.json";

interface GraphNode extends SimulationNodeDatum {
  id: string;
  title: string;
  category: string;
  difficulty: string;
}

interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  type: "prerequisite" | "similarity";
  weight?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "classical-ml": "#ccff00",
  "deep-learning": "#6366f1",
  generative: "#8b5cf6",
  "reinforcement-learning": "#f59e0b",
  "world-modelling": "#06b6d4",
};

type ViewMode = "all" | "prerequisite" | "similarity";

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  useEffect(() => {
    const svg = select(svgRef.current!);
    const width = svgRef.current!.clientWidth || 800;
    const height = svgRef.current!.clientHeight || 500;

    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom behavior
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoomBehavior).call(zoomBehavior.transform, zoomIdentity);

    // Filter edges by view mode
    const edges: GraphEdge[] = (graphData.edges as GraphEdge[]).filter(
      (e) => viewMode === "all" || e.type === viewMode,
    );

    const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));

    const simulation = forceSimulation(nodes)
      .force(
        "link",
        forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance(120),
      )
      .force("charge", forceManyBody().strength(-300))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide(40));

    // Edges
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d) => (d.type === "prerequisite" ? "rgba(204,255,0,0.4)" : "rgba(139,92,246,0.3)"))
      .attr("stroke-width", (d) => (d.type === "prerequisite" ? 2 : 1))
      .attr("stroke-dasharray", (d) => (d.type === "similarity" ? "4,4" : "none"));

    // Nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (_, d) => {
        window.location.href = `/topics/${d.id}`;
      });

    node
      .append("circle")
      .attr("r", 16)
      .attr("fill", (d) => CATEGORY_COLORS[d.category] || "#ccff00")
      .attr("opacity", 0.85)
      .attr("stroke", (d) => CATEGORY_COLORS[d.category] || "#ccff00")
      .attr("stroke-width", 2)
      .attr("filter", "drop-shadow(0 0 6px currentColor)");

    node
      .append("text")
      .text((d) => d.title)
      .attr("dy", 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#f4f5f7")
      .attr("font-size", "11px")
      .attr("font-family", "JetBrains Mono, monospace");

    // Drag behavior
    const dragBehavior = drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(dragBehavior);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [viewMode]);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {(["all", "prerequisite", "similarity"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "0.75rem",
              fontFamily: "JetBrains Mono, monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              background: viewMode === mode ? "rgba(204,255,0,0.15)" : "transparent",
              border: `1px solid ${viewMode === mode ? "#ccff00" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "6px",
              color: viewMode === mode ? "#ccff00" : "#a1a1aa",
              cursor: "pointer",
            }}
            aria-pressed={viewMode === mode}
          >
            {mode === "all" ? "All Edges" : mode === "prerequisite" ? "Learning Path" : "Semantic"}
          </button>
        ))}
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="500"
        style={{
          background: "rgba(10,10,12,0.6)",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        aria-label="Knowledge graph visualization"
        role="img"
      />
    </div>
  );
}
