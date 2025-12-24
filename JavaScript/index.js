const API_URL = "http://localhost:3000/stories";
const CAT_URL = "http://localhost:3000/categories";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Website đã tải xong, bắt đầu chạy JS...");

  // 1. Kiểm tra đăng nhập
  checkLoginStatus();

  // 2. Lấy tham số từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchKeyword = urlParams.get("search");
  const categoryId = urlParams.get("category");

  // 3. Tải danh mục và hiển thị thanh lọc
  fetchCategories(categoryId);

  // 4. Tải danh sách sách (Kết hợp tìm kiếm + Lọc danh mục)
  fetchBooks(searchKeyword, categoryId);

  // 5. Kích hoạt ô tìm kiếm
  setupSearchBox();
});

// --- HELPER: BỎ DẤU TIẾNG VIỆT ---
function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.toLowerCase();
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  str = str.replace(/đ/g, "d");
  return str;
}

// --- MODULE: DANH MỤC ---
async function fetchCategories(activeId) {
  const catContainer = document.getElementById("category-filter");
  if (!catContainer) return;

  try {
    const res = await fetch(CAT_URL);
    const categories = await res.json();

    catContainer.innerHTML = "";

    // 1. Nút "Tất cả"
    const allBtn = document.createElement("a");
    allBtn.className = `cat-btn ${!activeId ? "active" : ""}`;
    allBtn.innerText = "Tất cả";
    allBtn.href = "index.html"; // Bấm vào đây để reset bộ lọc
    catContainer.appendChild(allBtn);

    // 2. Các nút danh mục từ API
    categories.forEach((cat) => {
      const btn = document.createElement("a");
      // Nếu ID trên URL trùng với ID danh mục -> Thêm class active
      btn.className = `cat-btn ${activeId == cat.id ? "active" : ""}`;
      btn.innerText = cat.name;
      // Khi bấm -> Chuyển hướng thêm param ?category=...
      btn.href = `index.html?category=${cat.id}`;
      catContainer.appendChild(btn);
    });
  } catch (error) {
    console.error("Lỗi tải danh mục:", error);
    catContainer.innerHTML = "";
  }
}

// --- MODULE: TẢI SÁCH VÀ LỌC (LOGIC KÉP) ---
async function fetchBooks(keyword = null, catId = null) {
  const container = document.getElementById("book-container");
  if (!container) return;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Lỗi kết nối Server");

    let books = await response.json();
    let displayList = books;

    // --- BƯỚC 1: LỌC THEO DANH MỤC (Nếu có chọn) ---
    if (catId) {
      displayList = displayList.filter((b) => b.categoryId == catId);

      // Cập nhật tiêu đề
      const heading = document.getElementById("section-heading");
      // Chúng ta có thể fetch tên danh mục để hiển thị đẹp hơn,
      // nhưng tạm thời để đơn giản:
      if (heading) heading.textContent = "KẾT QUẢ LỌC THEO DANH MỤC";
    }

    // --- BƯỚC 2: LỌC THEO TỪ KHÓA TÌM KIẾM (Nếu có nhập) ---
    if (keyword) {
      const term = removeVietnameseTones(keyword).trim();
      displayList = displayList.filter((book) => {
        const title = removeVietnameseTones(book.title);
        const author = removeVietnameseTones(book.author);
        return title.includes(term) || author.includes(term);
      });

      // Cập nhật tiêu đề (Ưu tiên hiển thị info tìm kiếm)
      const heading = document.getElementById("section-heading");
      if (heading) heading.textContent = `TÌM KIẾM: "${keyword}"`;
    }

    // Nếu không lọc gì cả -> Đảo ngược để hiện mới nhất
    if (!keyword && !catId) {
      displayList.reverse();
    }

    // --- BƯỚC 3: RENDER RA HTML ---
    renderBookList(container, displayList);
  } catch (error) {
    console.error("Lỗi tải sách:", error);
    container.innerHTML = `<p style="grid-column: 1 / -1; color: red; text-align: center;">Không kết nối được với Server.</p>`;
  }
}

function renderBookList(container, list) {
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #666; margin-top: 20px; font-style: italic;">Không tìm thấy cuốn sách nào phù hợp.</p>`;
    return;
  }

  list.forEach((book) => {
    const card = document.createElement("div");
    card.className = "book-card";
    const imgUrl =
      book.cover || "https://via.placeholder.com/160x240?text=No+Image";

    card.innerHTML = `
          <a href="thongtinsach.html?id=${book.id}" style="text-decoration: none; color: inherit;">
              <div class="book-cover">
                  <img src="${imgUrl}" alt="${book.title}" 
                      onerror="this.src='https://via.placeholder.com/160x240?text=Lỗi+Ảnh'">
              </div>
              <div class="title" title="${book.title}">${book.title}</div>
              <div class="author">${book.author}</div>
          </a>
        `;
    container.appendChild(card);
  });
}

// --- XỬ LÝ SỰ KIỆN Ô TÌM KIẾM ---
function setupSearchBox() {
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  if (!searchInput) return;

  // Giữ lại từ khóa trên ô input
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("search")) {
    searchInput.value = urlParams.get("search");
  }

  // Lấy category hiện tại để giữ nguyên khi tìm kiếm (nếu muốn tìm trong danh mục)
  // Hoặc bỏ qua nếu muốn tìm toàn cục. Ở đây tôi chọn: Tìm kiếm sẽ reset category về tất cả để tìm rộng hơn.

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") doSearch(searchInput.value);
  });

  if (searchBtn) {
    searchBtn.addEventListener("click", () => doSearch(searchInput.value));
  }
}

function doSearch(keyword) {
  const term = keyword.trim();
  // Khi tìm kiếm, ta chuyển về trang chủ với param search, bỏ qua category để tìm toàn bộ
  if (term) {
    window.location.href = `index.html?search=${encodeURIComponent(term)}`;
  } else {
    window.location.href = "index.html";
  }
}

// --- KIỂM TRA ĐĂNG NHẬP & QUYỀN ADMIN ---
function checkLoginStatus() {
  const userJson = localStorage.getItem("currentUser");
  const guestAction = document.getElementById("guest-action");
  const userAction = document.getElementById("user-action");
  const btnAdmin = document.getElementById("btn-admin-panel");

  if (userJson) {
    const user = JSON.parse(userJson);

    if (guestAction) guestAction.style.display = "none";
    if (userAction) userAction.style.display = "flex";

    const avatar = document.getElementById("header-avatar");
    const name = document.getElementById("header-username");
    if (avatar) avatar.src = user.avatar || "./Image/logo.png";
    if (name) name.textContent = user.fullName || user.username;

    if (user.role === "admin" && btnAdmin) {
      btnAdmin.style.display = "flex";
    } else if (btnAdmin) {
      btnAdmin.style.display = "none";
    }

    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
      btnLogout.onclick = () => {
        if (confirm("Bạn có chắc muốn đăng xuất?")) {
          localStorage.removeItem("currentUser");
          window.location.href = "index.html";
        }
      };
    }
  } else {
    if (guestAction) guestAction.style.display = "flex";
    if (userAction) userAction.style.display = "none";
    if (btnAdmin) btnAdmin.style.display = "none";
  }
}
