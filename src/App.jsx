import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import Header from "./components/Header";
import ProductBuilder from "./components/ProductBuilder";
import CartView from "./components/CartView";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import Rewards from "./pages/Rewards";
import CustomOrder from "./pages/CustomOrder";
import Admin from "./pages/Admin";
import { auth, db } from "./firebase";
import { productPrice } from "./utils";

const FALLBACK_PRODUCTS = [
  {
    id: "shirt",
    name: "Custom T-Shirt",
    category: "T-Shirts",
    price: 2500,
    salePrice: 0,
    emoji: "👕",
    description: "Personalized shirt with your wording, colors, or graphic.",
    active: true,
    featured: true,
    colors: "Black, White, Red, Royal Blue, Navy, Pink, Purple, Heather Gray",
    sizes: "S, M, L, XL, 2XL, 3XL, 4XL, 5XL",
  },
  {
    id: "tumbler",
    name: "20 oz Custom Tumbler",
    category: "Tumblers",
    price: 3000,
    salePrice: 0,
    emoji: "🥤",
    description: "Personalized 20 oz tumbler.",
    active: true,
    featured: true,
    colors: "Custom",
    sizes: "20 oz",
  },
  {
    id: "graphic",
    name: "Custom Graphic Design",
    category: "Graphics",
    price: 2000,
    salePrice: 0,
    emoji: "🖥️",
    description: "Custom digital artwork for your project.",
    active: true,
    featured: false,
    colors: "Custom",
    sizes: "Digital",
  },
];

export default function App() {
  const [route, setRoute] = useState("home");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminTab, setAdminTab] = useState("dashboard");
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [designProductId, setDesignProductId] = useState(null);
  const [message, setMessage] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kcc_v6_cart") || "[]");
    } catch {
      return [];
    }
  });

  const allProducts = products.length ? products : FALLBACK_PRODUCTS;
  const liveProducts = allProducts.filter((product) => product.active !== false);

  useEffect(() => {
    localStorage.setItem("kcc_v6_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const timer = message ? setTimeout(() => setMessage(""), 2600) : null;
    return () => timer && clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");

    if (checkout === "success") {
      setCart([]);
      setMessage("Payment successful! Your order is being processed.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (checkout === "cancel") {
      setMessage("Checkout canceled. Your cart is still saved.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(
    () =>
      onSnapshot(
        collection(db, "products"),
        (snapshot) =>
          setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
        () => {}
      ),
    []
  );

  useEffect(
    () =>
      onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);
        setProfile(null);

        if (!nextUser) return;

        const snapshot = await getDoc(doc(db, "users", nextUser.uid));
        setProfile(snapshot.exists() ? snapshot.data() : null);
      }),
    []
  );

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    return onSnapshot(
      query(collection(db, "orders"), where("userId", "==", user.uid)),
      (snapshot) =>
        setOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
    );
  }, [user]);

  useEffect(() => {
    if (profile?.role !== "admin") {
      setAdminOrders([]);
      setRequests([]);
      setUsers([]);
      return;
    }

    const stops = [
      onSnapshot(collection(db, "orders"), (snapshot) =>
        setAdminOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      ),
      onSnapshot(collection(db, "customRequests"), (snapshot) =>
        setRequests(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      ),
      onSnapshot(collection(db, "users"), (snapshot) =>
        setUsers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      ),
    ];

    return () => stops.forEach((stop) => stop());
  }, [profile]);

  const notify = (text) => setMessage(text);

  const navigate = (nextRoute) => {
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openBuilder = (id) => {
    setDesignProductId(id);
    navigate("design");
  };

  const addConfigured = (product, options, qty) => {
    setCart((current) => [
      ...current,
      {
        id: product.id,
        qty: Math.max(1, Number(qty) || 1),
        lineKey: `${product.id}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        options,
      },
    ]);
    notify(`${product.name} added to cart`);
    navigate("cart");
  };

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const product = allProducts.find((item) => item.id === line.id);
        if (!product) return sum;

        return (
          sum +
          (line.options?.calculatedLineTotal != null
            ? Number(line.options.calculatedLineTotal)
            : productPrice(product) * line.qty)
        );
      }, 0),
    [cart, allProducts]
  );

  const beginCheckout = async () => {
    if (!cart.length) return notify("Your cart is empty.");

    if (!user) {
      notify("Please sign in before checkout so your order is saved to your account.");
      navigate("account");
      return;
    }

    setCheckoutLoading(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          items: cart.map(({ id, qty, lineKey, options }) => ({
            id,
            qty,
            lineKey: lineKey || "",
            options: options || null,
          })),
        }),
      });

      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {}

      if (!response.ok) {
        throw new Error(data.error || text || "Unable to start checkout.");
      }

      if (!data.url) throw new Error("Stripe did not return a checkout URL.");

      window.location.assign(data.url);
    } catch (error) {
      notify(error.message || "Unable to start checkout.");
      setCheckoutLoading(false);
    }
  };

  const page = (() => {
    switch (route) {
      case "shop":
        return (
          <Shop
            products={liveProducts}
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            sort={sort}
            setSort={setSort}
            onCustomize={openBuilder}
          />
        );

      case "design":
        return (
          <ProductBuilder
            product={allProducts.find((item) => item.id === designProductId)}
            onAdd={addConfigured}
            onBack={() => navigate("shop")}
          />
        );

      case "account":
        return (
          <Account
            user={user}
            profile={profile}
            orders={orders}
            notify={notify}
          />
        );

      case "orders":
        return <Orders user={user} orders={orders} />;

      case "rewards":
        return <Rewards user={user} profile={profile} />;

      case "custom":
        return <CustomOrder user={user} notify={notify} />;

      case "cart":
        return (
          <CartView
            cart={cart}
            products={allProducts}
            subtotal={subtotal}
            checkoutLoading={checkoutLoading}
            onQuantityChange={(index, qty) =>
              setCart((current) =>
                current.map((line, lineIndex) =>
                  lineIndex === index
                    ? {
                        ...line,
                        qty,
                        options: line.options
                          ? {
                              ...line.options,
                              calculatedLineTotal:
                                Number(line.options.calculatedUnitPrice || 0) * qty +
                                Number(line.options.oneTimeAddOns || 0),
                            }
                          : line.options,
                      }
                    : line
                )
              )
            }
            onRemove={(index) =>
              setCart((current) =>
                current.filter((_, lineIndex) => lineIndex !== index)
              )
            }
            onCheckout={beginCheckout}
          />
        );

      case "admin":
        return (
          <Admin
            profile={profile}
            user={user}
            products={products}
            users={users}
            requests={requests}
            orders={adminOrders}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            editing={editing}
            setEditing={setEditing}
            notify={notify}
          />
        );

      default:
        return (
          <Home
            products={liveProducts}
            navigate={navigate}
            onCustomize={openBuilder}
          />
        );
    }
  })();

  return (
    <>
      <Header
        user={user}
        isAdmin={profile?.role === "admin"}
        cartCount={cart.reduce((sum, line) => sum + Number(line.qty || 0), 0)}
        navigate={navigate}
      />

      <main>{page}</main>

      <footer>
        <img src="/assets/kristys-logo.png" alt="" />
        <div>
          <b>Kristy's Cray-Zee Crafts</b>
          <div>Made with creativity. Crafted with care.</div>
        </div>
      </footer>

      {message && <div className="toast">{message}</div>}
    </>
  );
}
