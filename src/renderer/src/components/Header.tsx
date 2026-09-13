interface HeaderProps {
  goal: string;
}

export default function Header({ goal }: HeaderProps): JSX.Element {
  return (
    <header className="header">
      <p className="brand">Northstar</p>
      <h1>Learning &amp; Growth</h1>
      <p className="goal">
        Goal: <strong>{goal}</strong>
      </p>
    </header>
  );
}
