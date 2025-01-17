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

        // Ctrlが押されているかどうかを追跡
        let isCtrlPressed = false;

        document.addEventListener('keydown', async (e) => {
            // Ctrlキーが押された時の処理
            if (e.key === 'Control' && !isCtrlPressed && searchUploadSetting.value) {
                isCtrlPressed = true;
                const nodes = app.graph._nodes;
                const targetNodes = nodes.filter(node => node.type === "LoadImage");
                
                if (targetNodes.length > 0) {
                    app.canvas.selectNodes(targetNodes);
                }
            }
        });

        // Ctrlキーが離された時のフラグリセット
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control') {
                isCtrlPressed = false;
            }
        });
    }
});


