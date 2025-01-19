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
    }
});


