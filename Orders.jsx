export default function Rewards({ user, profile }) {
  return (
    <section className="wrap">
      <div className="eyebrow">Loyalty</div>
      <h2>Cray-Zee Loyalty Card</h2>
      <div className="card">
        {!user ? (
          <p>Sign in to view your rewards.</p>
        ) : (
          <>
            <div className="punches">
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  className={`punch ${index < (profile?.loyaltyPunches || 0) ? "on" : ""}`}
                  key={index}
                >
                  {index < (profile?.loyaltyPunches || 0) ? "★" : index + 1}
                </div>
              ))}
            </div>
            <div className="notice">
              {profile?.availableRewards || 0} rewards available
            </div>
          </>
        )}
      </div>
    </section>
  );
}
