import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`border border-white/10 bg-white/5 p-4 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
