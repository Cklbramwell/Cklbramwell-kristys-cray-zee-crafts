export default function CategoryCard({ category, onOpen }) {
  return (
    <button className="category-card" onClick={() => onOpen(category.id)}>
      <span className="category-icon">{category.emoji}</span>
      <span>
        <b>{category.name}</b>
        <small>{category.description}</small>
      </span>
      <span className="category-arrow">→</span>
    </button>
  );
}
