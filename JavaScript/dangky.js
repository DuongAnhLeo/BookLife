const API_URL = "http://localhost:3000/users";

document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const rePassword = document.getElementById("re-password").value;

    if (password !== rePassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    if (password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      const checkRes = await fetch(`${API_URL}?email=${email}`);
      const existingUsers = await checkRes.json();

      if (existingUsers.length > 0) {
        alert("Email này đã được sử dụng. Vui lòng chọn email khác!");
        return;
      }

      const username = email.split("@")[0];

      const newUser = {
        username: username,
        password: password,
        fullName: fullName,
        email: email,
        role: "user",
        avatar: "./Image/z5860363854817_ef706515bd5e3459395cb60f297df648.jpg", // Avatar mặc định
        favorites: [],
        history: [],
      };

      const registerRes = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (registerRes.ok) {
        alert("Đăng ký thành công! Hãy đăng nhập ngay.");
        window.location.href = "dangnhap.html";
      } else {
        alert("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể kết nối đến Server. Hãy kiểm tra json-server.");
    }
  });
