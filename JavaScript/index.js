const API_URL = "http://localhost:3000/stories";
const CAT_URL = "http://localhost:3000/categories";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Website đã tải xong, bắt đầu chạy JS...");

  // kiểm tra đăng nhập
  checkLoginStatus();

  // lấy tham số từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchKeyword = urlParams.get("search");
  const categoryId = urlParams.get("category");

  // tải danh mục
  fetchCategories(categoryId);

  // tìm kiếm theo tên, tác giả, danh mục
  fetchBooks(searchKeyword, categoryId);

  // kích hoạt ô tìm kiếm
  setupSearchBox();
});

// hàm bỏ dấu tiếng việt
function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.toLowerCase();
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  str = str.replace(/đ/g, "d");
  return str;
}

// danh mục
async function fetchCategories(activeId) {
  const catContainer = document.getElementById("category-filter");
  if (!catContainer) return;

  try {
    const res = await fetch(CAT_URL);
    const categories = await res.json();

    catContainer.innerHTML = "";

    // tất cả
    const allBtn = document.createElement("a");
    allBtn.className = `cat-btn ${!activeId ? "active" : ""}`;
    allBtn.innerText = "Tất cả";
    allBtn.href = "index.html";
    catContainer.appendChild(allBtn);

    // nút danh mục
    categories.forEach((cat) => {
      const btn = document.createElement("a");
      btn.className = `cat-btn ${activeId == cat.id ? "active" : ""}`;
      btn.innerText = cat.name;
      btn.href = `index.html?category=${cat.id}`;
      catContainer.appendChild(btn);
    });
  } catch (error) {
    console.error("Lỗi tải danh mục:", error);
    catContainer.innerHTML = "";
  }
}

// tải sách và lọc sách
async function fetchBooks(keyword = null, catId = null) {
  const container = document.getElementById("book-container");
  if (!container) return;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Lỗi kết nối Server");

    let books = await response.json();
    let displayList = books;

    // lọc theo danh mục
    if (catId) {
      displayList = displayList.filter((b) => b.categoryId == catId);

      const heading = document.getElementById("section-heading");
      if (heading) heading.textContent = "KẾT QUẢ LỌC THEO DANH MỤC";
    }

    // lọc theo từ khoá
    if (keyword) {
      // trim() để xoá dấu cách ở 2 đầu
      const term = removeVietnameseTones(keyword).trim();
      displayList = displayList.filter((book) => {
        const title = removeVietnameseTones(book.title);
        const author = removeVietnameseTones(book.author);
        return title.includes(term) || author.includes(term);
      });

      const heading = document.getElementById("section-heading");
      if (heading) heading.textContent = `TÌM KIẾM: "${keyword}"`;
    }

    // ko lọc gì
    if (!keyword && !catId) {
      displayList.reverse();
    }

    // render ra html để hiển thị
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

// xử lý ở ô tìm kiếm
function setupSearchBox() {
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  if (!searchInput) return;

  // giữ lại từ khoá trên ô tìm kiếm khi bấm nút enter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("search")) {
    searchInput.value = urlParams.get("search");
  }

  // khi ấn enter sẽ biết được ng dùng đang muốn tìm kiếm
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") doSearch(searchInput.value);
  });

  // hoặc là khi click vào nút button
  if (searchBtn) {
    searchBtn.addEventListener("click", () => doSearch(searchInput.value));
  }
}

// trả về index nếu ko search gì
function doSearch(keyword) {
  const term = keyword.trim();
  if (term) {
    window.location.href = `index.html?search=${encodeURIComponent(term)}`;
  } else {
    window.location.href = "index.html";
  }
}

// ktra đăng nhập và check quyền
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
