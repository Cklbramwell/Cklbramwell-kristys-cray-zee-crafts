import { useMemo, useRef, useState } from "react";
import { normalizePoint } from "../utils/normalizePoint";

export default function DesignCanvas({ design, surface, selectedId, onSelect, onMove }) {
  const ref = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const elements = useMemo(() => design?.surfaces?.[surface] || [], [design, surface]);

  const pointerMove = (event) => {
    if (!draggingId || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    onMove(draggingId, normalizePoint(event.clientX, event.clientY, rect));
  };

  return (
    <div
      ref={ref}
      className={`design-canvas design-surface-${surface}`}
      onPointerMove={pointerMove}
      onPointerUp={() => setDraggingId(null)}
      onPointerLeave={() => setDraggingId(null)}
    >
      <div className="design-safe-area">
        {elements.map((element) => (
          <div
            key={element.id}
            className={`design-element ${element.type} ${selectedId === element.id ? "selected" : ""}`}
            style={{
              left: `${(element.x || 0.5) * 100}%`,
              top: `${(element.y || 0.5) * 100}%`,
              width: `${(element.width || 0.3) * 100}%`,
              height: `${(element.height || 0.2) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg) scale(${element.scale || 1})`,
              color: element.color || "#111",
              fontFamily: element.fontFamily || "Arial",
              fontSize: `${Math.max(12, Number(element.fontSize || 48) * 0.45)}px`,
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              onSelect(element.id);
              setDraggingId(element.id);
            }}
          >
            {element.type === "text" ? (
              <span>{element.text || "Text"}</span>
            ) : (
              <img src={element.src} alt={element.name || "Artwork"} />
            )}
          </div>
        ))}

        {!elements.length && (
          <div className="design-canvas-empty">
            <span>✨</span>
            <b>Start your design</b>
            <small>Add text or artwork from the left panel.</small>
          </div>
        )}
      </div>
    </div>
  );
}
