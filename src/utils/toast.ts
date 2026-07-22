export const showClearErrorToast = async (arg1: any, arg2: any, defaultTitle: string = "Error") => {
  let toastFn: any;
  let errorObj: any;

  if (typeof arg1 === "function") {
    toastFn = arg1;
    errorObj = arg2;
  } else if (typeof arg2 === "function") {
    toastFn = arg2;
    errorObj = arg1;
  } else {
    console.error("showClearErrorToast: No valid toast function provided", arg1, arg2);
    return;
  }

  let message = "An error occurred";
  let description = "";

  if (errorObj && errorObj.response) {
    try {
      const errorJson = await errorObj.response.clone().json();
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
      if (errorObj.message) {
        message = errorObj.message;
      }
    }
  } else if (errorObj && errorObj.message) {
    message = errorObj.message;
  } else if (typeof errorObj === "string") {
    message = errorObj;
  }

  toastFn({
    variant: "destructive",
    title: defaultTitle,
    description: message + (description ? `: ${description}` : ""),
  });
};
