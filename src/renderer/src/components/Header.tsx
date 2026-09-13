import { Compass } from "lucide-react";

interface HeaderProps {
  goal: string;
}

export default function Header({ goal }: HeaderProps): JSX.Element {
  return (
    <header className="mb-12">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Compass className="size-4" />
        Northstar
      </p>
      <h1 className="mb-2 text-[34px] font-semibold tracking-tight">Learning &amp; Growth</h1>
      <p className="text-lg text-muted-foreground">
        Goal: <strong className="font-medium text-foreground">{goal}</strong>
      </p>
    </header>
  );
}
