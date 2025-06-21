// Get the site key from environment variables
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Check if reCAPTCHA is properly configured
const isRecaptchaConfigured = !!RECAPTCHA_SITE_KEY;

if (!isRecaptchaConfigured) {
  console.warn(
    "NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined. reCAPTCHA will be disabled."
  );
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
        }
      ) => number;
      reset: (widgetId: number) => void;
      getResponse: (widgetId: number) => string;
    };
  }
}

let widgetId: number | null = null;

const waitForRecaptcha = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (
      typeof window.grecaptcha !== "undefined" &&
      typeof window.grecaptcha.render === "function"
    ) {
      resolve();
      return;
    }

    // If reCAPTCHA is not configured, resolve immediately
    if (!isRecaptchaConfigured) {
      resolve();
      return;
    }

    window.grecaptcha?.ready(() => {
      resolve();
    });
  });
};

// Helper function to check if a widget exists in a container
const hasWidgetInContainer = (container: HTMLElement): boolean => {
  return container.querySelector(".grecaptcha-badge") !== null;
};

export const renderRecaptcha = async (
  elementId: string,
  onVerify: (token: string) => void,
  onExpired: () => void
): Promise<number> => {
  // If reCAPTCHA is not configured, return a dummy widget ID
  if (!isRecaptchaConfigured) {
    console.warn("reCAPTCHA is not configured. Skipping render.");
    return -1;
  }

  // Wait for reCAPTCHA to be ready
  await waitForRecaptcha();

  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  // If there's already a widget in the container, don't try to render again
  if (container.querySelector(".grecaptcha-badge")) {
    return widgetId!;
  }

  // Only render if there isn't already a widget
  widgetId = window.grecaptcha.render(elementId, {
    sitekey: RECAPTCHA_SITE_KEY!,
    callback: onVerify,
    "expired-callback": onExpired,
  });

  return widgetId;
};

export const resetRecaptcha = (widgetId: number) => {
  if (widgetId !== null && widgetId !== -1 && isRecaptchaConfigured) {
    window.grecaptcha?.reset(widgetId);
  }
};

export const getRecaptchaResponse = (widgetId: number): string => {
  if (!isRecaptchaConfigured) {
    return "dummy-token"; // Return a dummy token when reCAPTCHA is not configured
  }
  return window.grecaptcha?.getResponse(widgetId) || "";
};

// Function to clear the widget ID when component unmounts
export const clearRecaptchaWidget = () => {
  widgetId = null;
};

// Export a function to check if reCAPTCHA is configured
export const isRecaptchaEnabled = () => isRecaptchaConfigured;
