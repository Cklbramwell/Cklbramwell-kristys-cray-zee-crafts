import { EDITOR_FONTS } from "../core/editorConfig";

export default function ElementInspector({ element, onChange, onDelete }) {
  if (!element) {
    return <div className="editor-inspector-empty">Select a text or image layer to edit it.</div>;
  }

  return (
    <div className="editor-inspector">
      <div className="row space">
        <h4>{element.type === "text" ? "Text Layer" : "Artwork Layer"}</h4>
        <button className="text-button danger-text" onClick={onDelete}>Delete</button>
      </div>

      {element.type === "text" && (
        <>
          <label className="field">
            <span>Text</span>
            <textarea value={element.text || ""} onChange={(e) => onChange({ text: e.target.value })} />
          </label>

          <label className="field">
            <span>Font</span>
            <select value={element.fontFamily || "Arial"} onChange={(e) => onChange({ fontFamily: e.target.value })}>
              {EDITOR_FONTS.map((font) => <option key={font}>{font}</option>)}
            </select>
          </label>

          <label className="field">
            <span>Text Color</span>
            <input type="color" value={element.color || "#111111"} onChange={(e) => onChange({ color: e.target.value })} />
          </label>

          <label className="field">
            <span>Font Size</span>
            <input type="range" min="18" max="120" value={element.fontSize || 48}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })} />
          </label>
        </>
      )}

      <label className="field">
        <span>Width</span>
        <input type="range" min="10" max="90" value={Math.round((element.width || 0.3) * 100)}
          onChange={(e) => onChange({ width: Number(e.target.value) / 100 })} />
      </label>

      <label className="field">
        <span>Height</span>
        <input type="range" min="8" max="90" value={Math.round((element.height || 0.2) * 100)}
          onChange={(e) => onChange({ height: Number(e.target.value) / 100 })} />
      </label>

      <label className="field">
        <span>Rotate</span>
        <input type="range" min="-180" max="180" value={element.rotation || 0}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })} />
      </label>

      <label className="field">
        <span>Scale</span>
        <input type="range" min="50" max="180" value={Math.round((element.scale || 1) * 100)}
          onChange={(e) => onChange({ scale: Number(e.target.value) / 100 })} />
      </label>
    </div>
  );
}
