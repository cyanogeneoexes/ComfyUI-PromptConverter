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

// タグ候補を表示するポップアップを作成
function createTagSuggestionPopup(tags, position) {
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.left = position.x + 'px';
    popup.style.top = position.y + 'px';
    popup.style.backgroundColor = '#2d2d2d';
    popup.style.border = '1px solid #666';
    popup.style.padding = '8px';
    popup.style.borderRadius = '4px';
    popup.style.zIndex = '10000';
    popup.style.maxHeight = '300px';
    popup.style.overflowY = 'auto';
    popup.style.width = '300px';

    // 閉じるボタンを追加
    const closeButton = document.createElement('div');
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.right = '8px';
    closeButton.style.top = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#888';
    closeButton.style.fontSize = '16px';
    closeButton.addEventListener('click', () => popup.remove());
    popup.appendChild(closeButton);

    // タグリストのコンテナ
    const tagContainer = document.createElement('div');
    tagContainer.style.marginTop = '20px';
    popup.appendChild(tagContainer);

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
        tagElement.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span>${tag.tag.name}</span>
                <span style="color: #888;">
                    <span style="color: #666;">[${getCategoryName(tag.tag.category)}]</span>
                    ${tag.tag.post_count}
                </span>
            </div>
        `;
        tagElement.addEventListener('mouseenter', () => {
            tagElement.style.backgroundColor = '#444';
        });
        tagElement.addEventListener('mouseleave', () => {
            tagElement.style.backgroundColor = 'transparent';
        });
        tagElement.addEventListener('click', () => {
            // 選択されたタグを入力欄に追加する処理をここに実装
            const selectedNode = app.canvas.node_selected;
            if (selectedNode && selectedNode.widgets) {
                const promptWidget = selectedNode.widgets.find(w => w.name === "prompt");
                if (promptWidget) {
                    const currentValue = promptWidget.value;
                    promptWidget.value = currentValue ? `${currentValue}, ${tag.tag.name}` : tag.tag.name;
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


