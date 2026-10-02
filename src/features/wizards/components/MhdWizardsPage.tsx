import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Accessibility,
  BadgeDollarSign,
  BookOpen,
  Briefcase,
  CalendarClock,
  ClipboardCheck,
  FileWarning,
  DoorOpen,
  GraduationCap,
  HandCoins,
  UserPlus,
  Scale,
  UsersRound,
} from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanAccessRoute } from '@/appshell/mhdRouteAccess';

interface WizardDefinition {
  label: string;
  description: string;
  route: string;
  icon: LucideIcon;
}

/**
 * Every guided-creation wizard in the app, listed once here. This is a
 * directory, not a new home for any of them — each route below is the same
 * one the wizard has always lived at; adding a wizard here never changes
 * where it actually runs. Access to an individual card is governed by that
 * wizard's own existing route rule (`mhdRouteRoles`), read directly below,
 * never duplicated or widened here — /wizards itself only needs to be
 * reachable by the union of every wizard's audience (see mhdRouteAccess.ts).
 */
const WIZARD_DEFINITIONS: WizardDefinition[] = [
  {
    label: 'Job Description Wizard',
    description: 'Build a new job description step by step, from summary through approval.',
    route: '/jobs/new',
    icon: Briefcase,
  },
  {
    label: 'Leave Intake Wizard',
    description: 'Open a new leave-of-absence case and run the eligibility determination.',
    route: '/leaves/new/intake',
    icon: CalendarClock,
  },
  {
    label: 'Compensation Classification Wizard',
    description: 'Classify a job under FLSA and California wage-order rules.',
    route: '/compensation',
    icon: BadgeDollarSign,
  },
  {
    label: 'Contractor Classification Wizard',
    description: 'Run the federal and California worker-classification tests for an engagement.',
    route: '/contractor-classification',
    icon: ClipboardCheck,
  },
  {
    label: 'Course/Curriculum/Program Wizard',
    description: 'Create a training course, curriculum, or program, including content authoring.',
    route: '/training',
    icon: GraduationCap,
  },
  {
    label: 'Handbook Wizard',
    description: 'Assemble an Employee or Safety handbook from jurisdiction-required sections, then publish.',
    route: '/handbooks/new',
    icon: BookOpen,
  },
  {
    label: 'Accommodation Intake Wizard',
    description: 'Open a reasonable-accommodation process and start the interactive dialogue.',
    route: '/accommodations/new',
    icon: Accessibility,
  },
  {
    label: 'Conduct Intake Wizard',
    description: 'Document an incident, see the employee\'s history and the recommended next step, and issue a corrective action.',
    route: '/conduct/new',
    icon: FileWarning,
  },
  {
    label: 'Investigation Intake Wizard',
    description: 'Open an investigation with its parties, an independent investigator, a target date and interim measures.',
    route: '/investigations/new',
    icon: Scale,
  },
  {
    label: 'Offboarding Wizard',
    description: 'Record a separation, plan the final-pay and benefits notices, set up the exit checklist, and see what is still open.',
    route: '/offboarding/new',
    icon: DoorOpen,
  },
  {
    label: 'Onboarding Wizard',
    description: 'Start a new hire\'s onboarding packet from what is known about the accepted offer.',
    route: '/onboarding/new',
    icon: UserPlus,
  },
  {
    label: 'Requisition Wizard',
    description: 'Open a requisition for a job: hiring manager, headcount and whether it needs approval.',
    route: '/recruiting/requisitions/new',
    icon: UsersRound,
  },
  {
    label: 'Offer Wizard',
    description: 'Open an applicant from Recruiting, then start the guided offer from the Offer tab: role, pay check, terms and the signed offer letter.',
    route: '/recruiting',
    icon: HandCoins,
  },
];

export function MhdWizardsPage() {
  const { roles } = useMhdAuth();

  // mhdCanAccessRoute, not mhdRouteRoles: mhdRouteRoles does an exact-path
  // lookup and falls back to 'ALL' for any path without its own literal
  // entry in MHD_ROUTE_ACCESS (e.g. /jobs/new, /leaves/new/intake) --
  // mhdCanAccessRoute does the same prefix-matching MhdRoleGuardedRoute
  // actually enforces, so a card here agrees with whether clicking it would
  // really work.
  const visibleWizards = WIZARD_DEFINITIONS.filter((wizard) =>
    mhdCanAccessRoute(wizard.route, roles),
  );

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Wizards"
        description="Every guided, step-by-step creation flow in one place."
      />

      {visibleWizards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No wizards are available for your current role.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleWizards.map((wizard) => (
            <Link key={wizard.route} to={wizard.route}>
              <MhdCard className="h-full space-y-3 transition-shadow hover:shadow-lg">
                <wizard.icon className="h-6 w-6 text-accent" aria-hidden />
                <div>
                  <h2 className="font-semibold text-foreground">{wizard.label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{wizard.description}</p>
                </div>
              </MhdCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default MhdWizardsPage;
