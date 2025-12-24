const API_URL = "http://localhost:3000/stories";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Website đã tải xong, bắt đầu chạy JS...");

  // 1. Kiểm tra đăng nhập
  checkLoginStatus();

  // 2. Kiểm tra từ khóa tìm kiếm trên URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchKeyword = urlParams.get("search");

  // 3. Tải và hiển thị sách (có lọc nếu có từ khóa)
  fetchBooks(searchKeyword);

  // 4. Kích hoạt ô tìm kiếm
  setupSearchBox();
});

// --- HÀM XỬ LÝ TIẾNG VIỆT (Để tìm kiếm không dấu) ---
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

  // Kiểm tra an toàn
  if (!container) {
    console.error("LỖI: Không tìm thấy thẻ có id='book-container' trong HTML!");
    return;
  }

  try {
    // 1. Luôn tải toàn bộ danh sách sách về trước
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Lỗi kết nối Server");

    let books = await response.json();
    let displayList = [];

    // 2. Nếu có từ khóa -> Lọc thủ công bằng JS (Thông minh hơn json-server)
    if (keyword) {
      const term = removeVietnameseTones(keyword);

      // Đổi tiêu đề hiển thị
      const heading = document.getElementById("section-heading");
      if (heading) heading.textContent = `KẾT QUẢ TÌM KIẾM: "${keyword}"`;

      // Ẩn nút xem thêm
      const viewMore = document.querySelector(".view-more");
      if (viewMore) viewMore.style.display = "none";

      // LOGIC LỌC: Tìm trong Tên sách HOẶC Tên tác giả
      displayList = books.filter((book) => {
        const title = removeVietnameseTones(book.title);
        const author = removeVietnameseTones(book.author);
        return title.includes(term) || author.includes(term);
      });
    } else {
      // Không có từ khóa -> Hiển thị hết (Đảo ngược để thấy sách mới nhất)
      displayList = books.slice().reverse();
    }

    // 3. Vẽ ra giao diện
    container.innerHTML = ""; // Xóa nội dung cũ

    if (displayList.length === 0) {
      container.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #666; margin-top: 20px;">Không tìm thấy cuốn sách nào phù hợp.</p>`;
      return;
    }

    displayList.forEach((book) => {
      const card = document.createElement("div");
      card.className = "book-card";

      // Ảnh dự phòng nếu link ảnh chết
      const imgUrl =
        book.cover || "https://via.placeholder.com/160x240?text=No+Image";

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

    console.log(`Đã hiển thị ${displayList.length} cuốn sách.`);
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

  // Giữ lại từ khóa trên ô input nếu đang ở trang tìm kiếm
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("search")) {
    searchInput.value = urlParams.get("search");
  }

  // Nhấn Enter
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      doSearch(searchInput.value);
    }
  });

  // Click icon kính lúp
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      doSearch(searchInput.value);
    });
  }
}

function doSearch(keyword) {
  const term = keyword.trim();
  if (term) {
    // Chuyển hướng kèm từ khóa
    window.location.href = `index.html?search=${encodeURIComponent(term)}`;
  } else {
    // Nếu rỗng thì về trang chủ gốc
    window.location.href = "index.html";
  }
}

// --- KIỂM TRA ĐĂNG NHẬP (Giữ nguyên) ---
function checkLoginStatus() {
  const userJson = localStorage.getItem("currentUser");
  const guestAction = document.getElementById("guest-action");
  const userAction = document.getElementById("user-action");

  if (userJson) {
    const user = JSON.parse(userJson);
    if (guestAction) guestAction.style.display = "none";
    if (userAction) userAction.style.display = "flex";

    const avatar = document.getElementById("header-avatar");
    const name = document.getElementById("header-username");
    if (avatar) avatar.src = user.avatar || "./Image/logo.png";
    if (name) name.textContent = user.fullName || user.username;

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
    if (guestAction) guestAction.style.display = "flex";
    if (userAction) userAction.style.display = "none";
  }
}
