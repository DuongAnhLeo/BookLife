const API_URL = "http://localhost:3000/stories";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Website đã tải xong, bắt đầu chạy JS...");

  // 1. Kiểm tra đăng nhập (đã nâng cấp logic admin)
  checkLoginStatus();

  // 2. Kiểm tra từ khóa tìm kiếm trên URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchKeyword = urlParams.get("search");

  // 3. Tải và hiển thị sách
  fetchBooks(searchKeyword);

  // 4. Kích hoạt ô tìm kiếm
  setupSearchBox();
});

// --- HÀM XỬ LÝ TIẾNG VIỆT ---
function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.toLowerCase();
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  str = str.replace(/đ/g, "d");
  return str;
}

// --- HÀM TẢI SÁCH & TÌM KIẾM ---
async function fetchBooks(keyword = null) {
  const container = document.getElementById("book-container");

  if (!container) {
    console.error("LỖI: Không tìm thấy thẻ có id='book-container'!");
    return;
  }

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Lỗi kết nối Server");

    let books = await response.json();
    let displayList = [];

    if (keyword) {
      const term = removeVietnameseTones(keyword);
      const heading = document.getElementById("section-heading");
      if (heading) heading.textContent = `KẾT QUẢ TÌM KIẾM: "${keyword}"`;

      const viewMore = document.querySelector(".view-more");
      if (viewMore) viewMore.style.display = "none";

      displayList = books.filter((book) => {
        const title = removeVietnameseTones(book.title);
        const author = removeVietnameseTones(book.author);
        return title.includes(term) || author.includes(term);
      });
    } else {
      displayList = books.slice().reverse();
    }

    container.innerHTML = "";

    if (displayList.length === 0) {
      container.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #666; margin-top: 20px;">Không tìm thấy cuốn sách nào phù hợp.</p>`;
      return;
    }

    displayList.forEach((book) => {
      const card = document.createElement("div");
      card.className = "book-card";
      const imgUrl =
        book.cover || "https://via.placeholder.com/160x240?text=No+Image";

      // Chuyển hướng sang trang thông tin với ID sách
      card.innerHTML = `
        <a href="thongtinsach.html?id=${book.id}" style="text-decoration: none; color: inherit;">
            <div class="book-cover">
                <img src="${imgUrl}" alt="${book.title}" 
                     style="width: 100%; height: 100%; object-fit: cover;" 
                     onerror="this.src='https://via.placeholder.com/160x240?text=Lỗi+Ảnh'">
            </div>
            <div class="title" title="${book.title}">${book.title}</div>
            <div class="author">${book.author}</div>
        </a>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Lỗi tải sách:", error);
    container.innerHTML = `<p style="grid-column: 1 / -1; color: red; text-align: center;">Lỗi tải dữ liệu. Hãy kiểm tra lại Server.</p>`;
  }
}

// --- XỬ LÝ SỰ KIỆN TÌM KIẾM ---
function setupSearchBox() {
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  if (!searchInput) return;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("search")) {
    searchInput.value = urlParams.get("search");
  }

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") doSearch(searchInput.value);
  });

  if (searchBtn) {
    searchBtn.addEventListener("click", () => doSearch(searchInput.value));
  }
}

function doSearch(keyword) {
  const term = keyword.trim();
  if (term) {
    window.location.href = `index.html?search=${encodeURIComponent(term)}`;
  } else {
    window.location.href = "index.html";
  }
}

// --- KIỂM TRA ĐĂNG NHẬP & HIỂN THỊ NÚT ADMIN ---
function checkLoginStatus() {
  const userJson = localStorage.getItem("currentUser");
  const guestAction = document.getElementById("guest-action");
  const userAction = document.getElementById("user-action");
  const btnAdmin = document.getElementById("btn-admin-panel"); // Lấy nút Admin

  if (userJson) {
    const user = JSON.parse(userJson);

    // 1. Hiển thị UI người dùng
    if (guestAction) guestAction.style.display = "none";
    if (userAction) userAction.style.display = "flex";

    const avatar = document.getElementById("header-avatar");
    const name = document.getElementById("header-username");
    if (avatar) avatar.src = user.avatar || "./Image/logo.png";
    if (name) name.textContent = user.fullName || user.username;

    // 2. Logic Admin: Nếu role là admin thì hiện nút
    if (user.role === "admin" && btnAdmin) {
      btnAdmin.style.display = "flex"; // Hiện nút Admin Panel
    } else if (btnAdmin) {
      btnAdmin.style.display = "none"; // Ẩn nút nếu là user thường
    }

    // 3. Xử lý đăng xuất
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
      btnLogout.onclick = () => {
        if (confirm("Bạn muốn đăng xuất?")) {
          localStorage.removeItem("currentUser");
          window.location.href = "index.html";
        }
      };
    }
  } else {
    // Chưa đăng nhập
    if (guestAction) guestAction.style.display = "flex";
    if (userAction) userAction.style.display = "none";
    if (btnAdmin) btnAdmin.style.display = "none";
  }
}
