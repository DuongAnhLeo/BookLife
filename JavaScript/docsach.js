// --- 1. KIỂM TRA ĐĂNG NHẬP & GIẢI NÉN USER ---
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  alert("Vui lòng đăng nhập để đọc truyện!");
  window.location.href = "dangnhap.html";
}

// Chuyển từ chuỗi JSON sang Object
const currentUser = JSON.parse(currentUserStr);

// --- 2. CẤU HÌNH API ---
const API_URL = "http://localhost:3000";
const USER_API_URL = "http://localhost:3000/users";

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get("id");
  const chapterParam = urlParams.get("chapter");
  let currentChapterOrder = chapterParam ? parseInt(chapterParam) : 1;

  if (!storyId) {
    alert("Không tìm thấy ID truyện trên đường dẫn!");
    window.location.href = "index.html";
    return;
  }

  // GỌI HÀM LƯU LỊCH SỬ (Chạy ngầm, không chặn hiển thị)
  addToHistory(storyId);

  // Tải nội dung sách
  loadReadingPage(storyId, currentChapterOrder);
  setupTocEvents();
});

async function loadReadingPage(storyId, chapterOrder) {
  try {
    // 1. Lấy thông tin truyện
    const storyRes = await fetch(`${API_URL}/stories/${storyId}`);

    if (!storyRes.ok) {
      throw new Error(`Không tìm thấy truyện (Lỗi ${storyRes.status})`);
    }

    const story = await storyRes.json();

    // Cập nhật Header
    const titleHeader = document.getElementById("story-title-header");
    if (titleHeader) titleHeader.textContent = story.title;

    const backLink = document.getElementById("back-link");
    if (backLink) backLink.href = `thongtinsach.html?id=${story.id}`;

    // 2. Lấy danh sách chương
    const chaptersRes = await fetch(`${API_URL}/chapters?storyId=${storyId}`);
    const chapters = await chaptersRes.json();

    // Xử lý khi không có chương nào
    if (chapters.length === 0) {
      document.getElementById("chapter-content").innerHTML = `
                <div style="text-align:center; margin-top: 50px;">
                    <h3>Truyện này chưa cập nhật nội dung.</h3>
                    <p>Vui lòng quay lại sau nhé!</p>
                </div>`;
      document.getElementById("chapter-num").textContent = "";
      document.getElementById("chapter-title").textContent = "";
      return;
    }

    // 3. Tìm chương hiện tại
    const currentIndex = chapterOrder - 1;
    const currentChapter = chapters[currentIndex];

    if (currentChapter) {
      renderChapterContent(currentChapter, chapterOrder);
    } else {
      document.getElementById("chapter-content").innerHTML =
        "<p>Không tìm thấy nội dung chương này.</p>";
    }

    // 4. Tạo mục lục và nút điều hướng
    renderTableOfContents(chapters, storyId, chapterOrder);
    setupNavigation(storyId, chapterOrder, chapters.length);
  } catch (error) {
    console.error("Lỗi chi tiết:", error);
    // Chỉ hiện alert nếu thực sự lỗi nặng, tránh spam
    document.getElementById("chapter-content").innerHTML = `
            <div style="color: red; text-align: center; margin-top: 20px;">
                <h3>⚠️ Có lỗi xảy ra!</h3>
                <p>${error.message}</p>
                <p>Hãy kiểm tra lại json-server hoặc kết nối mạng.</p>
            </div>
        `;
  }
}

function renderChapterContent(chapter, order) {
  const numEl = document.getElementById("chapter-num");
  const titleEl = document.getElementById("chapter-title");
  const contentEl = document.getElementById("chapter-content");

  if (numEl) numEl.textContent = `Chương ${order}`;
  // Xử lý tên chương: Nếu có dấu ":" thì lấy phần sau, không thì lấy hết
  if (titleEl)
    titleEl.textContent = chapter.title.includes(":")
      ? chapter.title.split(":")[1]
      : chapter.title;
  if (contentEl) contentEl.innerHTML = chapter.content;
}

function renderTableOfContents(chapters, storyId, currentOrder) {
  const listContainer = document.getElementById("toc-list");
  if (!listContainer) return;

  listContainer.innerHTML = "";

  chapters.forEach((chap, index) => {
    const order = index + 1;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = chap.title;
    a.href = `docsach.html?id=${storyId}&chapter=${order}`;

    if (order === currentOrder) {
      a.style.color = "#d35400";
      a.style.fontWeight = "bold";
    }

    li.appendChild(a);
    listContainer.appendChild(li);
  });
}

function setupNavigation(storyId, currentOrder, totalChapters) {
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const pageInfo = document.getElementById("page-info");

  if (pageInfo) pageInfo.textContent = `${currentOrder}/${totalChapters}`;

  if (btnPrev) {
    if (currentOrder > 1) {
      btnPrev.onclick = () =>
        (window.location.href = `docsach.html?id=${storyId}&chapter=${
          currentOrder - 1
        }`);
      btnPrev.disabled = false;
      btnPrev.style.opacity = "1";
    } else {
      btnPrev.disabled = true;
      btnPrev.style.opacity = "0.3";
    }
  }

  if (btnNext) {
    if (currentOrder < totalChapters) {
      btnNext.onclick = () =>
        (window.location.href = `docsach.html?id=${storyId}&chapter=${
          currentOrder + 1
        }`);
      btnNext.disabled = false;
      btnNext.style.opacity = "1";
    } else {
      btnNext.disabled = true;
      btnNext.style.opacity = "0.3";
    }
  }
}

function setupTocEvents() {
  const btnOpen = document.getElementById("btnOpenTOC");
  const btnClose = document.getElementById("btnCloseTOC");
  const mainContent = document.getElementById("mainContent");

  if (btnOpen)
    btnOpen.addEventListener("click", () =>
      mainContent.classList.add("toc-open")
    );
  if (btnClose)
    btnClose.addEventListener("click", () =>
      mainContent.classList.remove("toc-open")
    );
}

// --- HÀM LƯU LỊCH SỬ ---
async function addToHistory(bookId) {
  const bookIdNum = Number(bookId);
  if (!currentUser.history) currentUser.history = [];

  // Xóa cái cũ đi (để đưa lên đầu)
  currentUser.history = currentUser.history.filter(
    (id) => Number(id) !== bookIdNum
  );
  // Thêm vào đầu
  currentUser.history.unshift(bookIdNum);
  // Giới hạn 20
  if (currentUser.history.length > 20) currentUser.history.length = 20;

  // Lưu LocalStorage
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // Lưu Server
  try {
    await fetch(`${USER_API_URL}/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: currentUser.history }),
    });
    console.log("Đã lưu lịch sử thành công.");
  } catch (error) {
    console.error(
      "Lỗi server khi lưu lịch sử (không ảnh hưởng việc đọc):",
      error
    );
  }
}
