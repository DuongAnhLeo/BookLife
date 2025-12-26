const API_URL = "http://localhost:3000/users";

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(
      `${API_URL}?email=${email}&password=${password}`
    );
    const users = await response.json();

    if (users.length > 0) {
      const user = users[0];
      localStorage.setItem("currentUser", JSON.stringify(user));

      if (user.role === "admin") {
        alert(`Xin chào Admin ${user.fullName}!`);
        window.location.href = "admin.html";
      } else {
        alert(`Xin chào ${user.fullName}, chúc bạn đọc sách vui vẻ!`);
        window.location.href = "index.html";
      }
    } else {
      alert("Email hoặc mật khẩu không chính xác!");
    }
  } catch (error) {
    console.error("Lỗi:", error);
    alert("Lỗi kết nối Server! Hãy kiểm tra xem json-server đã bật chưa.");
  }
});
