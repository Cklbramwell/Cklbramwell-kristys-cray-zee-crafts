import { useEffect, useMemo, useState } from "react";
import { loadOrderDesign } from "../../services/designs";
import { getExportSpec } from "../core/exportConfig";
import {
  exportDesignManifest,
  exportSurfacePng,
} from "../utils/exportDesign";

const LABELS = {
  front: "Front",
  back: "Back",
  leftSleeve: "Left Sleeve",
  rightSleeve: "Right Sleeve",
  wrap: "Full Wrap",
  engraving: "Engraving",
};

export default function ProductionExportPanel({
  order,
  notify,
}) {
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const saved = await loadOrderDesign(order.id);
        if (active) setDesign(saved);
      } catch {
        if (active) setDesign(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [order.id]);

  const surfaces = useMemo(() => {
    if (!design?.surfaces) return [];

    return Object.entries(design.surfaces)
      .filter(([, elements]) => Array.isArray(elements) && elements.length > 0)
      .map(([surface, elements]) => ({
        surface,
        elements,
        spec: getExportSpec(surface),
      }));
  }, [design]);

  const exportSurface = async (surface) => {
    try {
      setExporting(surface);

      const result = await exportSurfacePng({
        design,
        surface,
        orderNumber: order.orderNumber || order.id,
      });

      notify(
        `Exported ${LABELS[surface] || surface} at ${result.width}×${result.height}px`
      );
    } catch (error) {
      notify(error.message || "Unable to export production file.");
    } finally {
      setExporting("");
    }
  };

  if (loading) {
    return <div className="production-export-panel muted">Loading saved design...</div>;
  }

  if (!design) {
    return (
      <div className="production-export-panel">
        <h4>Production Export</h4>
        <p className="muted">
          No Interactive Design Studio file has been saved for this order yet.
        </p>
      </div>
    );
  }

  return (
    <section className="production-export-panel">
      <div className="row space">
        <div>
          <h4>Production Export</h4>
          <p className="muted">
            High-resolution transparent PNG files from the customer's saved design.
          </p>
        </div>

        <button
          className="btn secondary"
          onClick={() => {
            exportDesignManifest({
              design,
              orderNumber: order.orderNumber || order.id,
            });
            notify("Design manifest exported");
          }}
        >
          Export Design JSON
        </button>
      </div>

      {surfaces.length ? (
        <div className="production-export-grid">
          {surfaces.map(({ surface, elements, spec }) => (
            <article className="production-export-card" key={surface}>
              <div>
                <span className="tag">{LABELS[surface] || surface}</span>
                <h5>{spec.label}</h5>
                <small>
                  {spec.width} × {spec.height}px • {spec.dpi} DPI target
                </small>
                <small>
                  {elements.length} layer{elements.length === 1 ? "" : "s"}
                </small>
              </div>

              <button
                className="btn primary"
                disabled={Boolean(exporting)}
                onClick={() => exportSurface(surface)}
              >
                {exporting === surface ? "Rendering..." : "Export Transparent PNG"}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">
          The saved design does not contain any layers yet.
        </p>
      )}

      <div className="production-export-note">
        <b>Production note:</b>
        <span>
          The PNG export is transparent and high resolution. Confirm final physical print
          dimensions in your RIP/laser software before production.
        </span>
      </div>
    </section>
  );
}
