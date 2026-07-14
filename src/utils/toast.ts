export const showClearErrorToast = async (toast: any, error: any, defaultTitle: string) => {
  let message = "An error occurred";
  let description = "";

  if (error && error.response) {
    try {
      const errorJson = await error.response.clone().json();
      if (errorJson) {
        if (errorJson.message) {
          message = errorJson.message;
        }
        if (errorJson.errors) {
          if (typeof errorJson.errors === "object") {
            description = Object.values(errorJson.errors).join(", ");
          } else if (typeof errorJson.errors === "string") {
            description = errorJson.errors;
          }
        }
      }
    } catch (e) {
      if (error.message) {
        message = error.message;
      }
    }
  } else if (error && error.message) {
    message = error.message;
  }

  toast({
    variant: "destructive",
    title: defaultTitle,
    description: message + (description ? `: ${description}` : ""),
  });
};
