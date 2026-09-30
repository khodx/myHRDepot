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
  Zap,
} from 'lucide-react';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
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
   * (e.g. "My Training" under "Training"). Rendered as its own card on the
   * category landing page, and as a secondary in-card link on the dashboard,
   * rather than a sibling top-level entry.
   */
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  icon: React.ElementType;
  /**
   * The category's own landing page (`/categories/<slug>`). Clicking the
   * category in the rail navigates here. A section
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
// MhdRoleGuardedRoute.tsx. The rail shows only the categories; each category's
// landing page (MhdCategoryLandingPage) lists its modules and sub-pages from
// this same data. The five groups plus Dashboard are exactly the six category
// themes — the rail color follows the active route's category via the shell's
// data-mhd-theme stamp.
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
