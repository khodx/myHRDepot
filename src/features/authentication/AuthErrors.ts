export function mhdToUserFacingAuthError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid login credentials')) {
      return 'The email or password entered is incorrect.';
    }

    if (message.includes('email not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }

    if (message.includes('rate limit')) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }

    return error.message;
  }

  return 'An unexpected authentication error occurred.';
}
