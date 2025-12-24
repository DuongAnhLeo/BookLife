const API_URL = "http://localhost:3000/users";

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    // Gọi API tìm user có email và password trùng khớp
    const response = await fetch(
      `${API_URL}?email=${email}&password=${password}`
    );
    const users = await response.json();

    if (users.length > 0) {
      const user = users[0];

      // LƯU THÔNG TIN ĐĂNG NHẬP
      localStorage.setItem("currentUser", JSON.stringify(user));

      // --- SỬA Ở ĐÂY: KIỂM TRA QUYỀN (ROLE) ---
      if (user.role === "admin") {
        alert(`Xin chào Admin ${user.fullName}!`);
        // Thay 'admin.html' bằng tên file trang quản trị của bạn
        window.location.href = "admin.html";
      } else {
        alert(`Xin chào ${user.fullName}, chúc bạn đọc sách vui vẻ!`);
        window.location.href = "index.html"; // Khách thường về trang chủ
      }
    } else {
      alert("Email hoặc mật khẩu không chính xác!");
    }
  } catch (error) {
    console.error("Lỗi:", error);
    alert("Lỗi kết nối Server! Hãy kiểm tra xem json-server đã bật chưa.");
  }
});
