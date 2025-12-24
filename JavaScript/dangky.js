const API_URL = "http://localhost:3000/users";

document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault(); // Ngăn trình duyệt load lại trang

    // 1. Lấy dữ liệu từ form
    const fullName = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const rePassword = document.getElementById("re-password").value;

    // 2. Kiểm tra mật khẩu khớp nhau
    if (password !== rePassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    if (password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      // 3. Kiểm tra xem email đã tồn tại chưa
      // Gọi API lấy danh sách user có email trùng khớp
      const checkRes = await fetch(`${API_URL}?email=${email}`);
      const existingUsers = await checkRes.json();

      if (existingUsers.length > 0) {
        alert("Email này đã được sử dụng. Vui lòng chọn email khác!");
        return;
      }

      // 4. Tạo đối tượng User mới
      // Tự động tạo username từ phần đầu của email (ví dụ: duonganh@gmail.com -> duonganh)
      const username = email.split("@")[0];

      const newUser = {
        username: username,
        password: password,
        fullName: fullName,
        email: email,
        role: "user", // Mặc định là user thường
        avatar: "./Image/z5860363854817_ef706515bd5e3459395cb60f297df648.jpg", // Avatar mặc định
        favorites: [], // Danh sách yêu thích rỗng
        history: [], // Lịch sử đọc rỗng
      };

      // 5. Gửi dữ liệu lên Server (POST)
      const registerRes = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (registerRes.ok) {
        alert("Đăng ký thành công! Hãy đăng nhập ngay.");
        window.location.href = "dangnhap.html"; // Chuyển sang trang đăng nhập
      } else {
        alert("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể kết nối đến Server. Hãy kiểm tra json-server.");
    }
  });
