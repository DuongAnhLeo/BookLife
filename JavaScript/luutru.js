// check đăng nhập
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  alert("Bạn cần đăng nhập để xem kho lưu trữ!");
  window.location.href = "dangnhap.html";
}
const currentUser = JSON.parse(currentUserStr);

if (!currentUser.bookmarks) currentUser.bookmarks = [];

const API_URL = "http://localhost:3000/stories";
const USER_API_URL = "http://localhost:3000/users";

document.addEventListener("DOMContentLoaded", () => {
  const usernameEl = document.getElementById("header-username");
  const avatarEl = document.getElementById("header-avatar");
  if (usernameEl)
    usernameEl.textContent = currentUser.fullName || currentUser.username;
  if (avatarEl) avatarEl.src = currentUser.avatar || "./Image/logo.png";

  loadSavedBooks();
});

// tải sách đã lưu
async function loadSavedBooks() {
  const container = document.getElementById("storage-grid");
  const savedBookIds = currentUser.bookmarks || [];

  console.log("Danh sách ID bạn đã lưu (trong LocalStorage):", savedBookIds);

  if (savedBookIds.length === 0) {
    showEmptyState(container);
    return;
  }

  try {
    const response = await fetch(API_URL);
    const allBooks = await response.json();

    const myBooks = allBooks.filter((book) => {
      return savedBookIds.includes(Number(book.id));
    });

    console.log("Sách sau khi lọc:", myBooks);
    container.innerHTML = "";
    if (myBooks.length === 0) {
      showEmptyState(container);
      return;
    }

    // show sách
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

// kho trống
function showEmptyState(container) {
  container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; margin-top: 50px; color: #666;">
            <i class="fa-regular fa-folder-open" style="font-size: 50px; margin-bottom: 20px;"></i>
            <p>Kho lưu trữ đang trống.</p>
            <a href="index.html" style="color: #0099ff; text-decoration: underline;">Khám phá sách ngay</a>
        </div>
    `;
}

// xoá sách
async function removeBookmark(bookId) {
  if (!confirm("Bỏ cuốn này khỏi kho lưu trữ?")) return;

  const idToRemove = Number(bookId);

  currentUser.bookmarks = currentUser.bookmarks.filter(
    (id) => id !== idToRemove
  );

  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // cập nhật server
  try {
    await fetch(`${USER_API_URL}/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmarks: currentUser.bookmarks }),
    });

    loadSavedBooks();
  } catch (error) {
    console.error(error);
    alert("Lỗi kết nối server!");
  }
}
