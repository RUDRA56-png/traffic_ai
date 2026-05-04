const login = async (credentials) => {
  try {
    const res = await authAPI.login(credentials)

    console.log("FULL RESPONSE:", res)        // 🔥 debug
    console.log("DATA:", res.data)

    // 🔥 Handle both formats safely
    const token =
      res.data?.token ||
      res.data?.jwt ||
      res.data?.accessToken

    const role =
      res.data?.role ||
      res.data?.roles?.[0] ||
      "USER"

    const username =
      res.data?.username ||
      res.data?.user ||
      credentials.username

    if (!token) {
      throw new Error("Token not found in response")
    }

    const cleanRole = role.replace("ROLE_", "")

    // 🔥 FORCE SAVE
    localStorage.setItem("jwt", token)
    localStorage.setItem("user_role", cleanRole)
    localStorage.setItem("username", username)

    console.log("SAVED TOKEN:", localStorage.getItem("jwt"))

    setUser({
      token,
      role: cleanRole,
      username
    })

    return cleanRole

  } catch (err) {
    console.error("LOGIN ERROR:", err)

    throw new Error(
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Login failed"
    )
  }
}