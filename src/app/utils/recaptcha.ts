// Get the site key from environment variables
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

if (!RECAPTCHA_SITE_KEY) {
  throw new Error(
    "NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined in environment variables"
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

    if (typeof window.grecaptcha !== "undefined" && window.grecaptcha.render) {
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
    sitekey: RECAPTCHA_SITE_KEY,
    callback: onVerify,
    "expired-callback": onExpired,
  });

  return widgetId;
};

export const resetRecaptcha = (widgetId: number) => {
  if (widgetId !== null) {
    window.grecaptcha?.reset(widgetId);
  }
};

export const getRecaptchaResponse = (widgetId: number): string => {
  return window.grecaptcha?.getResponse(widgetId) || "";
};

// Function to clear the widget ID when component unmounts
export const clearRecaptchaWidget = () => {
  widgetId = null;
};
