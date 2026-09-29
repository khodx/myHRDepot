import { useRef, useState, type MouseEvent } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Accessibility,
  Activity,
  Award,
  BadgeDollarSign,
  BellRing,
  BookCopy,
  BookOpenCheck,
  ClipboardPen,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  Bot,
  Calculator,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  Car,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Cog,
  DoorOpen,
  FileSearch,
  FileQuestion,
  FileSignature,
  FileText,
  FileWarning,
  FlaskConical,
  FolderOpen,
  Gauge,
  Gavel,
  GraduationCap,
  HardHat,
  HelpCircle,
  IdCard,
  Inbox,
  Layers,
  LayoutDashboard,
  Library,
  LibraryBig,
  ListChecks,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MessageSquareWarning,
  Network,
  Package2,
  PanelLeftClose,
  PanelLeftOpen,
  Presentation,
  RefreshCw,
  Route,
  Scale,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Stamp,
  Trophy,
  UserSearch,
  UserPlus,
  UserCog,
  Users,
  UsersRound,
  TrendingUp,
  Wand2,
  Workflow,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useMhdAuth } from '@/features/authentication/Hook';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { useMhdFocusTrap } from '@/utils/useMhdFocusTrap';
import {
  mhdResolvedRouteRoles,
  mhdResolvedRouteStatus,
  mhdRouteRoles,
  mhdRouteStatus,
} from './mhdRouteAccess';

export interface NavItem {
  label: string;
  /** One-line summary shown on the dashboard's Modules card. */
  description: string;
  /** Search terms that feed the AI navigation assistant's matcher (Stage 1 of Platform Engine 04.20). */
  keywords?: string[];
  route: string;
  icon: React.ElementType;
  roles: MhdAuthRoleName[] | 'ALL';
  status?: 'live' | 'comingSoon';
  /**
   * A self-service or narrower-scope companion view nested under this item
   * (e.g. "My Training" under "Training"). Rendered as an indented sub-row in
   * the sidebar, and as a secondary in-card link on the dashboard, rather
   * than a sibling top-level entry.
   */
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  icon: React.ElementType;
  /**
   * The category's own landing page (`/categories/<slug>`). Clicking the
   * category in the rail navigates here and expands its panel. A section
   * without one (a single-module category such as Automation) has nothing to
   * land on, so its rail entry links straight to its only module instead.
   */
  route?: string;
  /** One-line summary shown at the top of the category landing page. */
  description?: string;
  items: NavItem[];
}

/** The nav items a role can open, with the parent-hidden child promotion rule applied. */
export function mhdVisibleNavItems(items: NavItem[], roles: MhdAuthRoleName[]): NavItem[] {
  const hasRole = (item: NavItem) =>
    item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role));
  // A child (e.g. "My Training") can be visible to a role that cannot see its
  // parent (e.g. "Training" is Platform Admin/HR Partner/Client Admin only,
  // while My Training is Employee/Manager/Supervisor/Lead) — nesting must
  // never hide a role from a route it's independently entitled to. When the
  // parent passes the role check, keep only its role-visible children nested
  // under it; when the parent fails, promote any role-visible children to
  // their own un-nested top-level entries instead of losing them.
  return items.flatMap((item) => {
    const visibleChildren = (item.children ?? []).filter(hasRole);
    if (hasRole(item)) return [{ ...item, children: visibleChildren }];
    return visibleChildren;
  });
}

// Dashboard sits above the collapsible groups as the app's home — it belongs to
// no group so it is always one click away.
const DASHBOARD_ITEM: NavItem = {
  label: 'Dashboard',
  description: 'Your personal snapshot of tasks, activity, and modules.',
  route: '/dashboard',
  icon: LayoutDashboard,
  roles: mhdRouteRoles('/dashboard'),
};

/**
 * A sub-page of a module (a library, a tab, an admin surface) that is its own
 * routed destination. Roles and status are resolved through the same rule
 * lookup the router guard uses, so a sub-page inheriting its parent's rule is
 * never advertised to a role the guard would refuse.
 */
function subPage(
  label: string,
  description: string,
  route: string,
  icon: React.ElementType,
  keywords: string[],
): NavItem {
  return {
    label,
    description,
    keywords,
    route,
    icon,
    roles: mhdResolvedRouteRoles(route),
    status: mhdResolvedRouteStatus(route),
  };
}

// Grouped by HR domain rather than one long flat list. Roles come from
// mhdRouteAccess.ts (the same source MhdRoleGuardedRoute enforces against) so the
// sidebar can never drift from what the router actually allows — see
// MhdRoleGuardedRoute.tsx. Each group is collapsible (state persisted per user in
// localStorage) so a large module set stays manageable. The five groups plus
// Dashboard are exactly the six category themes — the rail color follows the
// active route's category via the shell's data-mhd-theme stamp.
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Work Tools',
    route: '/categories/work-tools',
    description: 'Everyday tools for getting work done.',
    icon: Wrench,
    items: [
      {
        label: 'Tasks',
        description: 'Track and complete your assigned tasks.',
        keywords: ['to do', 'work items', 'assigned work'],
        route: '/tasks',
        icon: CheckSquare,
        roles: mhdRouteRoles('/tasks'),
        children: [
          subPage(
            'Tasks Dashboard Report',
            'Summary report of task volume, status, and overdue work.',
            '/tasks/dashboard-report',
            Gauge,
            ['task report', 'overdue tasks'],
          ),
        ],
      },
      {
        label: 'Activities',
        description: 'Log calls, meetings, and notes tied to any record.',
        keywords: ['log activity', 'call notes', 'meeting notes'],
        route: '/activities',
        icon: CalendarClock,
        roles: mhdRouteRoles('/activities'),
      },
      {
        label: 'Calendar',
        description: 'View scheduled events, deadlines, and time off.',
        keywords: ['events', 'appointments', 'schedule', 'time off'],
        route: '/calendar',
        icon: Calendar,
        roles: mhdRouteRoles('/calendar'),
      },
      {
        label: 'Command Center',
        description: 'See your most important HR priorities in one place.',
        keywords: ['priorities', 'action items', 'HR dashboard'],
        route: '/command-center',
        icon: Zap,
        roles: mhdRouteRoles('/command-center'),
      },
      {
        label: 'Forms',
        description: 'Build and submit HR forms and requests.',
        keywords: ['request form', 'paperwork', 'submit a form'],
        route: '/forms',
        icon: ClipboardList,
        roles: mhdRouteRoles('/forms'),
        children: [
          subPage(
            'Form Library',
            'Browse and reuse published form templates.',
            '/forms/library',
            LibraryBig,
            ['form templates', 'shared forms'],
          ),
        ],
      },
      {
        label: 'Approvals',
        description: 'Review and act on pending approval requests.',
        keywords: ['approve', 'pending approvals', 'manager approvals'],
        route: '/approvals',
        icon: Stamp,
        roles: mhdRouteRoles('/approvals'),
      },
      {
        label: 'Reports',
        description: 'Run and export operational HR reports.',
        keywords: ['analytics', 'reporting', 'download reports'],
        route: '/reports',
        icon: FileText,
        roles: mhdRouteRoles('/reports'),
      },
      {
        label: 'Property',
        description: 'Track company property assigned to employees.',
        keywords: ['equipment', 'company assets', 'assigned property'],
        route: '/property',
        icon: Package2,
        roles: mhdRouteRoles('/property'),
        status: mhdRouteStatus('/property'),
      },
      {
        label: 'E-Signature',
        description: 'Send documents out for electronic signature.',
        keywords: ['e-sign', 'digital signature', 'sign documents'],
        route: '/esignature',
        icon: FileSignature,
        roles: mhdRouteRoles('/esignature'),
      },
      {
        label: 'Calculator',
        description: 'Standard and guided calculators for common HR math.',
        keywords: ['HR calculator', 'pay calculation', 'benefits math'],
        route: '/calculator',
        icon: Calculator,
        roles: mhdRouteRoles('/calculator'),
      },
      // Non-medical, non-case reference material — open to every role, same
      // category as Tasks/Checklists/My Policies above (see the 'ALL' note
      // in mhdRouteAccess.ts next to this route).
      {
        label: 'Legal & Regulatory Search',
        description: 'Search attorney-reviewed guidance, regulatory text, and pending legislation.',
        keywords: ['legal research', 'compliance search', 'laws and regulations'],
        route: '/legal-search',
        icon: Search,
        roles: mhdRouteRoles('/legal-search'),
      },
      {
        label: 'Knowledge Center',
        description: 'Browse published HR guidance and reference content.',
        keywords: ['HR resources', 'help articles', 'reference library'],
        route: '/knowledge-center',
        icon: HelpCircle,
        roles: mhdRouteRoles('/knowledge-center'),
        children: [
          subPage(
            'Knowledge Center Functions',
            'Browse guidance organized by HR function.',
            '/knowledge-center/functions',
            Workflow,
            ['HR functions', 'guidance by function'],
          ),
          subPage(
            'Knowledge Center Admin',
            'Author and publish knowledge center articles.',
            '/knowledge-center/admin',
            Settings,
            ['manage articles', 'publish guidance'],
          ),
        ],
      },
    ],
  },
  {
    label: 'People & Org',
    route: '/categories/people-org',
    description: 'Employees, users, companies, jobs and their files.',
    icon: UsersRound,
    items: [
      {
        label: 'People',
        description: 'Search and manage the company people directory.',
        keywords: ['employee directory', 'staff list', 'find a person'],
        route: '/people',
        icon: Users,
        roles: mhdRouteRoles('/people'),
        children: [
          subPage(
            'Org Chart',
            'See reporting lines across the organization.',
            '/people/org-chart',
            Network,
            ['organization chart', 'reporting structure', 'who reports to whom'],
          ),
        ],
      },
      {
        label: 'Users',
        description: 'Manage platform user accounts and access.',
        keywords: ['user management', 'account access', 'permissions'],
        route: '/users',
        icon: UserCog,
        roles: mhdRouteRoles('/users'),
      },
      // The new-hire packet roster. Sits beside People rather than next to
      // Offboarding because it is the hire-side intake surface and reads the
      // same people directory; Employee Relations covers conduct and exit.
      {
        label: 'Onboarding',
        description: 'Guide new hires through their onboarding packet.',
        keywords: ['new hire', 'orientation', 'onboard employee'],
        route: '/onboarding',
        icon: UserPlus,
        roles: mhdRouteRoles('/onboarding'),
        status: mhdRouteStatus('/onboarding'),
      },
      {
        label: 'Employee Files',
        description: "Browse each employee's document cabinet.",
        keywords: ['employee files', 'personnel records', 'employee documents'],
        route: '/employees',
        icon: FolderOpen,
        roles: mhdRouteRoles('/employees'),
      },
      {
        label: 'Companies',
        description: 'Manage company profiles and organizational entities.',
        keywords: ['organizations', 'company records', 'business units'],
        route: '/companies',
        icon: Building2,
        roles: mhdRouteRoles('/companies'),
      },
      // Privileged only. Employees reach their own description via "My Job".
      {
        label: 'Job Descriptions',
        description: 'Maintain job descriptions across the company.',
        keywords: ['job roles', 'position descriptions', 'job profiles'],
        route: '/jobs',
        icon: Briefcase,
        roles: mhdRouteRoles('/jobs'),
        children: [
          subPage(
            'Competency Library',
            'Maintain the competencies referenced by job descriptions.',
            '/jobs/competencies',
            ListChecks,
            ['skills library', 'job competencies'],
          ),
          subPage(
            'Job Description Disclaimers',
            'Manage the disclaimer text appended to job descriptions.',
            '/jobs/disclaimers',
            FileWarning,
            ['job disclaimer', 'legal wording'],
          ),
        ],
      },
      {
        label: 'Compensation',
        description: 'Classify roles for pay and overtime compliance.',
        keywords: [
          'exempt classification',
          'salary classification',
          'overtime exemption',
          'pay classification',
        ],
        route: '/compensation',
        icon: BadgeDollarSign,
        roles: mhdRouteRoles('/compensation'),
        status: mhdRouteStatus('/compensation'),
      },
      // The employee's own published job description — a SEPARATE route from the
      // privileged /jobs list (Client User only), so the list never has to be
      // correct for two audiences. NOT nested under Job Descriptions: the two
      // routes' role sets are fully disjoint (mhdRouteAccess.ts), so no single
      // user ever qualifies for both — nesting would never actually render as
      // a two-link card for anyone, only ever resolve to one or the other.
      {
        label: 'My Job',
        description: 'View your own published job description.',
        keywords: ['my position', 'my role', 'my job profile'],
        route: '/my-job',
        icon: IdCard,
        roles: mhdRouteRoles('/my-job'),
      },
    ],
  },
  {
    label: 'Time & Leave',
    route: '/categories/time-leave',
    description: 'Schedules, attendance, leave and accommodations.',
    icon: Clock,
    items: [
      {
        label: 'Schedule',
        description: 'View and manage employee work schedules.',
        keywords: ['work hours', 'shift schedule', 'staff scheduling'],
        route: '/schedule',
        icon: CalendarDays,
        roles: mhdRouteRoles('/schedule'),
      },
      {
        label: 'Attendance',
        description: 'Record and monitor daily time and attendance.',
        keywords: ['clock in', 'timesheets', 'hours worked'],
        route: '/attendance',
        icon: ClipboardCheck,
        roles: mhdRouteRoles('/attendance'),
        children: [
          subPage(
            'Attendance Policy',
            'Configure attendance rules and thresholds.',
            '/attendance/policy',
            ScrollText,
            ['tardy policy', 'attendance rules'],
          ),
        ],
      },
      // Renders for Client Users (their own cases) and privileged roles (the full
      // company board) behind the same link; Viewer is excluded. The medical
      // partition is gated deeper in the case detail page.
      {
        label: 'Leaves',
        description: 'Manage leave of absence cases and balances.',
        keywords: ['time off', 'leave request', 'fmla', 'cfra', 'maternity leave', 'medical leave'],
        route: '/leaves',
        icon: CalendarOff,
        roles: mhdRouteRoles('/leaves'),
        children: [
          subPage(
            'Leave Policy Library',
            'Maintain leave policies and their eligibility rules.',
            '/leaves/policy-library',
            BookCopy,
            ['leave policies', 'fmla policy'],
          ),
        ],
      },
      {
        label: 'Accommodations',
        description: 'Track reasonable accommodation requests and the interactive process.',
        keywords: ['work accommodation', 'ada request', 'disability accommodation'],
        route: '/accommodations',
        icon: Accessibility,
        roles: mhdRouteRoles('/accommodations'),
        children: [
          subPage(
            'Accommodation Option Library',
            'Reusable accommodation options evaluated in the interactive process.',
            '/accommodations/option-library',
            ClipboardPen,
            ['accommodation options', 'job aids'],
          ),
        ],
      },
      {
        label: 'Mileage',
        description: 'Submit and review mileage reimbursement claims.',
        keywords: ['expense report', 'gas mileage', 'reimbursement', 'travel expenses'],
        route: '/mileage',
        icon: Car,
        roles: mhdRouteRoles('/mileage'),
      },
    ],
  },
  {
    label: 'Talent',
    route: '/categories/talent',
    description: 'Performance, recruiting, learning and policies.',
    icon: Award,
    items: [
      {
        label: 'Performance',
        description: 'Run performance reviews and track goals.',
        keywords: ['employee reviews', 'goals', 'performance evaluation'],
        route: '/performance',
        icon: TrendingUp,
        roles: mhdRouteRoles('/performance'),
        status: mhdRouteStatus('/performance'),
        children: [
          // 360 feedback requests addressed to the signed-in user. A SEPARATE route
          // from /performance because a rater cannot load the review behind their
          // invitation.
          {
            label: 'Feedback Requests',
            description: 'Respond to 360 feedback requests addressed to you.',
            keywords: ['peer feedback', '360 review', 'feedback invitation'],
            route: '/performance/invitations',
            icon: MessageSquare,
            roles: mhdRouteRoles('/performance/invitations'),
            status: mhdRouteStatus('/performance/invitations'),
          },
          subPage(
            'Review Templates',
            'Build the templates used for performance reviews.',
            '/performance/templates',
            SlidersHorizontal,
            ['review forms', 'evaluation templates'],
          ),
          subPage(
            'Performance Settings',
            'Configure review cycles and rating scales.',
            '/performance/settings',
            Cog,
            ['review cycles', 'rating scale'],
          ),
        ],
      },
      {
        label: 'Recruiting',
        description: 'Manage job requisitions and candidate pipelines.',
        keywords: ['hiring', 'applicants', 'open positions', 'candidates'],
        route: '/recruiting',
        icon: UserSearch,
        roles: mhdRouteRoles('/recruiting'),
        status: mhdRouteStatus('/recruiting'),
        children: [
          subPage(
            'Interview Question Bank',
            'Maintain reusable interview questions.',
            '/recruiting/questions',
            FileQuestion,
            ['interview questions', 'question library'],
          ),
        ],
      },
      // Platform-Admin ONLY — the sole read path into the hard-restricted EEO
      // partition, aggregate counts only.
      {
        label: 'EEO Report',
        description: 'View aggregate EEO compliance counts.',
        keywords: ['equal employment', 'diversity metrics', 'EEO compliance'],
        route: '/recruiting/eeo',
        icon: BarChart3,
        roles: mhdRouteRoles('/recruiting/eeo'),
        status: mhdRouteStatus('/recruiting/eeo'),
      },
      {
        label: 'Learning Management (LMS)',
        description:
          'Author courses, assign compliance training, and manage certifications, assessments, and live sessions.',
        keywords: ['training courses', 'compliance training', 'certifications', 'LMS'],
        route: '/training',
        icon: GraduationCap,
        roles: mhdRouteRoles('/training'),
        children: [
          subPage(
            'Curricula',
            'Group courses into ordered curricula.',
            '/training/curricula',
            Layers,
            ['curriculum', 'course sequence'],
          ),
          subPage(
            'Programs',
            'Bundle curricula into learning programs.',
            '/training/programs',
            Workflow,
            ['learning program', 'training program'],
          ),
          subPage(
            'Course Templates',
            'Start new courses from reusable templates.',
            '/training/templates',
            BookCopy,
            ['course template'],
          ),
          subPage(
            'Assessments',
            'Author and manage quizzes and assessments.',
            '/training/assessments',
            ClipboardPen,
            ['quiz', 'test', 'exam'],
          ),
          subPage(
            'ILT Sessions',
            'Schedule and track instructor-led training sessions.',
            '/training/ilt',
            Presentation,
            ['live session', 'classroom training', 'instructor led'],
          ),
          subPage(
            'Training Compliance',
            'Monitor training compliance status and expirations.',
            '/training/compliance',
            ShieldCheck,
            ['training expiry', 'overdue training'],
          ),
          subPage(
            'Training Engagement',
            'Measure learner engagement and completion.',
            '/training/engagement',
            Activity,
            ['learner engagement', 'completion rates'],
          ),
          subPage(
            'Lifecycle & Access',
            'Control course access across the learner lifecycle.',
            '/training/lifecycle',
            RefreshCw,
            ['course access', 'enrollment lifecycle'],
          ),
          subPage(
            'Leaderboard',
            'See the company training leaderboard.',
            '/training/leaderboard',
            Trophy,
            ['top learners', 'training ranking'],
          ),
        ],
      },
      // NOT nested under Training: the two routes' role sets are fully
      // disjoint by design ("Two separate routes, never one filtered
      // surface" — mhdRouteAccess.ts), so no single user ever qualifies for
      // both and a nested card would never actually render as one for anyone.
      {
        label: 'My Training',
        description: 'Complete your assigned training courses.',
        keywords: ['my courses', 'assigned learning', 'required training'],
        route: '/my-training',
        icon: BookOpen,
        roles: mhdRouteRoles('/my-training'),
      },
      {
        label: 'Handbooks',
        description: 'Publish and manage employee handbooks.',
        keywords: ['handbook publishing', 'employee manual', 'company handbook'],
        route: '/handbooks',
        icon: Library,
        roles: mhdRouteRoles('/handbooks'),
        children: [
          subPage(
            'Handbook Section Library',
            'Reusable handbook sections for assembling handbooks.',
            '/handbooks/library',
            BookOpenCheck,
            ['handbook sections', 'handbook templates'],
          ),
        ],
      },
      // NOT nested under Handbooks — same fully-disjoint-roles reasoning as
      // Training / My Training above.
      {
        label: 'My Handbooks',
        description: 'Read the handbooks assigned to you.',
        keywords: ['my employee handbook', 'read handbook', 'assigned handbook'],
        route: '/my-handbooks',
        icon: BookMarked,
        roles: mhdRouteRoles('/my-handbooks'),
      },
      {
        label: 'Certificates',
        description: 'Issue and verify award, promotion, training, and general certificates.',
        keywords: [
          'award certificate',
          'promotion certificate',
          'certificate of completion',
          'verify certificate',
        ],
        route: '/certificates',
        icon: Award,
        roles: mhdRouteRoles('/certificates'),
      },
      {
        label: 'Checklists',
        description: 'Create and fork reusable checklist templates.',
        keywords: ['task checklist', 'checklist templates', 'to-do lists'],
        route: '/checklists',
        icon: ClipboardList,
        roles: mhdRouteRoles('/checklists'),
        children: [
          {
            label: 'My Checklists',
            description: 'Complete checklists assigned to you.',
            keywords: ['my tasks', 'assigned checklist', 'complete checklist'],
            route: '/my-checklists',
            icon: ClipboardCheck,
            roles: mhdRouteRoles('/my-checklists'),
          },
        ],
      },
      {
        label: 'Policies',
        description: 'Author and publish company policies.',
        keywords: ['policy management', 'HR policies', 'policy documents'],
        route: '/policies',
        icon: FileText,
        roles: mhdRouteRoles('/policies'),
        children: [
          {
            label: 'My Policies',
            description: 'Review and acknowledge policies assigned to you.',
            keywords: ['acknowledge policy', 'my policies', 'policy sign-off'],
            route: '/my-policies',
            icon: FileSignature,
            roles: mhdRouteRoles('/my-policies'),
          },
        ],
      },
    ],
  },
  {
    label: 'Employee Relations',
    route: '/categories/employee-relations',
    description: 'Conduct, investigations, safety and compliance.',
    icon: Scale,
    items: [
      // Admin-only (Platform Admin / HR Partner / Client Admin); no subject route.
      {
        label: 'Conduct',
        description: 'Track workplace conduct cases and outcomes.',
        keywords: ['employee conduct', 'disciplinary cases', 'workplace behavior'],
        route: '/conduct',
        icon: Gavel,
        roles: mhdRouteRoles('/conduct'),
      },
      // NOT nested under Grievances — same fully-disjoint-roles reasoning as
      // Training / My Training and Jobs / My Job above: the RPCs gate
      // /grievances to Platform Admin / HR Partner and /my-grievances to the
      // filer, so no single user ever qualifies for both.
      {
        label: 'Grievances',
        description: 'Review and resolve employee-filed grievances.',
        keywords: ['complaints', 'employee concerns', 'resolve grievance'],
        route: '/grievances',
        icon: MessageSquareWarning,
        roles: mhdRouteRoles('/grievances'),
      },
      {
        label: 'My Grievance',
        description: 'File a grievance or check the status of one you filed.',
        keywords: ['file complaint', 'my complaint', 'grievance status'],
        route: '/my-grievances',
        icon: MessageSquare,
        roles: mhdRouteRoles('/my-grievances'),
      },
      // Role-gated for the privileged set. Showing the link is NOT access control:
      // case visibility stays grant-based server-side, so an ungranted admin who
      // opens the board sees an empty, non-disclosing list.
      {
        label: 'Investigations',
        description: 'Manage formal workplace investigations.',
        keywords: ['HR investigation', 'fact finding', 'investigation cases'],
        route: '/investigations',
        icon: ShieldAlert,
        roles: mhdRouteRoles('/investigations'),
      },
      {
        label: 'Offboarding',
        description: 'Manage employee exit and offboarding cases.',
        keywords: ['termination', 'employee departure', 'exit process'],
        route: '/offboarding',
        icon: DoorOpen,
        roles: mhdRouteRoles('/offboarding'),
        status: mhdRouteStatus('/offboarding'),
      },
      // Platform Admin / HR Partner / HR Admin / Client Admin only (the
      // Workplace Safety master plan's locked-in role set) — no dedicated
      // Safety role exists in the current 14-role model.
      {
        label: 'Workplace Safety',
        description: 'OSHA/Cal-OSHA recordkeeping: incidents and the annual 300A summary.',
        keywords: ['work injury', 'OSHA log', 'safety incident', '300A'],
        route: '/safety',
        icon: HardHat,
        roles: mhdRouteRoles('/safety'),
      },
      // Platform Admin / HR Partner only — same strictly-gated,
      // no-subject-facing precedent as Conduct/Investigations above. The
      // audit trail it reads (mhd_list_audit_events) spans every task,
      // note, attachment, and activity across the company, including IP
      // addresses and user agents.
      {
        label: 'Audit Reports',
        description: 'Review the company-wide activity and access audit trail.',
        keywords: ['audit log', 'access history', 'activity history'],
        route: '/audit-reports',
        icon: FileSearch,
        roles: mhdRouteRoles('/audit-reports'),
      },
      {
        label: 'Document Retention',
        description: 'Legally required retention windows for company records.',
        keywords: ['records retention', 'retention schedule', 'document lifecycle'],
        route: '/document-retention',
        icon: FileSearch,
        roles: mhdRouteRoles('/document-retention'),
      },
      {
        label: 'Contractor Classification',
        description: 'Evaluate worker-classification compliance recommendations.',
        keywords: ['independent contractor', 'employee classification', '1099 compliance'],
        route: '/contractor-classification',
        icon: Scale,
        roles: mhdRouteRoles('/contractor-classification'),
      },
    ],
  },
  {
    label: 'Communications',
    route: '/categories/communications',
    description: 'Announcements, messaging and memorandums.',
    icon: MessageCircle,
    items: [
      {
        label: 'Communications',
        description: 'Send messages and manage system alerts.',
        keywords: ['internal messaging', 'notifications', 'alerts'],
        route: '/communications',
        icon: MessageSquare,
        roles: mhdRouteRoles('/communications'),
        children: [
          subPage(
            'Announcements',
            'Publish company-wide announcements.',
            '/communications/announcements',
            Megaphone,
            ['company news', 'broadcast'],
          ),
          subPage(
            'Messaging',
            'Send and read internal messages.',
            '/communications/messaging',
            MessageSquare,
            ['direct message', 'conversations'],
          ),
          subPage(
            'Correspondence Inbox',
            'Triage inbound email correspondence.',
            '/communications/inbox',
            Inbox,
            ['inbound email', 'shared inbox'],
          ),
          subPage(
            'Correspondence Routing',
            'Configure how inbound email is routed to records.',
            '/communications/routing',
            Route,
            ['email aliases', 'routing rules'],
          ),
          subPage(
            'System Alerts',
            'Review platform notifications and system alerts.',
            '/communications/system-alerts',
            BellRing,
            ['notifications', 'platform alerts'],
          ),
        ],
      },
      {
        label: 'Memorandums',
        description: 'Author and distribute formal company memorandums.',
        keywords: ['company memo', 'formal notice', 'internal memorandum'],
        route: '/memorandums',
        icon: Mail,
        roles: mhdRouteRoles('/memorandums'),
        children: [
          {
            label: 'My Memorandums',
            description: 'Memorandums sent to you.',
            keywords: ['received memos', 'my notices', 'assigned memorandums'],
            route: '/my-memorandums',
            icon: Mail,
            roles: mhdRouteRoles('/my-memorandums'),
          },
        ],
      },
    ],
  },
  {
    label: 'Automation',
    icon: Zap,
    items: [
      {
        label: 'Automations',
        description: 'Build and manage automated workflow rules.',
        keywords: ['workflow automation', 'automated rules', 'triggers'],
        route: '/automations',
        icon: Bot,
        roles: mhdRouteRoles('/automations'),
      },
    ],
  },
  // Every guided-creation wizard in the app, listed once as its own nav
  // category. This is a directory pointing at each wizard's existing route —
  // it does not move or duplicate any of them. Deliberately shares the
  // work-tools theme rather than owning a seventh category color (see
  // mhdModuleAccent.ts's header: "exactly six category themes exist").
  {
    label: 'Wizards',
    icon: Wand2,
    items: [
      {
        label: 'Wizards',
        description: 'Every guided, step-by-step creation flow in one place.',
        keywords: ['guided setup', 'step by step', 'create wizard'],
        route: '/wizards',
        icon: Wand2,
        roles: mhdRouteRoles('/wizards'),
      },
    ],
  },
  // Platform Admin only — see mhdRouteAccess.ts. Deliberately its own group at
  // the bottom of the rail rather than folded into Work Tools, so it reads as
  // platform operator tooling, not an HR module.
  {
    label: 'Administration',
    route: '/categories/administration',
    description: 'Platform settings and experimental tools.',
    icon: Cog,
    items: [
      {
        label: 'Admin Settings',
        description: 'Configure company-wide settings and platform options.',
        keywords: ['configuration', 'company settings', 'platform administration'],
        route: '/admin',
        icon: Settings,
        roles: mhdRouteRoles('/admin'),
      },
      {
        label: 'Lab & Sandbox',
        description: 'Experimental tools for platform testing.',
        keywords: ['experimental features', 'developer tools', 'test environment'],
        route: '/lab',
        icon: FlaskConical,
        roles: mhdRouteRoles('/lab'),
      },
    ],
  },
];

const MHD_NAV_COLLAPSE_KEY = 'mhd:nav:collapsed';
const MHD_RAIL_STATE_KEY = 'mhd:nav:rail';

function readCollapsedGroups(): string[] {
  try {
    const raw = window.localStorage.getItem(MHD_NAV_COLLAPSE_KEY);
    // No stored preference: default every group collapsed. Once a user
    // toggles anything, their stored choice always wins over this default.
    return raw ? (JSON.parse(raw) as string[]) : NAV_SECTIONS.map((section) => section.label);
  } catch {
    // localStorage genuinely unavailable (private mode / non-browser env) —
    // fall back to expanded rather than compounding one degraded experience
    // (no persistence) with another (everything hidden behind a click).
    return [];
  }
}

function readRailCollapsed(): boolean {
  try {
    return window.localStorage.getItem(MHD_RAIL_STATE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

/**
 * Desktop rail. Dark navy surface (bg-rail, #00157A) — the active nav item is
 * marked by a raised bevel on its amber selected fill (bg-rail-selected),
 * not by flooding the whole sidebar. 329.13px expanded, 72px collapsed
 * (icon-only, persisted separately from the per-group collapse).
 */
export function MhdSidebar() {
  const [railCollapsed, setRailCollapsed] = useState<boolean>(() => readRailCollapsed());

  const toggleRail = () => {
    setRailCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MHD_RAIL_STATE_KEY, next ? 'collapsed' : 'expanded');
      } catch {
        // localStorage unavailable — rail state stays in-memory only.
      }
      return next;
    });
  };

  return (
    <aside
      className={`hidden h-full flex-col border-r border-rail-border bg-rail text-rail-text transition-[width] duration-200 motion-reduce:transition-none lg:flex ${
        railCollapsed ? 'w-[72px]' : 'w-[329.13px]'
      }`}
    >
      <MhdSidebarContent collapsed={railCollapsed} />
      <button
        type="button"
        onClick={toggleRail}
        aria-label={railCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        title={railCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        className="flex min-h-10 items-center justify-center gap-2 border-t border-rail-border px-3 text-rail-muted transition-colors duration-150 hover:bg-rail-hover hover:text-rail-hover-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none"
      >
        {railCollapsed ? (
          <PanelLeftOpen className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <>
            <PanelLeftClose className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-xs font-medium">Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}

/**
 * Mobile navigation drawer — same rail tokens and content as the desktop rail.
 * Traps focus, closes on Escape or backdrop click, and restores focus to the
 * trigger (the previously focused element) when it closes.
 */
export function MhdMobileNavDrawer({ onClose }: { onClose: () => void }) {
  const drawerRef = useRef<HTMLDivElement>(null);
  useMhdFocusTrap(drawerRef, onClose, {
    focusableSelector: 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  });

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute inset-y-0 left-0 flex w-[329.13px] flex-col border-r border-rail-border bg-rail text-rail-text shadow-xl transition-transform duration-200 motion-reduce:transition-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-2 top-6 rounded-md p-2 text-rail-muted transition-colors hover:bg-rail-hover hover:text-rail-hover-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <MhdSidebarContent collapsed={false} />
      </div>
    </div>
  );
}

/** Shared rail content: logo band, company card, and the grouped navigation. */
function MhdSidebarContent({ collapsed }: { collapsed: boolean }) {
  const { roles, profile } = useMhdAuth();
  // Collapsed group labels, remembered per user. Missing storage = all collapsed.
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(() => readCollapsedGroups());

  const hasRole = (item: NavItem) =>
    item.roles === 'ALL' ? true : item.roles.some((role) => roles.includes(role));

  const persistCollapsed = (next: string[]) => {
    try {
      window.localStorage.setItem(MHD_NAV_COLLAPSE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable — collapse state stays in-memory only.
    }
    return next;
  };

  // Accordion behavior: expanding one section collapses every other one.
  // Toggling the already-expanded section collapses it too, leaving none
  // expanded — there is no "expand all" state.
  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const allLabels = NAV_SECTIONS.map((section) => section.label);
      // Currently collapsed -> expand just this one (collapsing every other
      // group). Currently expanded -> collapse it too, leaving none open.
      return persistCollapsed(
        prev.includes(label) ? allLabels.filter((l) => l !== label) : allLabels,
      );
    });
  };

  // Navigating to a category's landing page always leaves it expanded (never
  // toggles it closed), so the panel and the page agree.
  const openGroup = (label: string) => {
    setCollapsedGroups(
      persistCollapsed(NAV_SECTIONS.map((section) => section.label).filter((l) => l !== label)),
    );
  };

  // Dashboard is the app's home — returning to it resets the rail to a known,
  // uncluttered state rather than leaving whatever group the user last opened
  // expanded.
  const collapseAllGroups = () => {
    setCollapsedGroups(persistCollapsed(NAV_SECTIONS.map((section) => section.label)));
  };

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: mhdVisibleNavItems(section.items, roles),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Logo band — aligns with the 72px neutral top bar. */}
      <div
        className={`flex h-[72px] shrink-0 flex-col justify-center border-b border-rail-border ${
          collapsed ? 'items-center px-2' : 'px-4'
        }`}
      >
        <span className="text-[23px] font-bold leading-tight tracking-tight text-white">
          {collapsed ? 'HR' : 'myHRDepot'}
        </span>
        {collapsed ? null : (
          <span
            title="Your one stop shop for everything HR."
            className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-tight tracking-tight text-rail-muted"
          >
            Your one stop shop for everything HR.
          </span>
        )}
      </div>

      {/* Company band — the tenant the session is scoped to. Same flush-strip
          treatment as the logo band above (no card box, no outline): a fixed
          height with a bottom divider line. That gives the scrollable nav
          below a clean, full-width edge to butt up against, instead of a
          floating rounded card whose bottom edge the scrolled content could
          appear to clip into. The row is a size container (`[container-type:size]`)
          so the name's font-size is expressed in `cqh` — a percentage of this
          row's own height — rather than a hardcoded px value that has to be
          hand-recalculated every time the row or rail is resized. */}
      {profile?.companyName ? (
        <div
          title={profile.companyName}
          className={`flex h-11 shrink-0 items-center gap-2 border-b border-rail-border [container-type:size] ${
            collapsed ? 'justify-center px-2' : 'px-4'
          }`}
        >
          <Building2 className="h-4 w-4 shrink-0 text-white" aria-hidden />
          {collapsed ? null : (
            <h3 className="truncate text-[42.5cqh] font-semibold text-white">
              {profile.companyName}
            </h3>
          )}
        </div>
      ) : null}

      {/* Navigation — scrolls independently when the item list exceeds the
          viewport (min-h-0 lets the flex child shrink below its content so
          overflow-y-auto engages instead of the ancestor clipping it). Each
          domain group collapses to keep the list short. */}
      <nav className="mhd-rail-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {hasRole(DASHBOARD_ITEM) ? (
          <MhdNavItem item={DASHBOARD_ITEM} collapsed={collapsed} onClick={collapseAllGroups} />
        ) : null}
        {visibleSections.map((section) =>
          collapsed ? (
            <MhdRailFlyoutCategory key={section.label} section={section} />
          ) : (
            <MhdNavCategory
              key={section.label}
              section={section}
              isCollapsed={collapsedGroups.includes(section.label)}
              onToggle={() => toggleGroup(section.label)}
              onOpen={() => openGroup(section.label)}
            />
          ),
        )}
      </nav>
    </>
  );
}

/** True when the pathname is the route itself or any descendant of it. */
function pathIsWithin(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/** True when the pathname is the category's landing page or inside any of its modules. */
function sectionContainsPath(section: NavSection, pathname: string): boolean {
  if (section.route && pathIsWithin(pathname, section.route)) return true;
  return section.items.some(
    (item) =>
      pathIsWithin(pathname, item.route) ||
      (item.children ?? []).some((child) => pathIsWithin(pathname, child.route)),
  );
}

/**
 * One category in the expanded rail. The name is a link to the category's
 * landing page (navigating also expands it); the chevron is a separate
 * button that only toggles, so the panel can be peeked at or closed without
 * leaving the current page. The open category sits in an inset accent panel
 * with a guide line beside its modules.
 */
function MhdNavCategory({
  section,
  isCollapsed,
  onToggle,
  onOpen,
}: {
  section: NavSection;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { pathname } = useLocation();
  const SectionIcon = section.icon;

  // A category without a landing page (a single-module category) has nothing
  // to expand: its rail entry is just a link to that module.
  if (!section.route) {
    const only = section.items[0];
    return (
      <MhdNavItem
        item={{ label: section.label, route: only.route, icon: section.icon, status: only.status }}
        collapsed={false}
      />
    );
  }

  const landing = section.route;
  const panelId = `mhd-nav-panel-${landing.split('/').pop()}`;

  const handleNameClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Already on the landing page: navigating again is a no-op, so the click
    // becomes the collapse gesture instead — otherwise the panel could never
    // be closed from here.
    if (pathname === landing) {
      event.preventDefault();
      onToggle();
      return;
    }
    onOpen();
  };

  return (
    <div
      className={`space-y-1 rounded-2xl transition-colors duration-150 motion-reduce:transition-none ${
        isCollapsed
          ? ''
          : 'bg-rail-panel p-1 pb-2 shadow-[0_4px_12px_rgba(0,0,0,0.35)]'
      }`}
    >
      <div className="flex items-center gap-0.5">
        <div className="min-w-0 flex-1">
          <MhdNavItem
            item={{ label: section.label, route: landing, icon: SectionIcon }}
            collapsed={false}
            end
            tone="category"
            panelOpen={!isCollapsed}
            onClick={handleNameClick}
          />
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-controls={panelId}
          aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${section.label}`}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none ${
            isCollapsed
              ? 'text-rail-text hover:bg-rail-hover'
              : 'text-rail-panel-text hover:bg-rail-panel-tint-hover'
          }`}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${isCollapsed ? '-rotate-90' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      {isCollapsed ? null : (
        <div
          id={panelId}
          className="relative ml-[22px] space-y-1 pl-2.5 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-0.5 before:rounded-full before:bg-rail-panel-line"
        >
          {section.items.flatMap((item) => [
            <MhdNavItem key={item.route} item={item} collapsed={false} tone="panel" />,
            ...(item.children ?? []).map((child) => (
              <MhdNavItem key={child.route} item={child} collapsed={false} tone="panel" nested />
            )),
          ])}
        </div>
      )}
    </div>
  );
}

/**
 * One category in the icon-only rail. The icon links to the landing page and
 * hovering or focusing it opens a flyout listing the category's modules —
 * the collapsed rail has no room to show them inline. The flyout is
 * `position: fixed` (measured from the trigger) because the nav scroller's
 * `overflow-y-auto` would clip an absolutely positioned child.
 */
function MhdRailFlyoutCategory({ section }: { section: NavSection }) {
  const { pathname } = useLocation();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const SectionIcon = section.icon;

  const show = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.top, left: rect.right });
  };
  const hide = () => setPosition(null);

  // A single-module category has no landing page and nothing to fly out.
  if (!section.route) {
    const only = section.items[0];
    return (
      <div className="space-y-1">
        <div className="mx-2 border-t border-rail-border" aria-hidden />
        <MhdNavItem
          item={{
            label: section.label,
            route: only.route,
            icon: section.icon,
            status: only.status,
          }}
          collapsed
        />
      </div>
    );
  }

  const landing = section.route;

  return (
    <div className="space-y-1">
      <div className="mx-2 border-t border-rail-border" aria-hidden />
      <div
        ref={wrapperRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hide();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') hide();
        }}
      >
        <MhdNavItem
          item={{ label: section.label, route: landing, icon: SectionIcon }}
          collapsed
          end
          active={sectionContainsPath(section, pathname)}
          onClick={hide}
        />
        {position ? (
          // The outer box carries left padding as a transparent hover bridge
          // across the gap between the rail and the panel.
          <div
            role="group"
            aria-label={`${section.label} modules`}
            style={{ top: position.top - 6, left: position.left }}
            className="mhd-rail-scroll fixed z-50 max-h-[80vh] w-[268px] overflow-y-auto pl-3"
          >
            <div className="space-y-1 rounded-2xl bg-rail-panel p-2 shadow-[0_14px_30px_rgba(0,0,0,0.45)]">
              <p className="px-3 pb-1 pt-1 text-[12px] font-semibold uppercase tracking-wider text-rail-panel-text/70">
                {section.label}
              </p>
              <MhdNavItem
                item={{ label: `${section.label} Home`, route: landing, icon: SectionIcon }}
                collapsed={false}
                end
                tone="category"
                panelOpen
                onClick={hide}
              />
              {section.items.flatMap((item) => [
                <MhdNavItem
                  key={item.route}
                  item={item}
                  collapsed={false}
                  tone="panel"
                  onClick={hide}
                />,
                ...(item.children ?? []).map((child) => (
                  <MhdNavItem
                    key={child.route}
                    item={child}
                    collapsed={false}
                    tone="panel"
                    nested
                    onClick={hide}
                  />
                )),
              ])}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type MhdNavItemTone = 'default' | 'category' | 'panel';

function MhdNavItem({
  item,
  collapsed,
  nested,
  end,
  tone = 'default',
  panelOpen,
  active,
  onClick,
}: {
  item: Pick<NavItem, 'label' | 'route' | 'icon' | 'status'>;
  collapsed: boolean;
  nested?: boolean;
  /** Match the route exactly (a category landing page, not its descendants). */
  end?: boolean;
  /**
   * `category` is a category name row; `panel` is a module row inside an open
   * category's accent panel, where the inactive state uses white-alpha tints
   * that read against the accent rather than the navy rail.
   */
  tone?: MhdNavItemTone;
  /** Category row whose panel is open: tinted so it stands apart from closed ones. */
  panelOpen?: boolean;
  /** Overrides the route match, e.g. a collapsed category icon lit for any module inside it. */
  active?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const Icon = item.icon;
  const title =
    collapsed && item.status === 'comingSoon'
      ? `${item.label} (Coming Soon)`
      : collapsed
        ? item.label
        : undefined;

  const size = collapsed
    ? 'justify-center px-0 text-[17px]'
    : tone === 'panel'
      ? nested
        ? 'gap-3 pl-8 text-[14px]'
        : 'gap-3 px-3 text-[15px]'
      : nested
        ? 'gap-3 pl-8 text-[15px]'
        : 'gap-3 px-3 text-[17px]';

  // Rows on the open category's white panel (module rows, and the category
  // row itself while its panel is open) use the panel token set: dark ink,
  // dark-alpha tints, and a navy active pill. Everything else sits directly
  // on the navy rail.
  const onPanel = tone === 'panel' || (tone === 'category' && panelOpen);

  const inactive =
    tone === 'panel'
      ? 'font-medium text-rail-panel-text hover:bg-rail-panel-tint-hover'
      : tone === 'category' && panelOpen
        ? 'bg-rail-panel-tint font-semibold text-rail-panel-text hover:bg-rail-panel-tint-hover'
        : tone === 'category'
          ? 'font-semibold text-rail-text hover:bg-rail-hover hover:text-rail-hover-text'
          : 'font-medium text-rail-text hover:bg-rail-hover hover:text-rail-hover-text';

  // Raised-bevel emphasis, deliberately heavier than a flat fill: a wide soft
  // drop shadow plus a tight contact shadow lift the row off the rail, and a
  // bright top edge / dark bottom edge (inset shadows) read as a
  // pushed-out, embossed button rather than a flat color block. This carries
  // the whole "active" signal now that there's no separate indicator dot.
  const activeClasses = onPanel
    ? // The white rail pill would vanish on the white panel, so the active row
      // flips to a navy pill with the same raised feel.
      'bg-rail-panel-pill font-semibold text-rail-panel-pill-text shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.3)]'
    : 'bg-rail-selected font-semibold text-rail-selected-text shadow-[0_6px_14px_rgba(0,0,0,0.55),0_2px_4px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_0_rgba(0,0,0,0.4)]';

  return (
    <NavLink
      to={item.route}
      end={end}
      title={title}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex min-h-10 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none ${size} ${
          (active ?? isActive) ? activeClasses : inactive
        }`
      }
    >
      {() => (
        <>
          <Icon
            className={
              nested || tone === 'panel' ? 'h-4 w-4 shrink-0' : 'h-[18px] w-[18px] shrink-0'
            }
            aria-hidden
          />
          {collapsed ? null : <span className="truncate">{item.label}</span>}
          {item.status === 'comingSoon' && !collapsed ? (
            <span className="ml-auto shrink-0 rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              Coming Soon
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}
