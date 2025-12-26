// check đăng nhập
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  alert("Vui lòng đăng nhập!");
  window.location.href = "dangnhap.html";
}
let currentUser = JSON.parse(currentUserStr);

const USER_API_URL = "http://localhost:3000/users";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("header-username").textContent =
    currentUser.fullName || currentUser.username;
  document.getElementById("header-avatar").src =
    currentUser.avatar || "./Image/logo.png";

  loadProfileData();

  document.getElementById("btn-logout-page").addEventListener("click", () => {
    if (confirm("Bạn chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    }
  });

  document
    .getElementById("profile-form")
    .addEventListener("submit", handleUpdateProfile);
});

function loadProfileData() {
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

  const updateData = {
    fullName: newName,
    avatar: newAvatar,
  };

  if (newPass) {
    if (newPass.length < 6) {
      alert("Mật khẩu mới phải từ 6 ký tự trở lên!");
      return;
    }
    updateData.password = newPass;
  }

  try {
    const response = await fetch(`${USER_API_URL}/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      currentUser.fullName = newName;
      currentUser.avatar = newAvatar;
      if (newPass) currentUser.password = newPass;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      alert("Cập nhật thông tin thành công!");
      window.location.reload();
    } else {
      alert("Lỗi khi cập nhật!");
    }
  } catch (error) {
    console.error(error);
    alert("Lỗi kết nối Server!");
  }
}
