export default function Header({ user, isAdmin, cartCount, navigate }) {
  return (
    <header>
      <button className="brand brand-button" onClick={() => navigate("home")}>
        <img src="/assets/kristys-logo.png" alt="Kristy's Cray-Zee Crafts" />
        <span>Kristy's Cray-Zee Crafts</span>
      </button>

      <nav className="nav">
        <button onClick={() => navigate("shop")}>Shop</button>
        <button onClick={() => navigate("custom")}>Custom Order</button>
        <button onClick={() => navigate("rewards")}>Rewards</button>
        <button onClick={() => navigate("orders")}>Orders</button>
        {isAdmin && <button onClick={() => navigate("admin")}>Admin</button>}
        <button onClick={() => navigate("account")}>{user ? "Account" : "Sign In"}</button>
        <button onClick={() => navigate("cart")}>
          Cart <span className="badge">{cartCount}</span>
        </button>
      </nav>
    </header>
  );
}
