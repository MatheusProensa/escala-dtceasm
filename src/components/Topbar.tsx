interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
    </header>
  );
}
