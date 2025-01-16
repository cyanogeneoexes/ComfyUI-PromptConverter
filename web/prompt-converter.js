import { app } from "../../scripts/app.js";
import { $el } from "../../scripts/ui.js";

app.registerExtension({
    name: "Prompt Converter",
    async setup() {
        app.ui.settings.addSetting({
            id: "searchUploadNode",
            name: "Search Upload Node",
            category: ["Prompt Converter", "Settings"],
            type: "boolean",
            defaultValue: false,
            tooltip: "サンプル設定の説明文"
        });
    }
}); 