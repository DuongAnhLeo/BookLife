// --- 1. KIỂM TRA ĐĂNG NHẬP ---
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  alert("Bạn cần đăng nhập để xem thông tin sách!");
  window.location.href = "dangnhap.html";
}
const currentUser = JSON.parse(currentUserStr);

// Đảm bảo user có đủ các trường dữ liệu
if (!currentUser.favorites) currentUser.favorites = [];
if (!currentUser.bookmarks) currentUser.bookmarks = [];

const API_URL = "http://localhost:3000/stories";
const USER_API_URL = "http://localhost:3000/users";

document.addEventListener("DOMContentLoaded", () => {
  // --- CẬP NHẬT HEADER (AVATAR & TÊN) ---
  updateHeaderUI();

  // --- XỬ LÝ ID SÁCH ---
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("id");

  if (bookId) {
    fetchBookDetail(bookId);
  } else {
    alert("Không tìm thấy ID sách!");
    window.location.href = "index.html";
  }
});

// --- HÀM CẬP NHẬT GIAO DIỆN HEADER (MỚI THÊM) ---
function updateHeaderUI() {
  // 1. Cập nhật Avatar và Tên
  const avatarEl = document.getElementById("header-avatar");
  const nameEl = document.getElementById("header-username");

  if (avatarEl) {
    // Nếu user có avatar thì dùng, không thì dùng logo mặc định
    avatarEl.src = currentUser.avatar || "./Image/logo.png";
  }
  if (nameEl) {
    // Ưu tiên hiện tên đầy đủ, nếu không có thì hiện username
    nameEl.textContent = currentUser.fullName || currentUser.username;
  }

  // 2. Xử lý nút Đăng xuất (ở Sidebar)
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
      }
    });
  }
}

// --- CÁC HÀM CŨ (Giữ nguyên logic của bạn) ---

async function fetchBookDetail(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error("Không tìm thấy sách");

    const book = await response.json();

    displayBookDetail(book);

    // Kích hoạt nút
    setupBookmarkButton(book.id);
    setupHeartButton(book.id);
  } catch (error) {
    console.error(error);
    document.getElementById("book-detail-content").innerHTML = `
            <div style="text-align: center; color: red; margin-top: 50px;">
                <h2>⚠️ Không tìm thấy thông tin sách!</h2>
                <a href="index.html">Quay lại trang chủ</a>
            </div>
        `;
  }
}

function displayBookDetail(book) {
  const imgEl = document.getElementById("book-cover");
  imgEl.src = book.cover;
  imgEl.alt = book.title;

  document.getElementById("book-title").textContent = book.title;
  document.getElementById("book-author").textContent = book.author;
  document.getElementById("book-status").textContent = book.status;
  document.getElementById("book-desc").textContent = book.description;
  document.getElementById("book-rating").textContent = book.rating;
  document.getElementById(
    "book-views"
  ).textContent = `• ${book.views} lượt xem`;

  const readBtn = document.getElementById("btn-read-link");
  readBtn.href = `docsach.html?id=${book.id}`;
}

// --- XỬ LÝ BOOKMARK ---
function setupBookmarkButton(bookId) {
  const btnSave = document.getElementById("btn-save");
  const bookIdNumber = Number(bookId); // Đảm bảo so sánh số với số

  let isSaved = currentUser.bookmarks.includes(bookIdNumber);
  updateBookmarkIcon(btnSave, isSaved);

  btnSave.onclick = async () => {
    if (isSaved) {
      currentUser.bookmarks = currentUser.bookmarks.filter(
        (id) => id !== bookIdNumber
      );
      isSaved = false;
      alert("Đã bỏ sách khỏi kho lưu trữ!");
    } else {
      currentUser.bookmarks.push(bookIdNumber);
      isSaved = true;
      alert("Đã lưu sách vào kho thành công!");
    }
    updateBookmarkIcon(btnSave, isSaved);
    await saveUserData();
  };
}

function updateBookmarkIcon(btn, isSaved) {
  if (isSaved) {
    btn.classList.remove("fa-regular");
    btn.classList.add("fa-solid");
    btn.style.color = "#0099ff";
  } else {
    btn.classList.remove("fa-solid");
    btn.classList.add("fa-regular");
    btn.style.color = "";
  }
}

// --- XỬ LÝ TIM ---
function setupHeartButton(bookId) {
  const btnHeart = document.querySelector(".fa-heart");
  const bookIdNumber = Number(bookId);

  let isLoved = currentUser.favorites.includes(bookIdNumber);
  updateHeartIcon(btnHeart, isLoved);

  btnHeart.onclick = async () => {
    if (isLoved) {
      currentUser.favorites = currentUser.favorites.filter(
        (id) => id !== bookIdNumber
      );
      isLoved = false;
    } else {
      currentUser.favorites.push(bookIdNumber);
      isLoved = true;
    }
    updateHeartIcon(btnHeart, isLoved);
    await saveUserData();
  };
}

function updateHeartIcon(btn, isLoved) {
  if (isLoved) {
    btn.classList.remove("fa-regular");
    btn.classList.add("fa-solid");
    btn.style.color = "red";
  } else {
    btn.classList.remove("fa-solid");
    btn.classList.add("fa-regular");
    btn.style.color = "";
  }
}

// --- LƯU DỮ LIỆU ---
async function saveUserData() {
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  try {
    await fetch(`${USER_API_URL}/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookmarks: currentUser.bookmarks,
        favorites: currentUser.favorites,
      }),
    });
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu user:", error);
  }
}
