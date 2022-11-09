interface AuthHeader {
  Authorization?: string;
}

interface LoginFields {
  email: string;
  password: string;
}

interface LoginResponse {
  error?: string;
  token?: string;
}

export const formAuthHeader = (): AuthHeader => {
  const localStorageToken = localStorage.getItem('token');

  if (!localStorageToken) {
    return {};
  }

  let token;

  try {
    token = JSON.parse(localStorageToken);
  } catch (err) {
    return {};
  }

  return { Authorization: `Bearer ${token}` };
};

export const login = async ({ email, password }: LoginFields): Promise<LoginResponse> => {
  const res = await fetch('/login', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const json = await res.json();

  return json;
};
