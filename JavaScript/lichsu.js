// --- 1. KIỂM TRA ĐĂNG NHẬP ---
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  alert("Bạn cần đăng nhập để xem lịch sử!");
  window.location.href = "dangnhap.html";
}
const currentUser = JSON.parse(currentUserStr);

// Đảm bảo có mảng history
if (!currentUser.history) currentUser.history = [];

// --- 2. CẤU HÌNH API ---
const API_URL = "http://localhost:3000/stories";
const USER_API_URL = "http://localhost:3000/users";

document.addEventListener("DOMContentLoaded", () => {
  // Hiển thị thông tin Header
  const usernameEl = document.getElementById("header-username");
  const avatarEl = document.getElementById("header-avatar");
  if (usernameEl)
    usernameEl.textContent = currentUser.fullName || currentUser.username;
  if (avatarEl) avatarEl.src = currentUser.avatar || "./Image/logo.png";

  loadHistoryBooks();
});

// --- 3. TẢI LỊCH SỬ (LOGIC CHẮC CHẮN ĐÚNG) ---
async function loadHistoryBooks() {
  const container = document.getElementById("history-grid");
  const historyIds = currentUser.history || [];

  console.log("Danh sách ID lịch sử:", historyIds);

  // TRƯỜNG HỢP 1: Lịch sử trống
  if (historyIds.length === 0) {
    showEmptyState(container);
    return;
  }

  try {
    // Lấy TOÀN BỘ sách về để tự lọc
    const response = await fetch(API_URL);
    const allBooks = await response.json();

    // LOGIC LỌC MỚI (SỬA LỖI):
    // Duyệt qua từng ID trong lịch sử, tìm cuốn sách tương ứng trong kho
    const historyBooks = historyIds
      .map((historyId) => {
        // Dùng .find() và ép kiểu Number() cho cả 2 vế để so sánh chính xác
        return allBooks.find((book) => Number(book.id) === Number(historyId));
      })
      .filter((book) => book !== undefined); // Loại bỏ những kết quả không tìm thấy (undefined)

    console.log("Sách tìm được:", historyBooks);

    // Xóa loading
    container.innerHTML = "";

    if (historyBooks.length === 0) {
      showEmptyState(container);
      return;
    }

    // Vẽ sách ra màn hình
    historyBooks.forEach((book) => {
      const card = document.createElement("div");
      card.className = "book-card";
      card.innerHTML = `
                <div class="book-cover" style="position: relative;">
                    <a href="docsach.html?id=${book.id}" style="display:block; height:100%;">
                        <img src="${book.cover}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x220?text=No+Image'">
                    </a>
                    
                    <button onclick="removeHistoryItem(${book.id})" title="Xóa khỏi lịch sử"
                        style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; z-index: 10;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    
                    <div style="position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(0, 153, 255, 0.9); color: white; text-align: center; padding: 5px 0; font-size: 12px; pointer-events: none;">
                        Đọc tiếp
                    </div>
                </div>
                <a href="docsach.html?id=${book.id}" style="text-decoration: none; color: inherit;">
                    <h3 class="title" style="margin-top: 10px; font-size: 16px; font-weight: bold;">${book.title}</h3>
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

function showEmptyState(container) {
  container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; margin-top: 50px; color: #666;">
            <i class="fa-solid fa-clock-rotate-left" style="font-size: 50px; margin-bottom: 20px;"></i>
            <p>Bạn chưa đọc cuốn sách nào.</p>
            <a href="index.html" style="color: #0099ff; text-decoration: underline;">Đọc sách ngay</a>
        </div>
    `;
}

// --- 4. XÓA 1 MỤC LỊCH SỬ ---
async function removeHistoryItem(bookId) {
  if (!confirm("Xóa cuốn này khỏi lịch sử đọc?")) return;

  // Ép kiểu số để lọc chính xác
  const idToRemove = Number(bookId);
  currentUser.history = currentUser.history.filter(
    (id) => Number(id) !== idToRemove
  );

  await saveHistory();
  loadHistoryBooks();
}

// --- 5. XÓA TẤT CẢ ---
async function clearAllHistory() {
  if (!confirm("Xóa TOÀN BỘ lịch sử đọc?")) return;

  currentUser.history = [];
  await saveHistory();
  loadHistoryBooks();
}

// Hàm lưu chung lên Server & LocalStorage
async function saveHistory() {
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  try {
    await fetch(`${USER_API_URL}/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: currentUser.history }),
    });
  } catch (error) {
    console.error(error);
    alert("Lỗi khi cập nhật dữ liệu!");
  }
}
