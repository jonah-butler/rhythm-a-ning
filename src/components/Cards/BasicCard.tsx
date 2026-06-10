import { type ReactNode } from 'react';
import '../../css/BasicCard.css';

type BasicCardProps = {
  children: ReactNode;
};

export default function BasicCard({ children }: BasicCardProps) {
  return (
    <section className="card__contaer">
      <div className="card">{children}</div>
    </section>
  );
}
