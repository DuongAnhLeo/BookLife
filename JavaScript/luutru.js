// --- 1. KIỂM TRA ĐĂNG NHẬP ---
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  alert("Bạn cần đăng nhập để xem kho lưu trữ!");
  window.location.href = "dangnhap.html";
}
const currentUser = JSON.parse(currentUserStr);

// Đảm bảo mảng bookmarks tồn tại
if (!currentUser.bookmarks) currentUser.bookmarks = [];

// --- 2. CẤU HÌNH API ---
const API_URL = "http://localhost:3000/stories";
const USER_API_URL = "http://localhost:3000/users";

document.addEventListener("DOMContentLoaded", () => {
  // Hiển thị header
  const usernameEl = document.getElementById("header-username");
  const avatarEl = document.getElementById("header-avatar");
  if (usernameEl)
    usernameEl.textContent = currentUser.fullName || currentUser.username;
  if (avatarEl) avatarEl.src = currentUser.avatar || "./Image/logo.png";

  // Tải sách
  loadSavedBooks();
});

// --- 3. HÀM TẢI SÁCH ĐÃ LƯU (LOGIC MỚI - TỰ LỌC) ---
async function loadSavedBooks() {
  const container = document.getElementById("storage-grid");
  const savedBookIds = currentUser.bookmarks || [];

  console.log("Danh sách ID bạn đã lưu (trong LocalStorage):", savedBookIds);

  // TRƯỜNG HỢP 1: Danh sách rỗng
  if (savedBookIds.length === 0) {
    showEmptyState(container);
    return;
  }

  try {
    // CHIẾN THUẬT MỚI: Gọi tất cả sách về, sau đó JS tự lọc
    // Cách này đảm bảo không bao giờ bị lỗi hiển thị nhầm toàn bộ sách
    const response = await fetch(API_URL);
    const allBooks = await response.json();

    // Tự lọc bằng Javascript:
    // Chỉ lấy những sách mà ID của nó NẰM TRONG danh sách savedBookIds
    const myBooks = allBooks.filter((book) => {
      // Chuyển về số (Number) để so sánh cho chính xác (tránh lỗi '1' khác 1)
      return savedBookIds.includes(Number(book.id));
    });

    console.log("Sách sau khi lọc:", myBooks);

    // Xóa nội dung cũ
    container.innerHTML = "";

    if (myBooks.length === 0) {
      // Trường hợp có ID lưu nhưng ID đó không khớp cuốn sách nào (sách bị xóa)
      showEmptyState(container);
      return;
    }

    // Vẽ danh sách sách đã lọc
    myBooks.forEach((book) => {
      const card = document.createElement("div");
      card.className = "book-card";
      card.innerHTML = `
                <div class="book-cover" style="position: relative;">
                    <a href="thongtinsach.html?id=${book.id}" style="display:block; height:100%;">
                        <img src="${book.cover}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x220?text=No+Image'">
                    </a>
                    
                    <button onclick="removeBookmark(${book.id})" title="Bỏ lưu"
                        style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; z-index: 10;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <a href="thongtinsach.html?id=${book.id}" style="text-decoration: none; color: inherit;">
                    <h3 class="title" style="margin-top: 10px; font-size: 16px; font-weight: bold;">${book.title}</h3>
                    <p class="author" style="color: #666; font-size: 14px;">${book.author}</p>
                </a>
            `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Lỗi:", error);
    container.innerHTML =
      '<p style="color:red; text-align:center;">Lỗi kết nối Server.</p>';
  }
}

// Hàm hiển thị khi trống
function showEmptyState(container) {
  container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; margin-top: 50px; color: #666;">
            <i class="fa-regular fa-folder-open" style="font-size: 50px; margin-bottom: 20px;"></i>
            <p>Kho lưu trữ đang trống.</p>
            <a href="index.html" style="color: #0099ff; text-decoration: underline;">Khám phá sách ngay</a>
        </div>
    `;
}

// --- 4. HÀM XÓA SÁCH (BỎ BOOKMARK) ---
async function removeBookmark(bookId) {
  if (!confirm("Bỏ cuốn này khỏi kho lưu trữ?")) return;

  // Chuyển đổi bookId sang số để đảm bảo xóa đúng
  const idToRemove = Number(bookId);

  // Xóa khỏi mảng bookmarks
  currentUser.bookmarks = currentUser.bookmarks.filter(
    (id) => id !== idToRemove
  );

  // Cập nhật LocalStorage
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // Cập nhật Server
  try {
    await fetch(`${USER_API_URL}/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmarks: currentUser.bookmarks }),
    });

    // Tải lại giao diện
    loadSavedBooks();
  } catch (error) {
    console.error(error);
    alert("Lỗi kết nối server!");
  }
}
