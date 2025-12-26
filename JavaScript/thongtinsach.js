// check đăng nhập
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  alert("Bạn cần đăng nhập để xem thông tin sách!");
  window.location.href = "dangnhap.html";
}
const currentUser = JSON.parse(currentUserStr);

if (!currentUser.favorites) currentUser.favorites = [];
if (!currentUser.bookmarks) currentUser.bookmarks = [];

const API_URL = "http://localhost:3000/stories";
const USER_API_URL = "http://localhost:3000/users";
const COMMENT_API_URL = "http://localhost:3000/comments";

let currentBookId = null;

// hiển thị thông tin user
document.addEventListener("DOMContentLoaded", () => {
  updateHeaderUI();
  const myAvatarEl = document.getElementById("cmt-my-avatar");
  if (myAvatarEl) {
    myAvatarEl.src = currentUser.avatar || "./Image/logo.png";
  }

  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("id");

  if (bookId) {
    currentBookId = bookId;
    fetchBookDetail(bookId);
    fetchComments(bookId);
  } else {
    alert("Không tìm thấy ID sách!");
    window.location.href = "index.html";
  }
});

function updateHeaderUI() {
  const avatarEl = document.getElementById("header-avatar");
  const nameEl = document.getElementById("header-username");

  if (avatarEl) {
    avatarEl.src = currentUser.avatar || "./Image/logo.png";
  }
  if (nameEl) {
    nameEl.textContent = currentUser.fullName || currentUser.username;
  }

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

// chi tiết sách
async function fetchBookDetail(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error("Không tìm thấy sách");

    const book = await response.json();
    displayBookDetail(book);

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
  const readBtn = document.getElementById("btn-read-link");
  readBtn.href = `docsach.html?id=${book.id}`;
}

// lưu sách
function setupBookmarkButton(bookId) {
  const btnSave = document.getElementById("btn-save");
  const bookIdNumber = Number(bookId);

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

// tim sách
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

// bình luận
async function fetchComments(storyId) {
  try {
    const res = await fetch(
      `${COMMENT_API_URL}?storyId=${storyId}&_sort=createdAt&_order=desc`
    );
    const comments = await res.json();
    renderComments(comments);
  } catch (error) {
    console.error("Lỗi tải bình luận:", error);
  }
}

// hiển thị comment
function renderComments(comments) {
  const listEl = document.getElementById("comment-list");
  if (comments.length === 0) {
    listEl.innerHTML =
      '<p style="color: #888;">Hãy là người đầu tiên bình luận!</p>';
    return;
  }

  listEl.innerHTML = "";
  comments.forEach((cmt) => {
    const timeString = new Date(cmt.createdAt).toLocaleString("vi-VN");

    const div = document.createElement("div");
    div.className = "comment-item";
    div.style.display = "flex";
    div.style.gap = "15px";
    div.style.marginTop = "15px";

    div.innerHTML = `
      <div class="comment-avatar">
        <img src="${cmt.userAvatar || "./Image/logo.png"}" 
             alt="User" 
             style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
      </div>
      <div class="comment-content">
        <div class="comment-header" style="margin-bottom: 5px;">
          <span class="comment-author" style="font-weight: bold; font-size: 14px;">
            ${cmt.userName}
          </span>
          <span class="comment-time" style="font-size: 12px; color: #888; margin-left: 10px;">
            ${timeString}
          </span>
        </div>
        <p class="comment-text" style="font-size: 14px; color: #444; margin: 0;">
          ${cmt.content}
        </p>
      </div>
    `;
    listEl.appendChild(div);
  });
}

// bình luận mới
window.postComment = async () => {
  const contentInput = document.getElementById("cmt-content");
  const content = contentInput.value.trim();

  if (!content) {
    alert("Vui lòng nhập nội dung bình luận!");
    return;
  }

  if (!currentBookId) return;

  const newComment = {
    storyId: currentBookId,
    userId: currentUser.id,
    userName: currentUser.fullName || currentUser.username,
    userAvatar: currentUser.avatar || "./Image/logo.png",
    content: content,
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(COMMENT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newComment),
    });

    if (res.ok) {
      contentInput.value = "";
      fetchComments(currentBookId);
    } else {
      alert("Có lỗi khi gửi bình luận.");
    }
  } catch (error) {
    console.error("Lỗi post comment:", error);
    alert("Không thể kết nối đến server.");
  }
};
