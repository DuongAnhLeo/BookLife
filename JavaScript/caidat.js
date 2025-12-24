// --- 1. KIỂM TRA ĐĂNG NHẬP ---
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  alert("Vui lòng đăng nhập!");
  window.location.href = "dangnhap.html";
}
let currentUser = JSON.parse(currentUserStr);

const USER_API_URL = "http://localhost:3000/users";

document.addEventListener("DOMContentLoaded", () => {
  // Hiển thị thông tin lên Header (cho đẹp)
  document.getElementById("header-username").textContent =
    currentUser.fullName || currentUser.username;
  document.getElementById("header-avatar").src =
    currentUser.avatar || "./Image/logo.png";

  // Hiển thị thông tin lên Form cài đặt
  loadProfileData();

  // Xử lý nút Đăng xuất
  document.getElementById("btn-logout-page").addEventListener("click", () => {
    if (confirm("Bạn chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    }
  });

  // Xử lý nút Lưu thay đổi
  document
    .getElementById("profile-form")
    .addEventListener("submit", handleUpdateProfile);
});

function loadProfileData() {
  // Điền dữ liệu từ currentUser vào các ô input
  document.getElementById("setting-avatar").src =
    currentUser.avatar || "./Image/logo.png";
  document.getElementById("setting-name").textContent = currentUser.fullName;

  document.getElementById("email").value = currentUser.email;
  document.getElementById("fullname").value = currentUser.fullName;
  document.getElementById("avatar-url").value = currentUser.avatar || "";
}

async function handleUpdateProfile(e) {
  e.preventDefault();

  const newName = document.getElementById("fullname").value.trim();
  const newPass = document.getElementById("new-password").value.trim();
  const newAvatar = document.getElementById("avatar-url").value.trim();

  if (!newName) {
    alert("Tên không được để trống!");
    return;
  }

  // Tạo object chứa thông tin cần cập nhật
  const updateData = {
    fullName: newName,
    avatar: newAvatar,
  };

  // Nếu người dùng có nhập mật khẩu mới thì mới cập nhật
  if (newPass) {
    if (newPass.length < 6) {
      alert("Mật khẩu mới phải từ 6 ký tự trở lên!");
      return;
    }
    updateData.password = newPass;
  }

  try {
    // 1. Cập nhật lên Server
    const response = await fetch(`${USER_API_URL}/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      // 2. Cập nhật thành công -> Cập nhật lại LocalStorage
      // (Chúng ta phải cập nhật LocalStorage để khi load lại trang nó không bị cũ)
      currentUser.fullName = newName;
      currentUser.avatar = newAvatar;
      if (newPass) currentUser.password = newPass; // (Lưu ý: Thực tế không nên lưu pass trong localstorage, nhưng đây là bài học cơ bản)

      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      alert("Cập nhật thông tin thành công!");

      // Tải lại trang để thấy thay đổi
      window.location.reload();
    } else {
      alert("Lỗi khi cập nhật!");
    }
  } catch (error) {
    console.error(error);
    alert("Lỗi kết nối Server!");
  }
}
