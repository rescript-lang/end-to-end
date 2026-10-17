import { createElement, useState } from "react";

export default function ExternalCounter({ children }) {
  const [count, setCount] = useState(0);
  return createElement(
    "div",
    { id: "external" },
    createElement(
      "button",
      { onClick: () => setCount((value) => value + 1) },
      `External: ${count}`,
    ),
    children,
  );
}
