export default function AnalyticsBars({
  items,
  valueKey = "count",
  labelKey = "name",
  formatter = (value) => value,
  empty = "No data yet.",
}) {
  if (!items?.length) {
    return <p className="muted">{empty}</p>;
  }

  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);

  return (
    <div className="analytics-bars">
      {items.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        const width = Math.max(4, Math.round((value / max) * 100));

        return (
          <div className="analytics-bar-row" key={`${item[labelKey]}-${index}`}>
            <div className="analytics-bar-label">
              <span>{item[labelKey]}</span>
              <b>{formatter(value)}</b>
            </div>
            <div className="analytics-bar-track">
              <div className="analytics-bar-fill" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
