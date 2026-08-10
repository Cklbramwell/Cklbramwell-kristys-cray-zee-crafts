const LABELS = {
  front: "Front",
  back: "Back",
  leftSleeve: "Left Sleeve",
  rightSleeve: "Right Sleeve",
  wrap: "Full Wrap",
  engraving: "Engraving Area",
};

export default function SurfaceTabs({ surfaces, active, onChange }) {
  return (
    <div className="editor-surface-tabs">
      {surfaces.map((surface) => (
        <button
          key={surface}
          className={active === surface ? "active" : ""}
          onClick={() => onChange(surface)}
          type="button"
        >
          {LABELS[surface] || surface}
        </button>
      ))}
    </div>
  );
}
