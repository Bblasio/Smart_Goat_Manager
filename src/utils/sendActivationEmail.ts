/**
 * Helper to dispatch account activation emails to the farmer's registered email address.
 */
export async function sendActivationEmail(
  email: string,
  farmName: string = 'Smart Goat Farm'
): Promise<{ success: boolean; message: string }> {
  try {
    const activationUrl = window.location.origin + '?activated=true&email=' + encodeURIComponent(email.trim());
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email.trim())}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: `Activate Your Farm Account — ${farmName}`,
        email: email.trim(),
        farm_name: farmName.trim(),
        activation_link: activationUrl,
        message: `Hello,\n\nThank you for registering your farm "${farmName}" on Smart Goat Management System.\n\nPlease click the activation link below to activate your farm account:\n${activationUrl}\n\nOnce activated, you can log in to manage your herd, breeding schedules, milk yields, and health records.\n\nSmart Goat Management System`,
      }),
    });

    if (response.ok) {
      return {
        success: true,
        message: `Activation email dispatched to ${email}.`,
      };
    } else {
      return {
        success: false,
        message: `Email dispatch reported status ${response.status}.`,
      };
    }
  } catch (err: any) {
    console.warn('Activation email push error:', err);
    return {
      success: false,
      message: err.message || 'Could not push email automatically.',
    };
  }
}
