import { useEffect, useState, useRef } from "react";
import graphData from "../lib/graph-data.json";

interface TopicMeta {
  id: string;
  title: string;
  category: string;
  difficulty: string;
}

const topicMap = new Map<string, TopicMeta>(
  graphData.nodes.map((n) => [n.id, n]),
);

export default function HoverPreview() {
  const [preview, setPreview] = useState<TopicMeta | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<number>(0);

  useEffect(() => {
    function handleMouseEnter(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest<HTMLAnchorElement>("a.wikilink[data-slug]");
      if (!link) return;
      const slug = link.dataset.slug!;
      const meta = topicMap.get(slug);
      if (!meta) return;
      window.clearTimeout(timeoutRef.current);
      const rect = link.getBoundingClientRect();
      setPos({ x: rect.left, y: rect.bottom + 8 });
      setPreview(meta);
    }

    function handleMouseLeave(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("a.wikilink[data-slug]")) {
        timeoutRef.current = window.setTimeout(() => setPreview(null), 200);
      }
    }

    document.addEventListener("mouseover", handleMouseEnter);
    document.addEventListener("mouseout", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseover", handleMouseEnter);
      document.removeEventListener("mouseout", handleMouseLeave);
    };
  }, []);

  if (!preview) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 50,
        background: "#161b25",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        padding: "0.75rem 1rem",
        maxWidth: "260px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        pointerEvents: "none",
      }}
      role="tooltip"
    >
      <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#f4f5f7" }}>
        {preview.title}
      </p>
      <p style={{ margin: "0.3rem 0 0", fontSize: "0.7rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {preview.category.replace(/-/g, " ")} &middot; {preview.difficulty}
      </p>
    </div>
  );
}
