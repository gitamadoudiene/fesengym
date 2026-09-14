import type { UserRole } from "@prisma/client";
import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[] | "all";
};

export type NavGroup = {
  label: string | null; // null = pas de titre de groupe (ex: Dashboard seul)
  items: NavItem[];
};

/**
 * Nav centralisée, filtrée par rôle. Un lien n'apparaît ici que lorsque la
 * page correspondante existe réellement (voir la règle §70 du brief : pas de
 * liens cassés). Les sections LICENCES / ACTEURS / SPORT / FINANCES /
 * ADMINISTRATION seront ajoutées au fur et à mesure de l'implémentation des
 * modules correspondants.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      {
        label: "Tableau de bord",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: "all",
      },
    ],
  },
  {
    label: "Licences",
    items: [
      {
        label: "Demandes",
        href: "/requests",
        icon: FileText,
        roles: ["SUPER_ADMIN", "FEDERAL_ADMIN", "AGENT", "CLUB_MANAGER"],
      },
      {
        label: "Licences",
        href: "/licenses",
        icon: CreditCard,
        roles: ["SUPER_ADMIN", "FEDERAL_ADMIN", "AGENT", "CLUB_MANAGER"],
      },
      {
        label: "Paiements",
        href: "/payments",
        icon: Wallet,
        roles: ["SUPER_ADMIN", "FEDERAL_ADMIN"],
      },
    ],
  },
  {
    label: "Acteurs",
    items: [
      {
        label: "Athlètes",
        href: "/athletes",
        icon: Users,
        roles: ["SUPER_ADMIN", "FEDERAL_ADMIN", "AGENT", "CLUB_MANAGER"],
      },
      {
        label: "Clubs",
        href: "/admin/clubs",
        icon: Building2,
        roles: ["SUPER_ADMIN", "FEDERAL_ADMIN", "AGENT"],
      },
      {
        label: "Mon club",
        href: "/club/profile",
        icon: Building2,
        roles: ["CLUB_MANAGER"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Utilisateurs",
        href: "/admin/users",
        icon: Users,
        roles: ["SUPER_ADMIN"],
      },
      {
        label: "Paramètres",
        href: "/admin/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN", "FEDERAL_ADMIN", "AGENT"],
      },
    ],
  },
];

export function getNavGroupsForRole(role: UserRole): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.roles === "all" || item.roles.includes(role),
    ),
  })).filter((group) => group.items.length > 0);
}
