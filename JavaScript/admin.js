const API_URL = "http://localhost:3000";
const STORIES_ENDPOINT = API_URL + "/stories";
const USERS_ENDPOINT = API_URL + "/users";
const CATEGORIES_ENDPOINT = API_URL + "/categories";
const CHAPTERS_ENDPOINT = API_URL + "/chapters"; // Endpoint mới

let allStories = [];
let allCategories = [];

document.addEventListener("DOMContentLoaded", () => {
  checkLogin();
  fetchDashboardData();
  setupOutsideClick();
});

function checkLogin() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user || user.role !== "admin") {
    alert("Khu vực cấm! Bạn không phải Admin.");
    window.location.href = "dangnhap.html";
    return;
  }
  const welcomeMsg = document.getElementById("welcome-msg");
  if (welcomeMsg) welcomeMsg.innerText = `Xin chào, ${user.fullName}`;
}

async function fetchDashboardData() {
  try {
    const [resStories, resUsers, resCats] = await Promise.all([
      fetch(STORIES_ENDPOINT),
      fetch(USERS_ENDPOINT),
      fetch(CATEGORIES_ENDPOINT),
    ]);
    allStories = await resStories.json();
    const users = await resUsers.json();
    allCategories = await resCats.json();

    const totalViews = allStories.reduce((sum, s) => sum + (s.views || 0), 0);
    document.getElementById("total-books").innerText = allStories.length;
    document.getElementById("total-views").innerText =
      totalViews.toLocaleString("vi-VN");
    document.getElementById("total-users").innerText = users.length;

    renderStoryTable(allStories);
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
  }
}

window.switchTab = function (tabName) {
  document
    .querySelectorAll(".tab-section")
    .forEach((el) => (el.style.display = "none"));
  document
    .querySelectorAll(".admin-menu li")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(`tab-${tabName}`).style.display = "block";
  document.getElementById(`menu-${tabName}`).classList.add("active");
  if (tabName === "stories") renderStoryTable(allStories);
  if (tabName === "users") fetchUsersTable();
  if (tabName === "categories") fetchCategoriesTable();
};

// ================= MODULE 1: STORIES =================
function getCategoryName(catId) {
  if (!catId)
    return '<span style="color:#999; font-style:italic">Chưa phân loại</span>';
  const cat = allCategories.find((c) => c.id == catId);
  return cat ? cat.name : '<span style="color:#999">Đã xóa</span>';
}

function renderStoryTable(data) {
  const tbody = document.getElementById("book-table-body");
  tbody.innerHTML = "";
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">Không có dữ liệu</td></tr>`;
    return;
  }
  data.forEach((story) => {
    const statusClass = story.status === "Hoàn thành" ? "active" : "pending";
    const catName = getCategoryName(story.categoryId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>#${story.id}</td>
            <td><img src="${story.cover}" style="width:40px;height:60px;object-fit:cover;border-radius:4px;"></td>
            <td style="font-weight:600">${story.title}</td>
            <td style="color: #0288d1; font-weight: 500">${catName}</td> 
            <td>${story.author}</td>
            <td><span class="status-badge ${statusClass}">${story.status}</span></td>
            <td style="text-align: right;">
                <div class="action-btns">
                    <button class="btn-edit" onclick="openChapterManager('${story.id}')" title="Quản lý chương" style="color: #e67e22; background: #fff3e0;">
                        <i class="fa-solid fa-list-ol"></i>
                    </button>
                    <button class="btn-edit" onclick="editBook('${story.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-delete" onclick="deleteBook('${story.id}')"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>`;
    tbody.appendChild(tr);
  });
}

// ... (Giữ nguyên các hàm loadCategoriesToSelect, openModal, closeModal, bookForm submit...)
// Phần này không thay đổi logic cũ, chỉ copy lại cho đủ

function loadCategoriesToSelect() {
  const select = document.getElementById("story-category");
  select.innerHTML = '<option value="">-- Chọn danh mục --</option>';
  allCategories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.innerText = cat.name;
    select.appendChild(option);
  });
}
const bookModal = document.getElementById("bookModal");
const bookForm = document.getElementById("book-form");
const previewImg = document.getElementById("preview-img");
window.openModal = () => {
  bookForm.reset();
  document.getElementById("book-id").value = "";
  previewImg.style.display = "none";
  document.getElementById("modal-title").innerText = "Thêm sách mới";
  loadCategoriesToSelect();
  bookModal.style.display = "flex";
};
window.closeModal = () => (bookModal.style.display = "none");
document.getElementById("cover").addEventListener("input", function () {
  if (this.value) {
    previewImg.src = this.value;
    previewImg.style.display = "block";
  } else {
    previewImg.style.display = "none";
  }
});
bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("book-id").value;
  const data = {
    title: document.getElementById("title").value,
    author: document.getElementById("author").value,
    status: document.getElementById("status").value,
    cover: document.getElementById("cover").value,
    description: document.getElementById("description").value,
    categoryId: document.getElementById("story-category").value,
    views: id ? getStory(id).views : 0,
    rating: id ? getStory(id).rating : 5,
  };
  await handleSave(STORIES_ENDPOINT, id, data, "sách");
  closeModal();
  fetchDashboardData();
});
window.editBook = (id) => {
  const s = getStory(id);
  loadCategoriesToSelect();
  document.getElementById("book-id").value = s.id;
  document.getElementById("title").value = s.title;
  document.getElementById("author").value = s.author;
  document.getElementById("status").value = s.status;
  document.getElementById("cover").value = s.cover;
  document.getElementById("description").value = s.description;
  document.getElementById("story-category").value = s.categoryId || "";
  if (s.cover) {
    previewImg.src = s.cover;
    previewImg.style.display = "block";
  }
  document.getElementById("modal-title").innerText = "Cập nhật sách";
  bookModal.style.display = "flex";
};
window.deleteBook = (id) =>
  handleDelete(STORIES_ENDPOINT, id, "sách", fetchDashboardData);
function getStory(id) {
  return allStories.find((s) => s.id == id) || {};
}
document.getElementById("search-story").addEventListener("input", (e) => {
  const key = e.target.value.toLowerCase();
  const filtered = allStories.filter((s) =>
    s.title.toLowerCase().includes(key)
  );
  renderStoryTable(filtered);
});

// ================= MODULE 2 & 3: USERS & CATEGORIES (Giữ nguyên) =================
// ... (Phần code User và Category của bạn giữ nguyên, không cần sửa gì) ...
async function fetchUsersTable() {
  const res = await fetch(USERS_ENDPOINT);
  const users = await res.json();
  const tbody = document.getElementById("user-table-body");
  tbody.innerHTML = "";
  users.forEach((u) => {
    const roleHtml =
      u.role === "admin"
        ? '<span class="status-badge" style="background:#ffebee;color:#c62828">Admin</span>'
        : '<span class="status-badge active">User</span>';
    tbody.innerHTML += `<tr><td>${u.id}</td><td style="font-weight:600">${u.fullName}</td><td>${u.email}</td><td>${roleHtml}</td><td style="text-align:right;"><div class="action-btns"><button class="btn-edit" onclick="editUser('${u.id}')"><i class="fa-solid fa-pen-to-square"></i></button><button class="btn-delete" onclick="deleteUser('${u.id}')"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`;
  });
}
const userModal = document.getElementById("userModal");
const userForm = document.getElementById("user-form");
window.openUserModal = () => {
  userForm.reset();
  document.getElementById("user-id").value = "";
  document.getElementById("user-modal-title").innerText = "Thêm tài khoản";
  userModal.style.display = "flex";
};
window.closeUserModal = () => (userModal.style.display = "none");
userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("user-id").value;
  let oldData = {};
  if (id) {
    const res = await fetch(`${USERS_ENDPOINT}/${id}`);
    oldData = await res.json();
  }
  const data = {
    fullName: document.getElementById("user-fullname").value,
    email: document.getElementById("user-email").value,
    password: document.getElementById("user-password").value,
    role: document.getElementById("user-role").value,
    favorites: oldData.favorites || [],
    history: oldData.history || [],
  };
  await handleSave(USERS_ENDPOINT, id, data, "tài khoản");
  closeUserModal();
  fetchUsersTable();
  fetchDashboardData();
});
window.editUser = async (id) => {
  const res = await fetch(`${USERS_ENDPOINT}/${id}`);
  const u = await res.json();
  document.getElementById("user-id").value = u.id;
  document.getElementById("user-fullname").value = u.fullName;
  document.getElementById("user-email").value = u.email;
  document.getElementById("user-password").value = u.password;
  document.getElementById("user-role").value = u.role;
  document.getElementById("user-modal-title").innerText = "Cập nhật tài khoản";
  userModal.style.display = "flex";
};
window.deleteUser = (id) =>
  handleDelete(USERS_ENDPOINT, id, "tài khoản", () => {
    fetchUsersTable();
    fetchDashboardData();
  });
// Categories
async function fetchCategoriesTable() {
  const res = await fetch(CATEGORIES_ENDPOINT);
  const cats = await res.json();
  allCategories = cats;
  const tbody = document.getElementById("category-table-body");
  tbody.innerHTML = "";
  cats.forEach((c) => {
    tbody.innerHTML += `<tr><td>${
      c.id
    }</td><td style="font-weight:600; color:#2e7d32">${c.name}</td><td>${
      c.description || ""
    }</td><td style="text-align:right;"><div class="action-btns"><button class="btn-edit" onclick="editCategory('${
      c.id
    }')"><i class="fa-solid fa-pen-to-square"></i></button><button class="btn-delete" onclick="deleteCategory('${
      c.id
    }')"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`;
  });
}
const catModal = document.getElementById("categoryModal");
const catForm = document.getElementById("category-form");
window.openCategoryModal = () => {
  catForm.reset();
  document.getElementById("category-id").value = "";
  document.getElementById("category-modal-title").innerText = "Thêm danh mục";
  catModal.style.display = "flex";
};
window.closeCategoryModal = () => (catModal.style.display = "none");
catForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("category-id").value;
  const data = {
    name: document.getElementById("category-name").value,
    description: document.getElementById("category-desc").value,
  };
  await handleSave(CATEGORIES_ENDPOINT, id, data, "danh mục");
  closeCategoryModal();
  fetchCategoriesTable();
  fetchDashboardData();
});
window.editCategory = async (id) => {
  const res = await fetch(`${CATEGORIES_ENDPOINT}/${id}`);
  const c = await res.json();
  document.getElementById("category-id").value = c.id;
  document.getElementById("category-name").value = c.name;
  document.getElementById("category-desc").value = c.description;
  document.getElementById("category-modal-title").innerText =
    "Cập nhật danh mục";
  catModal.style.display = "flex";
};
window.deleteCategory = (id) =>
  handleDelete(CATEGORIES_ENDPOINT, id, "danh mục", () => {
    fetchCategoriesTable();
    fetchDashboardData();
  });

// ==========================================================
// MODULE 4: QUẢN LÝ CHƯƠNG (NEW FEATURE)
// ==========================================================
const chapterModal = document.getElementById("chapterModal");

// 1. Mở Modal Quản lý Chương
window.openChapterManager = async (storyId) => {
  // Lưu storyId vào input ẩn để biết đang thêm chương cho truyện nào
  document.getElementById("current-story-id").value = storyId;

  // Tìm tên truyện để hiển thị lên tiêu đề Modal
  const story = getStory(storyId);
  document.getElementById(
    "chapter-modal-title"
  ).innerText = `Quản lý chương: ${story.title}`;

  // Reset form editor
  resetChapterForm();

  // Tải danh sách chương
  await fetchChapters(storyId);

  chapterModal.style.display = "flex";
};

window.closeChapterModal = () => (chapterModal.style.display = "none");

// 2. Tải danh sách chương
async function fetchChapters(storyId) {
  const listContainer = document.getElementById("chapter-list-container");
  listContainer.innerHTML = "Đang tải...";

  try {
    const res = await fetch(`${CHAPTERS_ENDPOINT}?storyId=${storyId}`);
    const chapters = await res.json();

    listContainer.innerHTML = "";
    if (chapters.length === 0) {
      listContainer.innerHTML =
        "<div style='padding:10px; color:#999'>Chưa có chương nào</div>";
    }

    chapters.forEach((chap) => {
      const div = document.createElement("div");
      div.className = "chapter-item";
      div.innerHTML = `
                <span>${chap.title}</span>
                <button class="btn-small btn-red" onclick="deleteChapter(event, '${chap.id}', '${storyId}')">Xóa</button>
            `;
      // Click vào để sửa
      div.onclick = (e) => {
        // Tránh trigger sự kiện click khi bấm nút xóa
        if (e.target.tagName !== "BUTTON") {
          loadChapterToEditor(chap);
          // Hightlight dòng đang chọn
          document
            .querySelectorAll(".chapter-item")
            .forEach((i) => i.classList.remove("active"));
          div.classList.add("active");
        }
      };
      listContainer.appendChild(div);
    });
  } catch (error) {
    console.error(error);
    listContainer.innerHTML = "Lỗi tải chương!";
  }
}

// 3. Load chương vào Editor để sửa
function loadChapterToEditor(chapter) {
  document.getElementById("current-chapter-id").value = chapter.id;
  document.getElementById("editor-title").value = chapter.title;
  document.getElementById("editor-content").value = chapter.content;
}

// 4. Reset Editor để thêm mới
window.resetChapterForm = () => {
  document.getElementById("current-chapter-id").value = "";
  document.getElementById("editor-title").value = "";
  document.getElementById("editor-content").value = "";
  document
    .querySelectorAll(".chapter-item")
    .forEach((i) => i.classList.remove("active"));
};

// 5. Lưu Chương (Thêm/Sửa)
window.saveChapter = async () => {
  const storyId = document.getElementById("current-story-id").value;
  const chapterId = document.getElementById("current-chapter-id").value;
  const title = document.getElementById("editor-title").value;
  const content = document.getElementById("editor-content").value;

  if (!title || !content) {
    alert("Vui lòng nhập tiêu đề và nội dung!");
    return;
  }

  const data = { storyId, title, content };

  try {
    if (chapterId) {
      // Sửa
      await fetch(`${CHAPTERS_ENDPOINT}/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert("Đã cập nhật chương!");
    } else {
      // Thêm mới
      await fetch(CHAPTERS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert("Đã thêm chương mới!");
    }

    // Reload danh sách chương & reset form
    fetchChapters(storyId);
    resetChapterForm();
  } catch (error) {
    alert("Lỗi khi lưu chương!");
  }
};

// 6. Xóa Chương
window.deleteChapter = async (event, chapterId, storyId) => {
  event.stopPropagation(); // Ngăn sự kiện click vào item cha
  if (confirm("Bạn có chắc muốn xóa chương này?")) {
    await fetch(`${CHAPTERS_ENDPOINT}/${chapterId}`, { method: "DELETE" });
    fetchChapters(storyId);
    resetChapterForm();
  }
};

// ================= HELPER FUNCTIONS =================
async function handleSave(endpoint, id, data, name) {
  try {
    if (id) {
      await fetch(`${endpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert(`Cập nhật ${name} thành công!`);
    } else {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert(`Thêm ${name} mới thành công!`);
    }
  } catch (error) {
    console.error(error);
    alert(`Lỗi khi lưu ${name}!`);
  }
}
async function handleDelete(endpoint, id, name, reloadFunc) {
  if (confirm(`Bạn có chắc muốn xóa ${name} này không?`)) {
    try {
      await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      alert(`Đã xóa ${name}!`);
      if (reloadFunc) reloadFunc();
    } catch (error) {
      console.error(error);
      alert(`Lỗi khi xóa ${name}!`);
    }
  }
}
function setupOutsideClick() {
  window.onclick = (event) => {
    if (event.target == bookModal) closeModal();
    if (event.target == userModal) closeUserModal();
    if (event.target == catModal) closeCategoryModal();
    // Không đóng chapterModal khi click ngoài để tránh mất nội dung đang viết
  };
}
document.getElementById("btn-logout").addEventListener("click", () => {
  if (confirm("Bạn muốn đăng xuất?")) {
    localStorage.removeItem("currentUser");
    window.location.href = "dangnhap.html";
  }
});
