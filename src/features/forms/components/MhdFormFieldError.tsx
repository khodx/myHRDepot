interface MhdFormFieldErrorProps {
  message?: string | null;
}

export function MhdFormFieldError({ message }: MhdFormFieldErrorProps) {
  if (!message) return null;

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}
