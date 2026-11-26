import Link from "next/link";
import { Icon, type IconName } from "./icons";
import ui from "./ui.module.css";

export type NavKey = "home" | "calendar" | "modules" | "maintenance";

type NavItem = { key: NavKey; label: string; icon: IconName; href?: string };

export type ShellUser = { role: "student" | "admin"; courseLabel: string };

export function AppShell({
  user,
  active,
  links,
  children,
}: {
  user: ShellUser;
  active: NavKey;
  links: Partial<Record<NavKey, string>>;
  children: React.ReactNode;
}) {
  const course: NavItem[] = [
    { key: "home", label: "Home", icon: "home", href: links.home },
    { key: "calendar", label: "Calendario", icon: "calendar", href: links.calendar },
    { key: "modules", label: "Moduli", icon: "book", href: links.modules },
  ];
  const admin: NavItem[] = [{ key: "maintenance", label: "Manutenzione", icon: "wrench", href: links.maintenance }];
  const isAdmin = user.role === "admin";

  return (
    <div className={ui.shell}>
      <aside className={ui.sidebar}>
        <img className={ui.logo} src="/logo-its.png" alt="ITS Academy Nuove Tecnologie della Vita" />
        <NavGroup label="Corso" items={course} active={active} />
        {isAdmin && <NavGroup label="Amministrazione" items={admin} active={active} />}
        <div className={ui.user}>
          <span className={ui.avatar}>{isAdmin ? "A" : "S"}</span>
          <div>
            <div className={ui.userName}>{isAdmin ? "Amministratore" : "Studente"}</div>
            <div className={ui.userMeta}>{isAdmin ? "Accesso completo" : user.courseLabel}</div>
          </div>
        </div>
      </aside>
      <main className={ui.main}>{children}</main>
    </div>
  );
}

function NavGroup({ label, items, active }: { label: string; items: NavItem[]; active: NavKey }) {
  return (
    <nav className={ui.navGroup} aria-label={label}>
      <p className={ui.navLabel}>{label}</p>
      {items.map((item) => {
        const className = [ui.navItem, item.key === active && ui.navItemActive, !item.href && ui.navItemDisabled]
          .filter(Boolean)
          .join(" ");
        const content = (
          <>
            <Icon name={item.icon} />
            {item.label}
          </>
        );
        return item.href ? (
          <Link
            key={item.key}
            href={item.href}
            className={className}
            aria-current={item.key === active ? "page" : undefined}
          >
            {content}
          </Link>
        ) : (
          <span key={item.key} className={className} title="Schermata non presente nel mockup">
            {content}
          </span>
        );
      })}
    </nav>
  );
}
