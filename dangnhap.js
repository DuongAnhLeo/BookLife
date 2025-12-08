document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.getElementById("togglePassword");

  if (passwordInput && toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      // Kiểm tra trạng thái hiện tại
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";

      // Đổi type của input
      passwordInput.setAttribute("type", type);

      // Đổi icon (Mắt mở / Mắt đóng)
      // classList.toggle tự động thêm nếu chưa có, xóa nếu đã có
      toggleBtn.classList.toggle("fa-eye");
      toggleBtn.classList.toggle("fa-eye-slash");
    });
  }
});
