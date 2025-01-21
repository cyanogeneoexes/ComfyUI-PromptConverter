import { app } from "../../scripts/app.js";
import { wikiDataArray } from "./danbooru_wiki.slim.js";

// wikiデータを保持する変数を追加
let wikiData = null;
// 設定を保持する変数を追加
let settings = {
    searchUpload: null,
    displayOtherName: null
};

// wikiデータを読み込む関数
function loadWikiData() {
    try {
        // 配列からオブジェクトに変換
        wikiData = wikiDataArray.reduce((acc, item) => {
            acc[item.name.replace(/ /g, '_')] = item;
            return acc;
        }, {});
        console.log('Wiki data loaded successfully');
    } catch (error) {
        console.error('Failed to load wiki data:', error);
        wikiData = {};
    }
}

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
        3: { color: '#d700d9', hoverColor: '#fd78ff' }, // Copyright
        4: { color: '#35c64a', hoverColor: '#93e49a' }, // Character
        5: { color: '#fd9200', hoverColor: '#ffc5a5' }  // Meta
    };
    return colors[category] || colors[0];
}

// タグ文字列を整形して配列に変換する関数
function parsePromptToTags(promptStr) {
    if (!promptStr) return [];
    return promptStr.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
}

// タグ配列を文字列に変換する関数
function formatTagsToPrompt(tags) {
    return tags.join(', ');
}

// タグを追加する関数
function addTagToPrompt(currentPrompt, newTag) {
    const tags = parsePromptToTags(currentPrompt);
    const normalizedNewTag = newTag.replace(/_/g, ' ').trim();
    
    // 大文字小文字を区別せずに重複チェック
    const isDuplicate = tags.some(tag => 
        tag.toLowerCase() === normalizedNewTag.toLowerCase()
    );
    
    if (!isDuplicate) {
        tags.push(normalizedNewTag);
    }
    
    return formatTagsToPrompt(tags);
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

    let currentCategory = null;
    let currentTags = tags;

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

    // タイトルと検索フィルターのコンテナ
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '8px';
    titleContainer.style.flex = '1';

    // タイトルテキスト
    const titleText = document.createElement('span');
    titleText.style.color = '#888';
    titleText.style.pointerEvents = 'none';
    titleText.textContent = 'Related Tags';
    titleContainer.appendChild(titleText);

    // フィルターボタンのコンテナ
    const filterContainer = document.createElement('div');
    filterContainer.style.display = 'flex';
    filterContainer.style.gap = '4px';

    // フィルターボタンを作成する関数
    function createFilterButton(category, label) {
        const button = document.createElement('div');
        button.style.padding = '2px 6px';
        button.style.cursor = 'pointer';
        button.style.borderRadius = '3px';
        button.style.fontSize = '12px';
        button.style.color = '#888';
        button.textContent = label;

        function updateButtonStyle() {
            if (currentCategory === category) {
                button.style.backgroundColor = '#444';
                button.style.color = '#fff';
            } else {
                button.style.backgroundColor = 'transparent';
                button.style.color = '#888';
            }
        }

        button.addEventListener('click', () => {
            currentCategory = currentCategory === category ? null : category;
            updateFilterButtons();
            updateTagList();
        });

        button.addEventListener('mouseenter', () => {
            if (currentCategory !== category) {
                button.style.backgroundColor = '#383838';
            }
        });

        button.addEventListener('mouseleave', () => {
            if (currentCategory !== category) {
                button.style.backgroundColor = 'transparent';
            }
        });

        return { button, updateStyle: updateButtonStyle };
    }

    // フィルターボタンを追加
    const filterButtons = [
        createFilterButton(null, 'ALL'),
        createFilterButton(0, 'GEN'),
        createFilterButton(1, 'ART'),
        createFilterButton(3, 'CPY'),
        createFilterButton(4, 'CHR'),
        createFilterButton(5, 'META')
    ];

    filterButtons.forEach(({ button }) => {
        filterContainer.appendChild(button);
    });

    function updateFilterButtons() {
        filterButtons.forEach(({ updateStyle }) => updateStyle());
    }

    titleContainer.appendChild(filterContainer);
    header.appendChild(titleContainer);

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

    // タグリストを更新する関数
    function updateTagList() {
        tagContainer.innerHTML = '';
        const filteredTags = currentCategory === null ? currentTags : filterTagsByCategory(currentTags, currentCategory);
        
        filteredTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.style.padding = '4px';
            tagElement.style.cursor = 'pointer';
            tagElement.style.borderBottom = '1px solid #444';
            
            const tagName = tag.tag.name;
            const categoryName = getCategoryName(tag.tag.category);
            const postCount = tag.tag.post_count;
            const tagColors = getTagColor(tag.tag.category);

            const contentDiv = document.createElement('div');
            contentDiv.style.display = 'flex';
            contentDiv.style.flexDirection = 'column';
            contentDiv.style.gap = '2px';

            // メインの行（タグ名と投稿数）
            const mainRow = document.createElement('div');
            mainRow.style.display = 'flex';
            mainRow.style.justifyContent = 'space-between';
            mainRow.style.alignItems = 'center';
            mainRow.style.gap = '8px';

            const tagNameSpan = document.createElement('span');
            tagNameSpan.style.overflow = 'hidden';
            tagNameSpan.style.textOverflow = 'ellipsis';
            tagNameSpan.style.whiteSpace = 'nowrap';
            tagNameSpan.style.minWidth = '0';
            tagNameSpan.style.flex = '1';
            tagNameSpan.style.color = tagColors.color;
            tagNameSpan.textContent = tagName;
            tagNameSpan.title = tagName;

            const infoSpan = document.createElement('span');
            infoSpan.style.color = '#888';
            infoSpan.style.whiteSpace = 'nowrap';
            infoSpan.style.flexShrink = '0';
            infoSpan.innerHTML = `<span style="color: #666;">[${categoryName}]</span> ${postCount}`;

            mainRow.appendChild(tagNameSpan);
            mainRow.appendChild(infoSpan);
            contentDiv.appendChild(mainRow);

            // 別名の行（設定が有効な場合のみ表示）
            if (settings.displayOtherName.value && wikiData) {
                const normalizedTagName = tagName.replace(/ /g, '_');
                const tagInfo = wikiData[normalizedTagName];
                if (tagInfo && tagInfo.otherNames && tagInfo.otherNames.length > 0) {
                    const otherNamesRow = document.createElement('div');
                    otherNamesRow.style.fontSize = '11px';
                    otherNamesRow.style.color = '#888';
                    otherNamesRow.style.paddingLeft = '8px';
                    otherNamesRow.textContent = tagInfo.otherNames.join(', ');
                    contentDiv.appendChild(otherNamesRow);
                }
            }

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
                        promptWidget.value = addTagToPrompt(promptWidget.value, tagName);
                        selectedNode.setDirtyCanvas(true);
                    }
                }
            });
            tagContainer.appendChild(tagElement);
        });
    }

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

        // ヘッダーまたはその子要素でドラッグを開始できるように
        const isHeaderOrChild = e.target === header || header.contains(e.target);
        // フィルターボタンのクリックイベントを妨げないように
        const isFilterButton = filterButtons.some(({ button }) => e.target === button);
        
        if (isHeaderOrChild && !isFilterButton) {
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

    // ドラッグイベントをヘッダー全体に適用
    header.style.cursor = 'move';
    titleContainer.style.cursor = 'move';
    titleText.style.cursor = 'move';
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // カテゴリ名を表示する関数
    function getCategoryName(category) {
        const categories = {
            0: "General",
            1: "Artist",
            3: "Copyright",
            4: "Character",
            5: "Meta"
        };
        return categories[category] || "";
    }

    // 初期タグリストを表示
    updateTagList();

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
        // wikiデータを読み込む（非同期である必要がなくなった）
        loadWikiData();
        
        // 設定をまとめて管理
        settings.searchRelatedTags = app.ui.settings.addSetting({
            id: "searchRelatedTags",
            name: "Search Related Tag",
            category: ["Prompt Converter", "0_searchRelatedTags"],
            type: "boolean",
            defaultValue: false,
            tooltip: "Search Related Tags"
        });

        settings.displayOtherName = app.ui.settings.addSetting({
            id: "displayOtherName",
            name: "Display Other Name",
            category: ["Prompt Converter", "1_displayOtherName"],
            type: "boolean",
            defaultValue: true,
            tooltip: "Display Other Name"
        });

        // 検索アイコンのポップアップを作成
        const searchButton = document.createElement('button');
        const defaultButtonText = '🔍Search Related Tags';
        const loadingButtonText = '<span class="spinner" style="display: inline-block; width: 10px; height: 10px; border: 2px solid #ffffff80; border-top-color: #fff; border-radius: 50%; margin-left: 5px; animation: spin 1s linear infinite;"></span>Search Related Tags';
        
        // スピナーのアニメーションスタイルを追加
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        searchButton.innerHTML = defaultButtonText;
        searchButton.style.position = 'fixed';
        searchButton.style.fontSize = '11px';
        searchButton.style.padding = '2px 2px';
        searchButton.style.backgroundColor = '#2d2d2d';
        searchButton.style.border = '1px solid #666';
        searchButton.style.borderRadius = '4px';
        searchButton.style.cursor = 'pointer';
        searchButton.style.color = '#fff';
        searchButton.style.display = 'none';
        searchButton.style.zIndex = '10000';
        searchButton.title = 'Search Related Tags';
        document.body.appendChild(searchButton);

        searchButton.addEventListener('mouseenter', () => {
            searchButton.style.backgroundColor = '#444';
        });

        searchButton.addEventListener('mouseleave', () => {
            searchButton.style.backgroundColor = '#2d2d2d';
        });

        searchButton.addEventListener('click', async () => {
            const selectedText = window.getSelection().toString();
            if (selectedText) {
                // 検索開始時にスピナーを表示
                searchButton.innerHTML = loadingButtonText;
                searchButton.style.cursor = 'wait';

                try {
                    let tags = selectedText.split(",");
                    if (tags.length > 0) {
                        tags = tags.map(tag => tag.trim().replace(/ /g, "_").replace(/\\/g, ""));
                        tags = tags.splice(0, 2);
                        const relatedTags = await searchRelatedTags(tags);
                        
                        if (currentPopup) {
                            currentPopup.remove();
                        }

                        currentPopup = createTagSuggestionPopup(relatedTags.related_tags, {
                            x: lastMousePosition.x,
                            y: lastMousePosition.y
                        });
                    }
                } finally {
                    // 検索完了時（成功/失敗に関わらず）スピナーを非表示
                    searchButton.innerHTML = defaultButtonText;
                    searchButton.style.cursor = 'pointer';
                    searchButton.style.display = 'none';
                }
            }
        });

        let currentPopup = null;
        let lastMousePosition = { x: 0, y: 0 };

        // マウス位置を追跡
        document.addEventListener('mousemove', (e) => {
            lastMousePosition = { x: e.clientX, y: e.clientY };
        });

        // テキスト選択を監視
        document.addEventListener('selectionchange', () => {
            if (!settings.searchRelatedTags.value) return;

            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (selectedText) {
                searchButton.style.left = `${lastMousePosition.x + 10}px`;
                searchButton.style.top = `${lastMousePosition.y + 10}px`;
                searchButton.style.display = 'block';
            } else {
                setTimeout(() => {
                    if (!window.getSelection().toString().trim()) {
                        searchButton.style.display = 'none';
                    }
                }, 100);
            }
        });

        // キーボードショートカットの追加
        document.addEventListener('keydown', async (e) => {
            if (!settings.searchRelatedTags.value) return;

            const validKeys = ['-'];
            if (e.altKey && validKeys.includes(e.key)) {
                let selectedText = window.getSelection().toString();
                let tags = selectedText.split(",");
                if (tags.length > 0) {
                    tags = tags.map(tag => tag.trim().replace(/ /g, "_"));
                    tags = tags.splice(0, 2);
                    const relatedTags = await searchRelatedTags(tags);
                    
                    if (currentPopup) {
                        currentPopup.remove();
                    }

                    currentPopup = createTagSuggestionPopup(relatedTags.related_tags, {
                        x: lastMousePosition.x,
                        y: lastMousePosition.y
                    });
                }
            }
        });
    }
});


