# Prompt Converter

A ComfyUI custom node that converts prompts between different AI image generation models.

## Supported Models

- NovelAI (NAI)
- PonyXL (e621 format)
- Animagine
- Illustrious

## Features

- Converts tags between different formats
- Supports weight syntax conversion
- Auto quality tags for each model
- Rating tag support
- Tag sorting based on each model's preferred order

## Installation

1. Clone this repository to your ComfyUI custom_nodes folder:
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/vkff5833/ComfyUI-PromptConverter
```

2. Install required packages:
```bash
pip install -r requirements.txt
```

## Usage

![Screenshot showing the node interface in ComfyUI](images/node_interface.png)
*Node interface with input text area and settings*

1. Input your prompt text in any supported format
2. Select desired rating (safe/sensitive/questionable/explicit)
3. Configure options:
   - Unique: Remove duplicate tags
   - Auto quality tags: Add recommended quality tags
   - Remove weights: Strip all tag weights
4. Connect outputs to your workflow

## License

MIT License

---

# プロンプトコンバーター

異なるAI画像生成モデル間でプロンプトを変換するComfyUIカスタムノードです。

## 対応モデル

- NovelAI (NAI)
- PonyXL (e621形式)
- Animagine
- Illustrious

## 機能

- 異なる形式間でのタグ変換
- 重み付け構文の変換
- モデルごとの自動品質タグ
- レーティングタグのサポート
- モデルごとの推奨順序でのタグソート

## インストール方法

1. このリポジトリをComfyUIのcustom_nodesフォルダにクローンします:
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/vkff5833/ComfyUI-PromptConverter
```

2. 必要なパッケージをインストールします:
```bash
pip install -r requirements.txt
```

## 使用方法

![ComfyUIでのノードインターフェースのスクリーンショット](images/node_interface.png)
*入力テキストエリアと設定を備えたノードインターフェース*

1. 対応形式のプロンプトテキストを入力
2. レーティングを選択 (safe/sensitive/questionable/explicit)
3. オプションを設定:
   - Unique: 重複タグを削除
   - Auto quality tags: 推奨品質タグを追加
   - Remove weights: すべてのタグの重み付けを削除
4. ワークフローに出力を接続

## ライセンス

MIT License
