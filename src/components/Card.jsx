import { cx } from "../lib/utils";

export default function Card({ className, children, ...props }) {
  return (
    <div className={cx("card", className)} {...props}>
      {children}
    </div>
  );
}
