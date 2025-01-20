import { app } from "../../scripts/app.js";

/* ノード選択サンプル
const nodes = app.graph._nodes;
const targetNode = nodes.find(node => node.type === "LoadImage");
*/

/* タグ検索サンプル
const url = "https://danbooru.donmai.us/related_tag?commit=Search&search%5Bcategory%5D=General&search%5Border%5D=Cosine&search%5Bquery%5D=kantai_collection";
const response = await fetch(url);
const data = await response.json();
console.log(data);
*/

// タグ検索用の非同期関数
async function searchRelatedTags(tag) {
    try {
        const query = tag.join(" ");
        const url = `https://danbooru.donmai.us/related_tag?commit=Search&search%5Border%5D=Cosine&search%5Bquery%5D=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        return {
            "post_count": 0,
            "related_tags": []
        };
    }
}

// タグをカテゴリでフィルタリングする関数
function filterTagsByCategory(tags, category) {
    if (category === null) return tags;
    return tags.filter(tag => tag.tag.category === category);
}

// タグの色を取得する関数
function getTagColor(category) {
    const colors = {
        0: { color: '#0075f8', hoverColor: '#8caaff' }, // General
        1: { color: '#c00004', hoverColor: '#ff5a5b' }, // Artist
        3: { color: '#35c64a', hoverColor: '#93e49a' }, // Character
        4: { color: '#fd9200', hoverColor: '#ffc5a5' }, // Meta
        2: { color: '#d700d9', hoverColor: '#fd78ff' }, // Copyright
        5: { color: '#ff5a5b', hoverColor: '#ff8a8b' }  // Rating
    };
    return colors[category] || colors[0];
}

// タグ候補を表示するポップアップを作成
function createTagSuggestionPopup(tags, position) {
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.left = position.x + 'px';
    popup.style.top = position.y + 'px';
    popup.style.backgroundColor = '#2d2d2d';
    popup.style.border = '1px solid #666';
    popup.style.borderRadius = '4px';
    popup.style.zIndex = '10000';
    popup.style.width = '400px';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.maxHeight = '300px';

    // ドラッグ用のヘッダーを追加
    const header = document.createElement('div');
    header.style.cursor = 'move';
    header.style.padding = '4px';
    header.style.borderBottom = '1px solid #444';
    header.style.userSelect = 'none';
    header.style.backgroundColor = '#2d2d2d';
    header.style.position = 'sticky';
    header.style.top = '0';
    header.style.zIndex = '1';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';

    // タイトルテキストを別の要素として作成
    const titleText = document.createElement('span');
    titleText.style.color = '#888';
    titleText.style.pointerEvents = 'none'; // テキストでのイベントを無効化
    titleText.textContent = 'Related Tags';
    header.appendChild(titleText);

    // 閉じるボタンを追加
    const closeButton = document.createElement('div');
    closeButton.innerHTML = '×';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#888';
    closeButton.style.fontSize = '16px';
    closeButton.style.padding = '0 4px';
    closeButton.addEventListener('click', () => popup.remove());
    header.appendChild(closeButton);

    popup.appendChild(header);

    // タグリストのコンテナ
    const tagContainer = document.createElement('div');
    tagContainer.style.overflowY = 'auto';
    tagContainer.style.overflowX = 'hidden';
    tagContainer.style.padding = '8px';
    tagContainer.style.flex = '1';
    popup.appendChild(tagContainer);

    // ドラッグ機能の実装
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    function dragStart(e) {
        if (e.target === closeButton) return; // 閉じるボタンクリック時はドラッグを開始しない

        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === header) {
            isDragging = true;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            popup.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // カテゴリ名を表示する関数
    function getCategoryName(category) {
        const categories = {
            0: "General",
            1: "Artist",
            2: "Copyright",
            3: "Character",
            4: "Meta",
            5: "Rating"
        };
        return categories[category] || "";
    }

    tags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.style.padding = '4px';
        tagElement.style.cursor = 'pointer';
        tagElement.style.borderBottom = '1px solid #444';
        
        const tagName = tag.tag.name;
        const categoryName = getCategoryName(tag.tag.category);
        const postCount = tag.tag.post_count;
        const tagColors = getTagColor(tag.tag.category);

        // タグ情報を含むコンテナ
        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.justifyContent = 'space-between';
        contentDiv.style.alignItems = 'center';
        contentDiv.style.gap = '8px';

        // タグ名のコンテナ
        const tagNameSpan = document.createElement('span');
        tagNameSpan.style.overflow = 'hidden';
        tagNameSpan.style.textOverflow = 'ellipsis';
        tagNameSpan.style.whiteSpace = 'nowrap';
        tagNameSpan.style.minWidth = '0';
        tagNameSpan.style.flex = '1';
        tagNameSpan.style.color = tagColors.color;
        tagNameSpan.textContent = tagName;
        tagNameSpan.title = tagName;

        // カテゴリと投稿数のコンテナ
        const infoSpan = document.createElement('span');
        infoSpan.style.color = '#888';
        infoSpan.style.whiteSpace = 'nowrap';
        infoSpan.style.flexShrink = '0';
        infoSpan.innerHTML = `<span style="color: #666;">[${categoryName}]</span> ${postCount}`;

        contentDiv.appendChild(tagNameSpan);
        contentDiv.appendChild(infoSpan);
        tagElement.appendChild(contentDiv);

        tagElement.addEventListener('mouseenter', () => {
            tagElement.style.backgroundColor = '#444';
            tagNameSpan.style.color = tagColors.hoverColor;
        });
        tagElement.addEventListener('mouseleave', () => {
            tagElement.style.backgroundColor = 'transparent';
            tagNameSpan.style.color = tagColors.color;
        });
        tagElement.addEventListener('click', () => {
            const selectedNode = app.graph._nodes.find(x => x.selected);
            if (selectedNode && selectedNode.widgets) {
                const promptWidget = selectedNode.widgets.find(w => w.type == "customtext");
                if (promptWidget) {
                    const currentValue = promptWidget.value;
                    promptWidget.value = currentValue ? `${currentValue}, ${tagName.replace(/_/g, " ")}` : tagName.replace(/_/g, " ");
                    selectedNode.setDirtyCanvas(true);
                }
            }
        });
        tagContainer.appendChild(tagElement);
    });

    // Escキーでポップアップを閉じる
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            popup.remove();
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', dragEnd);
        }
    };
    document.addEventListener('keydown', handleKeyDown);

    document.body.appendChild(popup);
    return popup;
}

app.registerExtension({
    name: "Prompt Converter",
    async setup() {
        const searchUploadSetting = app.ui.settings.addSetting({
            id: "searchRelatedTag",
            name: "Search Related Tag",
            category: ["Prompt Converter", "Settings"],
            type: "boolean",
            defaultValue: false,
            tooltip: "サンプル設定の説明文"
        });

        let currentPopup = null;
        let lastMousePosition = { x: 0, y: 0 };

        // マウス位置を追跡
        document.addEventListener('mousemove', (e) => {
            lastMousePosition = { x: e.clientX, y: e.clientY };
        });

        // キーボードショートカットの追加
        document.addEventListener('keydown', async (e) => {
            const validKeys = ['0', '1', '2', '3', '4', '5', '-'];
            if (e.altKey && validKeys.includes(e.key)) {
                let selectedText = window.getSelection().toString();
                let tags = selectedText.split(",");
                if (tags.length > 0) {
                    tags = tags.map(tag => tag.trim().replace(/ /g, "_"));
                    // タグは2件以下でないと弾かれるので削る
                    tags = tags.splice(0, 2);
                    const relatedTags = await searchRelatedTags(tags);
                    
                    // カテゴリでフィルタリング
                    const category = e.key === '-' ? null : parseInt(e.key);
                    const filteredTags = filterTagsByCategory(relatedTags.related_tags, category);
                    
                    // 既存のポップアップを削除
                    if (currentPopup) {
                        currentPopup.remove();
                    }

                    // 現在のマウス位置にポップアップを表示
                    currentPopup = createTagSuggestionPopup(filteredTags, {
                        x: lastMousePosition.x,
                        y: lastMousePosition.y
                    });
                }
            }
        });
    }
});


