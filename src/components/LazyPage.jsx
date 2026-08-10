import { Suspense } from "react";

export default function LazyPage({ children }) {
  return (
    <Suspense
      fallback={
        <section className="wrap">
          <div className="card">Loading...</div>
        </section>
      }
    >
      {children}
    </Suspense>
  );
}
