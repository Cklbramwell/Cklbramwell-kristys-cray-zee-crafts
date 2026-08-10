export default function EditorShell({
  title = "Design Studio",
  toolbar,
  sidebar,
  canvas,
  footer,
}) {
  return (
    <section className="editor-shell">
      <header className="editor-shell-header">
        <div>
          <div className="eyebrow">V8 Design Studio Foundation</div>
          <h2>{title}</h2>
        </div>
        <div className="editor-toolbar">{toolbar}</div>
      </header>

      <div className="editor-shell-grid">
        <aside className="editor-sidebar">{sidebar}</aside>
        <main className="editor-canvas-shell">{canvas}</main>
      </div>

      {footer && <footer className="editor-footer">{footer}</footer>}
    </section>
  );
}
