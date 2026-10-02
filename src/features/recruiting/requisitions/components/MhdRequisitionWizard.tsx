import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdWizardOutputStep } from '@/components/ui/MhdWizardOutputStep';
import { MhdWizardShell } from '@/components/ui/MhdWizardShell';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdJobs } from '@/features/jobs/Hook';
import {
  mhdFormatEmploymentType,
  mhdFormatFlsa,
  mhdFormatPayRange,
  type MhdJob,
} from '@/features/jobs/Types';
import {
  useMhdCreateRequisition,
  useMhdRecruitingPeople,
  useMhdTransitionRequisition,
} from '../Hook';
import { mhdRequisitionFormSchema } from '../Schemas';
import {
  MHD_RECRUITING_REQUISITION_STATUSES,
  mhdFormatRequisitionStatus,
  type MhdRecruitingRequisitionStatus,
} from '../Types';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const statusHelp: Record<MhdRecruitingRequisitionStatus, string> = {
  DRAFT: 'Save the requisition for more work before opening it.',
  PENDING_APPROVAL: 'Send the requisition to the approval queue.',
  OPEN: 'Open the requisition for applications immediately.',
  ON_HOLD: 'Pause an existing requisition.',
  FILLED: 'Mark an existing requisition as filled.',
  CLOSED: 'Close an existing requisition.',
  CANCELLED: 'Cancel an existing requisition.',
};

function blankToNull(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function isRequisitionStatus(value: string): value is MhdRecruitingRequisitionStatus {
  return (MHD_RECRUITING_REQUISITION_STATUSES as readonly string[]).includes(value);
}

function JobDetails({ job }: { job: MhdJob }) {
  const payRange = mhdFormatPayRange(job);
  const fields = [
    job.department ? { label: 'Department', value: job.department } : null,
    job.employmentType
      ? { label: 'Employment type', value: mhdFormatEmploymentType(job.employmentType) }
      : null,
    payRange ? { label: 'Pay range', value: payRange } : null,
    job.flsaClassification
      ? { label: 'FLSA classification', value: mhdFormatFlsa(job.flsaClassification) }
      : null,
  ].filter((field): field is { label: string; value: string } => field !== null);

  return fields.length > 0 ? (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-muted-foreground">{field.label}</dt>
            <dd className="font-medium text-foreground">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  ) : null;
}

export function MhdRequisitionWizard() {
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const jobs = useMhdJobs(companyId);
  const people = useMhdRecruitingPeople(companyId);
  const createRequisition = useMhdCreateRequisition();
  const transition = useMhdTransitionRequisition();

  const [jobId, setJobId] = useState('');
  const [titleEdit, setTitleEdit] = useState<string | null>(null);
  const [hiringManagerPersonId, setHiringManagerPersonId] = useState('');
  const [location, setLocation] = useState('');
  const [headcount, setHeadcount] = useState<number | string>(1);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [statusEdit, setStatusEdit] = useState<MhdRecruitingRequisitionStatus | null>(null);
  const [created, setCreated] = useState<{ id: string; referenceId: string } | null>(null);
  const [finalStatus, setFinalStatus] = useState<MhdRecruitingRequisitionStatus | null>(null);

  const job = (jobs.data ?? []).find((candidate) => candidate.id === jobId);
  const title = titleEdit ?? job?.jobTitle ?? '';
  const department = job?.department ?? '';
  const employmentType = job ? mhdFormatEmploymentType(job.employmentType) : '';
  const statusOptions = useMemo<MhdRecruitingRequisitionStatus[]>(
    () => (requiresApproval ? ['DRAFT', 'PENDING_APPROVAL'] : ['DRAFT', 'OPEN']),
    [requiresApproval],
  );
  const defaultStatus = requiresApproval ? 'PENDING_APPROVAL' : 'DRAFT';
  const startingStatus =
    statusEdit && statusOptions.includes(statusEdit) ? statusEdit : defaultStatus;
  const peopleOptions = useMemo(() => people.data ?? [], [people.data]);

  const validateJob = () => {
    if (!jobId) return 'Select the job this requisition is for.';
    if (!title.trim()) return 'A title is required.';
    return null;
  };

  const validateManager = () => {
    const parsed = mhdRequisitionFormSchema.shape.headcount.safeParse(headcount);
    return parsed.success ? null : (parsed.error.issues[0]?.message ?? 'Review the headcount.');
  };

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'job',
      title: 'Job',
      description: 'Choose the job this requisition is for.',
      validate: validateJob,
    },
    {
      id: 'manager',
      title: 'Hiring Manager & Headcount',
      description: 'Set the manager, location, and number of openings.',
      validate: validateManager,
    },
    {
      id: 'approval',
      title: 'Approval',
      description: 'Choose approval and the starting status.',
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Check the requisition before creating it.',
      validate: () => {
        const parsed = mhdRequisitionFormSchema.safeParse({
          companyId,
          title,
          jobId,
          hiringManagerPersonId,
          department,
          location,
          employmentType,
          headcount,
          requiresApproval,
        });
        return parsed.success
          ? null
          : (parsed.error.issues[0]?.message ?? 'Review the requisition.');
      },
    },
  ];

  const flow = useMhdWizardFlow({
    steps,
    isDirty: Boolean(jobId) || Boolean(titleEdit),
    onSubmit: async () => {
      const parsed = mhdRequisitionFormSchema.safeParse({
        companyId,
        title,
        jobId,
        hiringManagerPersonId,
        department,
        location,
        employmentType,
        headcount,
        requiresApproval,
      });
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? 'Review the requisition.');

      const result = await flow.runOnce('create', async () => {
        const createdResult = await createRequisition.mutateAsync({
          companyId,
          title: parsed.data.title,
          jobId: parsed.data.jobId,
          hiringManagerPersonId: blankToNull(hiringManagerPersonId),
          department: blankToNull(department),
          location: blankToNull(location),
          employmentType: blankToNull(employmentType),
          headcount: parsed.data.headcount,
          requiresApproval: parsed.data.requiresApproval,
        });
        const record = { id: createdResult.id, referenceId: createdResult.referenceId };
        setCreated(record);
        return record;
      });

      if (startingStatus !== 'DRAFT') {
        await flow.runOnce(`transition:${startingStatus}`, async () => {
          await transition.mutateAsync({ reqId: result.id, newStatus: startingStatus });
        });
      }
      setCreated(result);
      setFinalStatus(startingStatus);
    },
  });

  function renderStep() {
    switch (flow.currentStep?.id) {
      case 'job':
        return (
          <MhdFormFieldStack>
            <div>
              <label
                htmlFor="requisition-job"
                className="block text-sm font-medium text-foreground"
              >
                Job
              </label>
              <select
                id="requisition-job"
                className={`mt-1 ${inputClass}`}
                value={jobId}
                onChange={(event) => setJobId(event.target.value)}
              >
                <option value="">Select a job</option>
                {(jobs.data ?? []).map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.jobTitle}
                  </option>
                ))}
              </select>
            </div>
            {job ? <JobDetails job={job} /> : null}
            <div>
              <label
                htmlFor="requisition-title"
                className="block text-sm font-medium text-foreground"
              >
                Requisition title
              </label>
              <input
                id="requisition-title"
                className={`mt-1 ${inputClass}`}
                value={title}
                onChange={(event) => setTitleEdit(event.target.value)}
              />
            </div>
            <Link className="text-sm text-accent underline" to="/jobs/new">
              Create A New Job First
            </Link>
          </MhdFormFieldStack>
        );
      case 'manager':
        return (
          <MhdFormFieldStack>
            <div>
              <label
                htmlFor="requisition-manager"
                className="block text-sm font-medium text-foreground"
              >
                Hiring manager
              </label>
              <select
                id="requisition-manager"
                className={`mt-1 ${inputClass}`}
                value={hiringManagerPersonId}
                onChange={(event) => setHiringManagerPersonId(event.target.value)}
              >
                <option value="">No hiring manager yet</option>
                {peopleOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.displayName}
                  </option>
                ))}
              </select>
            </div>
            <label className="text-sm font-medium text-foreground">
              Department
              <input className={`mt-1 ${inputClass}`} value={department} readOnly />
            </label>
            <label htmlFor="requisition-location" className="text-sm font-medium text-foreground">
              Location
              <input
                id="requisition-location"
                className={`mt-1 ${inputClass}`}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Employment type
              <input className={`mt-1 ${inputClass}`} value={employmentType} readOnly />
            </label>
            <label htmlFor="requisition-headcount" className="text-sm font-medium text-foreground">
              Headcount
              <input
                id="requisition-headcount"
                type="number"
                min={1}
                className={`mt-1 ${inputClass}`}
                value={headcount}
                onChange={(event) => setHeadcount(event.target.value)}
              />
            </label>
          </MhdFormFieldStack>
        );
      case 'approval':
        return (
          <MhdFormFieldStack>
            <label className="flex items-start gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(event) => {
                  setRequiresApproval(event.target.checked);
                  setStatusEdit(null);
                }}
              />
              <span>This requisition needs approval before it is opened</span>
            </label>
            <div>
              <label
                htmlFor="requisition-status"
                className="block text-sm font-medium text-foreground"
              >
                Starting status
              </label>
              <select
                id="requisition-status"
                className={`mt-1 ${inputClass}`}
                value={startingStatus}
                onChange={(event) => {
                  if (isRequisitionStatus(event.target.value)) setStatusEdit(event.target.value);
                }}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {mhdFormatRequisitionStatus(status)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">{statusHelp[startingStatus]}</p>
            </div>
          </MhdFormFieldStack>
        );
      default:
        return (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Job</dt>
              <dd className="font-medium">{job?.jobTitle}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Title</dt>
              <dd className="font-medium">{title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Hiring manager</dt>
              <dd className="font-medium">
                {peopleOptions.find((person) => person.id === hiringManagerPersonId)?.displayName ??
                  'None yet'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Department</dt>
              <dd className="font-medium">{department || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Location</dt>
              <dd className="font-medium">{location || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Employment type</dt>
              <dd className="font-medium">{employmentType || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Headcount</dt>
              <dd className="font-medium">{headcount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Approval</dt>
              <dd className="font-medium">{requiresApproval ? 'Required' : 'Not required'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Starting status</dt>
              <dd className="font-medium">{mhdFormatRequisitionStatus(startingStatus)}</dd>
            </div>
          </dl>
        );
    }
  }

  const completion =
    created && finalStatus ? (
      <div className="space-y-4">
        <MhdCard>
          <h2 className="text-lg font-semibold text-foreground">Requisition Created</h2>
          <p className="mt-2 text-sm text-muted-foreground">Reference ID: {created.referenceId}</p>
          <p className="text-sm text-muted-foreground">
            Status: {mhdFormatRequisitionStatus(finalStatus)}
          </p>
          <div className="mt-4">
            <Button onClick={() => navigate(`/recruiting/requisitions/${created.id}`)}>
              Open Requisition
            </Button>
          </div>
        </MhdCard>
        <MhdWizardOutputStep
          companyId={companyId}
          sourceWizard="REQUISITION"
          templateKey="REQUISITION_APPROVAL_RECORD"
          entityType="REQUISITION"
          entityId={created.id}
          recordLabel="approval record"
          allowEmployeeFile={false}
        />
      </div>
    ) : undefined;

  return (
    <MhdWizardShell
      title="Guided requisition"
      description="Choose the job, the hiring manager and headcount, decide whether it needs approval, and create the requisition."
      backTo="/recruiting"
      backLabel="Requisitions"
      cancelTo="/recruiting"
      flow={flow}
      completion={completion}
    >
      {renderStep()}
    </MhdWizardShell>
  );
}

export default MhdRequisitionWizard;
