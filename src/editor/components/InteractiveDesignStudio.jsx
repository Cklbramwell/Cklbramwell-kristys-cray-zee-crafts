import { useEffect, useMemo, useState } from "react";
import EditorShell from "./EditorShell";
import SurfaceTabs from "./SurfaceTabs";
import DesignCanvas from "./DesignCanvas";
import ElementInspector from "./ElementInspector";
import { addImageElement, addTextElement, createEmptyDesign, removeElement, updateElement } from "../core/editorState";
import { EDITOR_PRODUCT_MODES } from "../core/editorConfig";
import { uploadOrderFile } from "../../services/uploads";
import { loadOrderDesign, saveOrderDesign } from "../../services/designs";

export default function InteractiveDesignStudio({ order, user, family = "apparel", notify }) {
  const mode = EDITOR_PRODUCT_MODES[family] || EDITOR_PRODUCT_MODES.apparel;
  const [design, setDesign] = useState(() => createEmptyDesign({
    productId: order?.items?.[0]?.productId || "",
    family,
  }));
  const [surface, setSurface] = useState(mode.defaultSurface);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await loadOrderDesign(order.id);
        if (active && saved) {
          setDesign(saved);
          setSurface(saved.activeSurface || mode.defaultSurface);
        }
      } catch {}
      finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [order.id, mode.defaultSurface]);

  const elements = design?.surfaces?.[surface] || [];
  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedId) || null,
    [elements, selectedId]
  );

  const changeSurface = (next) => {
    setSurface(next);
    setSelectedId(null);
    setDesign((current) => ({ ...current, activeSurface: next, updatedAt: new Date().toISOString() }));
  };

  const addText = () => setDesign((current) => addTextElement(current, surface, "Your Text"));

  const addArtwork = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const uploaded = await uploadOrderFile({
        userId: user.uid,
        orderId: order.id,
        file,
        kind: "design-studio-artwork",
      });
      setDesign((current) => addImageElement(current, surface, uploaded));
      notify("Artwork added to design");
    } catch (error) {
      notify(error.message || "Unable to add artwork.");
    } finally {
      setUploading(false);
    }
  };

  const updateSelected = (patch) => {
    if (!selectedId) return;
    setDesign((current) => updateElement(current, surface, selectedId, patch));
  };

  const moveElement = (elementId, point) => {
    setDesign((current) => updateElement(current, surface, elementId, point));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setDesign((current) => removeElement(current, surface, selectedId));
    setSelectedId(null);
  };

  const save = async () => {
    try {
      setSaving(true);
      await saveOrderDesign(order.id, {
        ...design,
        activeSurface: surface,
        updatedAt: new Date().toISOString(),
      });
      notify("Design saved");
    } catch (error) {
      notify(error.message || "Unable to save design.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card">Loading design studio...</div>;

  return (
    <EditorShell
      title={`${mode.label} Design Studio`}
      toolbar={<SurfaceTabs surfaces={mode.surfaces} active={surface} onChange={changeSurface} />}
      sidebar={
        <div className="editor-tool-panel">
          <button className="btn primary" onClick={addText}>+ Add Text</button>
          <label className="btn secondary editor-upload-button">
            {uploading ? "Uploading..." : "+ Add Artwork"}
            <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" disabled={uploading}
              onChange={(e) => addArtwork(e.target.files?.[0])} />
          </label>
          <div className="editor-help">
            <b>How to use</b>
            <span>Drag layers directly on the design area.</span>
            <span>Select a layer to resize, rotate, change text or delete it.</span>
          </div>
          <ElementInspector element={selectedElement} onChange={updateSelected} onDelete={deleteSelected} />
        </div>
      }
      canvas={
        <DesignCanvas
          design={design}
          surface={surface}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={moveElement}
        />
      }
      footer={
        <div className="row space">
          <span className="muted">Saved designs stay connected to order {order.orderNumber || order.id}.</span>
          <button className="btn primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Design"}
          </button>
        </div>
      }
    />
  );
}
