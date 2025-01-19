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

        // Alt+0 キーボードショートカットの追加
        document.addEventListener('keydown', async (e) => {
            if (e.altKey && e.key === '0') {
                let selectedText = window.getSelection().toString();
                let tags = selectedText.split(",");
                if (tags.length > 0) {
                    tags = tags.map(tag => tag.trim().replace(/ /g, "_"));
                    // タグは2件以下でないと弾かれるので削る
                    tags = tags.splice(0, 2);
                    const relatedTags = await searchRelatedTags(tags);
                    for (let relatedTag of relatedTags.related_tags) {
                        console.log(relatedTag);
                    }
                }
            }
        });
    }
});


