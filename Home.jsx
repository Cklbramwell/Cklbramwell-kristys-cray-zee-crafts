import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Account({ user, profile, orders, notify }) {
  if (user) {
    return (
      <section className="wrap">
        <div className="row space">
          <div>
            <div className="eyebrow">My account</div>
            <h2>{profile?.name || user.email}</h2>
          </div>
          <button className="btn secondary" onClick={() => signOut(auth)}>
            Sign Out
          </button>
        </div>

        <div className="metric-grid">
          <div className="metric">Orders<strong>{orders.length}</strong></div>
          <div className="metric">Punches<strong>{profile?.loyaltyPunches || 0}</strong></div>
          <div className="metric">Rewards<strong>{profile?.availableRewards || 0}</strong></div>
          <div className="metric">Role<strong className="role-value">{profile?.role || "customer"}</strong></div>
        </div>
      </section>
    );
  }

  return (
    <section className="wrap">
      <div className="grid g2">
        <form
          className="card form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            try {
              await signInWithEmailAndPassword(
                auth,
                form.get("email"),
                form.get("password")
              );
              notify("Signed in");
            } catch (error) {
              notify(error.message);
            }
          }}
        >
          <h2 className="full">Sign In</h2>
          <label className="field full">
            <span>Email</span>
            <input name="email" type="email" required />
          </label>
          <label className="field full">
            <span>Password</span>
            <input name="password" type="password" required />
          </label>
          <div className="full row">
            <button className="btn primary">Sign In</button>
            <button
              type="button"
              className="btn secondary"
              onClick={async () => {
                const email = prompt("Email");
                if (email) await sendPasswordResetEmail(auth, email);
              }}
            >
              Forgot Password
            </button>
          </div>
        </form>

        <form
          className="card form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            try {
              const credential = await createUserWithEmailAndPassword(
                auth,
                form.get("email"),
                form.get("password")
              );
              await setDoc(doc(db, "users", credential.user.uid), {
                name: form.get("name"),
                email: form.get("email"),
                phone: form.get("phone"),
                role: "customer",
                loyaltyPunches: 0,
                availableRewards: 0,
                createdAt: serverTimestamp(),
              });
              notify("Account created");
            } catch (error) {
              notify(error.message);
            }
          }}
        >
          <h2 className="full">Create Account</h2>
          <label className="field full">
            <span>Name</span>
            <input name="name" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required />
          </label>
          <label className="field">
            <span>Phone</span>
            <input name="phone" />
          </label>
          <label className="field full">
            <span>Password</span>
            <input name="password" type="password" minLength="6" required />
          </label>
          <div className="full">
            <button className="btn primary">Create Account</button>
          </div>
        </form>
      </div>
    </section>
  );
}
