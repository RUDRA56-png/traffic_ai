const login = async (credentials) => {
  try {
    const res = await fetch(
      "https://traffic-ai-fpya.onrender.com/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
      }
    );

    if (!res.ok) {
      throw new Error("Invalid credentials");
    }

    const data = await res.json();

    // ✅ Save token
    localStorage.setItem("jwt", data.token);
    localStorage.setItem("user_role", data.role);
    localStorage.setItem("username", data.username);

    setUser({
      token: data.token,
      role: data.role.replace("ROLE_", ""),
      username: data.username
    });

    return data.role.replace("ROLE_", "");

  } catch (err) {
    console.error(err);
    throw new Error("Network Error");
  }
};