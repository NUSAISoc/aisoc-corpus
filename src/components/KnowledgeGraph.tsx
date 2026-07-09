import { useEffect, useRef, useState } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceY,
  forceX,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { select, type Selection } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { drag } from "d3-drag";
import graphData from "../lib/graph-data.json";
import { CATEGORY_COLORS, TOPIC_CATEGORIES } from "../lib/categories";

interface GraphNode extends SimulationNodeDatum {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  depth?: number;
}

interface GraphDataEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  type: "prerequisite" | "similarity";
  weight?: number;
}

interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  type: "prerequisite" | "similarity";
  weight?: number;
}

type ViewMode = "all" | "prerequisite" | "similarity";

function endpointId(endpoint: string | GraphNode): string {
  return typeof endpoint === "string" ? endpoint : endpoint.id;
}

/** Split title into lines of roughly maxChars, breaking at word boundaries. */
function wrapText(title: string, maxChars: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    if (cur && cur.length + 1 + word.length > maxChars) {
      lines.push(cur);
      cur = word;
    } else {
      cur = cur ? cur + " " + word : word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

const NODE_RADIUS = 16;
const MAX_LABEL_CHARS = 14;

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  useEffect(() => {
    const svg = select(svgRef.current!);
    const width = svgRef.current!.clientWidth || 800;
    const height = svgRef.current!.clientHeight || 500;

    svg.selectAll("*").remove();

    // Defs: arrowhead marker for prerequisite edges
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrow-prerequisite")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 10)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "rgba(204,255,0,0.7)");

    const g = svg.append("g");

    // Zoom behavior
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoomBehavior).call(zoomBehavior.transform, zoomIdentity);

    // Filter edges by view mode
    const edges: GraphEdge[] = (graphData.edges as GraphDataEdge[])
      .filter((edge) => viewMode === "all" || edge.type === viewMode)
      .map((edge) => ({
        source: endpointId(edge.source),
        target: endpointId(edge.target),
        type: edge.type,
        weight: edge.weight,
      }));

    const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));

    // Find max depth for vertical stratification
    const maxDepth = Math.max(...nodes.map((n) => n.depth || 0), 1);
    const verticalPadding = 60;
    const usableHeight = height - verticalPadding * 2;

    const simulation = forceSimulation(nodes)
      .force(
        "link",
        forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance((d) => (d.type === "prerequisite" ? 160 : 80))
          .strength((d) => (d.type === "prerequisite" ? 1 : 0)),
      )
      .force("charge", forceManyBody().strength(-700).distanceMax(600))
      .force("centerX", forceX(width / 2).strength(0.05))
      .force(
        "layerY",
        forceY<GraphNode>(
          (d) => verticalPadding + ((d.depth || 0) / maxDepth) * usableHeight,
        ).strength(0.8),
      )
      .force("collide", forceCollide(55));

    // Edges — use line but shorten endpoints to node radius for arrow placement
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d) =>
        d.type === "prerequisite"
          ? "rgba(204,255,0,0.4)"
          : "rgba(167,139,250,0.75)",
      )
      .attr("stroke-width", (d) => (d.type === "prerequisite" ? 2 : 2.25))
      .attr("stroke-dasharray", (d) =>
        d.type === "similarity" ? "5,5" : "none",
      )
      .attr("marker-end", (d) =>
        d.type === "prerequisite" ? "url(#arrow-prerequisite)" : null,
      );

    // Nodes
    const node: Selection<SVGGElement, GraphNode, SVGGElement, unknown> = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (_, d) => {
        window.location.href = `/topics/${d.id}`;
      });

    node
      .append("circle")
      .attr("r", NODE_RADIUS)
      .attr("fill", (d) => CATEGORY_COLORS[d.category] || "#ccff00")
      .attr("opacity", 0.85)
      .attr("stroke", (d) => CATEGORY_COLORS[d.category] || "#ccff00")
      .attr("stroke-width", 2)
      .attr("filter", "drop-shadow(0 0 6px currentColor)");

    // Multi-line text labels
    node.each(function (d) {
      const lines = wrapText(d.title, MAX_LABEL_CHARS);
      const textEl = select(this)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "#f4f5f7")
        .attr("font-size", "11px")
        .attr("font-family", "JetBrains Mono, monospace");

      const startDy = NODE_RADIUS + 12;
      lines.forEach((line, i) => {
        textEl
          .append("tspan")
          .attr("x", 0)
          .attr("dy", i === 0 ? startDy : 13)
          .text(line);
      });
    });

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
      // Shorten line endpoints by NODE_RADIUS so arrow sits at circle edge
      link
        .attr("x1", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          return d.source.x + (dx / len) * NODE_RADIUS;
        })
        .attr("y1", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          return d.source.y + (dy / len) * NODE_RADIUS;
        })
        .attr("x2", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          return d.target.x - (dx / len) * NODE_RADIUS;
        })
        .attr("y2", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          return d.target.y - (dy / len) * NODE_RADIUS;
        });
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [viewMode]);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        {(["all", "prerequisite", "similarity"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "0.75rem",
              fontFamily: "JetBrains Mono, monospace",
              textTransform: "uppercase",
              letterSpacing: 0,
              background:
                viewMode === mode ? "rgba(204,255,0,0.15)" : "transparent",
              border: `1px solid ${viewMode === mode ? "#ccff00" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "0",
              color: viewMode === mode ? "#ccff00" : "#a1a1aa",
              cursor: "pointer",
            }}
            aria-pressed={viewMode === mode}
          >
            {mode === "all"
              ? "All Edges"
              : mode === "prerequisite"
                ? "Learning Path"
                : "Semantic"}
          </button>
        ))}
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="500"
        style={{
          background: "rgba(10,10,12,0.6)",
          borderRadius: "0",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        aria-label="Knowledge graph visualization"
        role="img"
      />
      <div
        aria-label="Graph colour legend"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.55rem 0.9rem",
          marginTop: "0.9rem",
          color: "#a1a1aa",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.72rem",
        }}
      >
        {TOPIC_CATEGORIES.map((category) => (
          <span
            key={category.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              textTransform: "uppercase",
              letterSpacing: 0,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "0.6rem",
                height: "0.6rem",
                borderRadius: "0",
                background: category.color,
                boxShadow: `0 0 10px ${category.color}66`,
              }}
            />
            {category.label}
          </span>
        ))}
      </div>
      <details
        style={{
          marginTop: "0.9rem",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: "0.85rem",
          color: "#a1a1aa",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.78rem",
          lineHeight: 1.7,
        }}
      >
        <summary
          style={{
            color: "#cbd5f5",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: 0,
          }}
        >
          How was the graph created?
        </summary>
        <div style={{ marginTop: "0.75rem", maxWidth: "760px" }}>
          <p style={{ margin: "0 0 0.65rem" }}>
            Learning Path edges come from each topic's prerequisite list. If one
            topic names another topic as a prerequisite, the graph draws a
            directed relationship from the prerequisite to the topic that builds
            on it.
          </p>
          <p style={{ margin: 0 }}>
            Semantic edges are computed at build time with Jaccard similarity
            over each topic's domains and tags. The score is shared labels
            divided by all unique labels across the two topics; pairs at or
            above the configured threshold are shown as dashed semantic
            connections.
          </p>
        </div>
      </details>
    </div>
  );
}
