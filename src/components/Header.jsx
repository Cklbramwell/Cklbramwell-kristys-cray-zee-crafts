export default function Header({
  user,
  isAdmin,
  cartCount,
  navigate,
  onCategory,
}) {
  return (
    <header className="site-header">
      <button className="brand brand-button" onClick={() => navigate("home")}>
        <img src="/assets/kristys-logo.png" alt="Kristy's Cray-Zee Crafts" />
        <span>
          <b>Kristy's Cray-Zee Crafts</b>
          <small>Custom Creations • Made Your Way</small>
        </span>
      </button>

      <nav className="nav">
        <button onClick={() => navigate("home")}>Home</button>
        <button onClick={() => navigate("shop")}>Shop</button>
        <button onClick={() => onCategory("apparel")}>Apparel</button>
        <button onClick={() => onCategory("drinkware")}>Drinkware</button>
        <button onClick={() => onCategory("laser")}>Laser</button>
        <button onClick={() => navigate("inspiration")}>Inspiration</button>
        <button onClick={() => navigate("custom")}>Custom Order</button>
        {isAdmin && <button onClick={() => navigate("admin")}>Admin</button>}
        <button onClick={() => navigate("account")}>{user ? "Account" : "Sign In"}</button>
        <button className="cart-nav" onClick={() => navigate("cart")}>
          Cart <span className="badge">{cartCount}</span>
        </button>
      </nav>
    </header>
  );
}
