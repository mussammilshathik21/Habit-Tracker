import { useDragScroll } from "../hooks/useDragScroll";

export default function WeekHeader({ weeks }) {
  const { ref, dragHandlers } = useDragScroll();
  return (
    <div className="habit-grid-header">
      <div />
      <div className="week-days" ref={ref} {...dragHandlers}>
        {weeks.map((week, wi) => (
          <div key={wi} className="week-block">
            {week.map((k) => (
              <div key={k} className="day-label">{Number(k.slice(8, 10))}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
