export const setToken = (token: string) => {
  localStorage.setItem("billmate_token", token);
};

export const getToken = () => {
  return localStorage.getItem("billmate_token");
};

export const clearToken = () => {
  localStorage.removeItem("billmate_token");
};
