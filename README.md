# kikitori

Whisper + Ollama を使った文字起こし CLI

## 必要条件

- Bun
- SoX (録音用)
  ```bash
  # macOS
  brew install sox
  ```
- Ollama (テキスト整形用)
  ```bash
  brew install ollama
  ollama pull gemma3:1b
  ```
- whisper.cpp
  ```bash
  brew install whisper-cpp

  git clone https://github.com/ggerganov/whisper.cpp.git
  cd whisper.cpp && make
  # または whisper / whisper-cli コマンドがPATHに通っていること
  ```
- Whisper モデルファイル

## インストール

```bash
bun install
bun run build
```

## モデルのダウンロード

https://huggingface.co/ggerganov/whisper.cpp

モデルファイルを `models/` ディレクトリに配置してください。
`ggml-large-v3-turbo-q5_0.bin` がおすすめです。

## 使い方

### 基本的な文字起こし

```bash
# ビルド済みバイナリを使用
./dist/index.js

# または開発モードで実行
bun run dev

# 5秒間録音して文字起こし
./dist/index.js -d 5
```

### テンプレートを使った出力

```bash
./dist/index.js --template ./template.md
```

テンプレートファイルでは `{{transcription}}` プレースホルダーが文字起こし結果に置換されます。

例：
```markdown
# 議事録

## 内容
{{transcription}}
```

### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-t, --template <path>` | テンプレートファイルのパス（LLMプロンプトとして使用） | - |
| `-m, --model <path>` | Whisper モデルファイルのパス | `./models/ggml-large-v3-turbo-q5_0.bin` |
| `--ollama-model <name>` | 使用するOllamaモデル名 | `gemma3:1b` |
| `-d, --duration <seconds>` | 録音時間（秒）。指定しない場合は Enter または Ctrl+D で停止 | - |
| `-l, --language <code>` | 言語コード | `ja` |
| `--no-refine` | Ollamaによるテキスト整形をスキップ | - |

### 事前準備

Ollama サーバーを起動してください：

```bash
ollama serve
```
