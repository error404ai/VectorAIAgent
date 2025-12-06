import authManager from "./authManager";

export function authHeader(isImage: boolean = false) {
  const token = authManager.getAccessToken();

  if (token) {
    if (isImage !== null && isImage) {
      return {
        Authorization: `Bearer ${token}`,
      };
    } else {
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
    }
  } else {
    return {};
  }
}
