import { Compass } from "lucide-react";

interface HeaderProps {
  goal: string;
}

export default function Header({ goal }: HeaderProps): JSX.Element {
  return (
    <header className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div className="flex items-baseline gap-3">
        <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
          <Compass className="size-4 text-muted-foreground" />
          Northstar
        </h1>
        <span className="text-sm text-muted-foreground">Learning &amp; Growth</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Goal: <strong className="font-medium text-foreground">{goal}</strong>
      </p>
    </header>
  );
}
