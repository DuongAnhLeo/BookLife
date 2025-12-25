// --- 1. KIỂM TRA ĐĂNG NHẬP ---
const currentUserStr = localStorage.getItem("currentUser");
if (!currentUserStr) {
  alert("Vui lòng đăng nhập để đọc truyện!");
  window.location.href = "dangnhap.html";
}
const currentUser = JSON.parse(currentUserStr);

// --- 2. CẤU HÌNH API ---
const API_URL = "http://localhost:3000";
const USER_API_URL = "http://localhost:3000/users";

// --- 3. BIẾN TOÀN CỤC ---
let gStoryId = null;
let gChapters = [];
let gCurrentChapterIndex = 0;
let gChapterPages = [];
let gCurrentPageIndex = 0;

// Tăng số lượng ký tự lên một chút vì giao diện mới rộng rãi hơn
const MAX_CHARS_PER_PAGE = 2000;

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  gStoryId = urlParams.get("id");
  const chapterParam = urlParams.get("chapter");
  let initialChapterOrder = chapterParam ? parseInt(chapterParam) : 1;

  if (!gStoryId) {
    alert("Không tìm thấy ID truyện!");
    window.location.href = "index.html";
    return;
  }

  addToHistory(gStoryId);
  initReadingData(gStoryId, initialChapterOrder);
  setupTocEvents();
});

// --- KHỞI TẠO DỮ LIỆU ---
async function initReadingData(storyId, chapterOrder) {
  try {
    const storyRes = await fetch(`${API_URL}/stories/${storyId}`);
    const story = await storyRes.json();
    document.getElementById("story-title-header").textContent = story.title;
    document.getElementById(
      "back-link"
    ).href = `thongtinsach.html?id=${story.id}`;

    const chaptersRes = await fetch(`${API_URL}/chapters?storyId=${storyId}`);
    gChapters = await chaptersRes.json();

    if (gChapters.length === 0) {
      document.getElementById("chapter-content").innerHTML =
        "<p>Truyện chưa có nội dung.</p>";
      return;
    }

    gCurrentChapterIndex = chapterOrder - 1;
    if (gCurrentChapterIndex < 0) gCurrentChapterIndex = 0;
    if (gCurrentChapterIndex >= gChapters.length)
      gCurrentChapterIndex = gChapters.length - 1;

    loadChapterAndRender(gCurrentChapterIndex, 0);
    renderTableOfContents(gChapters, storyId, gCurrentChapterIndex + 1);
  } catch (error) {
    console.error(error);
    alert("Lỗi tải dữ liệu!");
  }
}

// --- XỬ LÝ NỘI DUNG ---
function loadChapterAndRender(chapterIndex, pageIndexToStart) {
  const chapter = gChapters[chapterIndex];

  document.getElementById("chapter-num").textContent = `Chương ${
    chapterIndex + 1
  }`;
  document.getElementById("chapter-title").textContent = chapter.title.includes(
    ":"
  )
    ? chapter.title.split(":")[1]
    : chapter.title;

  let rawContent = chapter.content || "";
  gChapterPages = splitContentSmartly(rawContent, MAX_CHARS_PER_PAGE);

  if (pageIndexToStart === -1) {
    gCurrentPageIndex = gChapterPages.length - 1;
  } else {
    gCurrentPageIndex = pageIndexToStart;
  }

  renderCurrentPage();
}

/**
 * Cắt nội dung thông minh
 */
function splitContentSmartly(htmlContent, limit) {
  // Lấy text thuần để tính toán
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  let fullText = tempDiv.innerText || tempDiv.textContent || "";

  // Nếu text quá ngắn
  if (fullText.length <= limit) {
    return [formatTextToHTML(fullText)];
  }

  let pages = [];
  let startIndex = 0;

  while (startIndex < fullText.length) {
    let endIndex = startIndex + limit;

    if (endIndex >= fullText.length) {
      let chunk = fullText.slice(startIndex);
      pages.push(formatTextToHTML(chunk));
      break;
    }

    // Tìm điểm ngắt đẹp (dấu câu)
    let safeEndIndex = -1;
    const lookBackRange = 300;
    const searchString = fullText.slice(
      Math.max(startIndex, endIndex - lookBackRange),
      endIndex
    );

    const lastPunctuation = Math.max(
      searchString.lastIndexOf("."),
      searchString.lastIndexOf("?"),
      searchString.lastIndexOf("!")
    );

    if (lastPunctuation !== -1) {
      safeEndIndex =
        Math.max(startIndex, endIndex - lookBackRange) + lastPunctuation + 1;
    } else {
      const lastSpace = searchString.lastIndexOf(" ");
      if (lastSpace !== -1) {
        safeEndIndex =
          Math.max(startIndex, endIndex - lookBackRange) + lastSpace;
      } else {
        safeEndIndex = endIndex;
      }
    }

    let chunk = fullText.slice(startIndex, safeEndIndex);
    pages.push(formatTextToHTML(chunk));

    startIndex = safeEndIndex;
  }

  return pages;
}

// FORMAT TEXT: Quan trọng để hiển thị đẹp
function formatTextToHTML(text) {
  let cleanText = text.trim();
  // Tách theo dòng mới
  let paragraphs = cleanText.split("\n").filter((p) => p.trim() !== "");

  // Nếu không có xuống dòng nào (nguyên cục text), vẫn bọc vào thẻ p
  if (paragraphs.length === 0 && cleanText.length > 0)
    return `<p>${cleanText}</p>`;

  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

// --- RENDER ---
function renderCurrentPage() {
  const contentEl = document.getElementById("chapter-content");
  const pageInfoEl = document.getElementById("page-info");
  const tocList = document.getElementById("toc-list");

  contentEl.innerHTML = gChapterPages[gCurrentPageIndex];
  contentEl.scrollTop = 0;

  pageInfoEl.innerHTML = `Chương ${gCurrentChapterIndex + 1} • Trang ${
    gCurrentPageIndex + 1
  }/${gChapterPages.length}`;

  updateNavButtons();

  const newUrl = `docsach.html?id=${gStoryId}&chapter=${
    gCurrentChapterIndex + 1
  }`;
  window.history.replaceState(null, "", newUrl);

  const links = tocList.querySelectorAll("a");
  links.forEach((a) => (a.style.color = ""));
  if (links[gCurrentChapterIndex]) {
    links[gCurrentChapterIndex].style.color = "#d35400";
    links[gCurrentChapterIndex].style.fontWeight = "bold";
  }
}

// --- ĐIỀU HƯỚNG ---
function updateNavButtons() {
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");

  btnPrev.onclick = () => {
    if (gCurrentPageIndex > 0) {
      gCurrentPageIndex--;
      renderCurrentPage();
    } else {
      if (gCurrentChapterIndex > 0) {
        gCurrentChapterIndex--;
        loadChapterAndRender(gCurrentChapterIndex, -1);
      } else {
        alert("Đây là trang đầu tiên!");
      }
    }
  };

  btnNext.onclick = () => {
    if (gCurrentPageIndex < gChapterPages.length - 1) {
      gCurrentPageIndex++;
      renderCurrentPage();
    } else {
      if (gCurrentChapterIndex < gChapters.length - 1) {
        gCurrentChapterIndex++;
        loadChapterAndRender(gCurrentChapterIndex, 0);
      } else {
        alert("Bạn đã đọc hết truyện này!");
      }
    }
  };
}

// --- MỤC LỤC & LỊCH SỬ ---
function renderTableOfContents(chapters, storyId, currentOrder) {
  const listContainer = document.getElementById("toc-list");
  listContainer.innerHTML = "";
  chapters.forEach((chap, index) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    // Xử lý tiêu đề dài trong mục lục
    a.textContent = chap.title;
    a.href = "#";
    a.onclick = (e) => {
      e.preventDefault();
      gCurrentChapterIndex = index;
      loadChapterAndRender(index, 0);
      document.getElementById("mainContent").classList.remove("toc-open");
    };
    li.appendChild(a);
    listContainer.appendChild(li);
  });
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

async function addToHistory(bookId) {
  const bookIdNum = Number(bookId);
  if (!currentUser.history) currentUser.history = [];
  currentUser.history = currentUser.history.filter(
    (id) => Number(id) !== bookIdNum
  );
  currentUser.history.unshift(bookIdNum);
  if (currentUser.history.length > 20) currentUser.history.length = 20;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  try {
    await fetch(`${USER_API_URL}/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: currentUser.history }),
    });
  } catch (error) {
    console.error(error);
  }
}
