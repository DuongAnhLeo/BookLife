// Hàm xử lý ẩn/hiện mật khẩu
function togglePass(inputId, icon) {
  const input = document.getElementById(inputId);

  if (input.type === "password") {
    // Chuyển sang text để hiện mật khẩu
    input.type = "text";
    // Đổi icon sang con mắt mở
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  } else {
    // Chuyển lại password để ẩn
    input.type = "password";
    // Đổi icon sang con mắt gạch chéo
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  }
}
