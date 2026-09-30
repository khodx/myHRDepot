import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Accessibility,
  BadgeDollarSign,
  BookOpen,
  Briefcase,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
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
