import { app } from "../../scripts/app.js";


app.registerExtension({
    name: "Prompt Converter",
    async setup() {
        const searchUploadSetting = app.ui.settings.addSetting({
            id: "searchUploadNode",
            name: "Search Upload Node",
            category: ["Prompt Converter", "Settings"],
            type: "boolean",
            defaultValue: false,
            tooltip: "サンプル設定の説明文"
        });
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                // グラフ内の全ノードを取得
                const nodes = app.graph._nodes;
                // 特定のタイトルを持つノードを探す
                const targetNodes = nodes.filter(node => node.type === "LoadImage");
                
                if (targetNodes.length > 0) {
                    console.log("Found Load Image nodes:", targetNodes);
                    // 必要に応じて見つかったノードを選択状態にする
                    app.canvas.selectNodes(targetNodes);
                }
            }
        });
    }
}); 

